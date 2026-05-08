# StreetPlayR OpsOS — Production Hardening Plan

## Orchestration Infrastructure Stabilization

---

# PART I: RESERVATION LIFECYCLE

## Current State

The reservation service has a correct 5-state machine (`pending → held → converted / released / expired`) with atomic RPC. However, **it is disconnected from the actual purchase flow** — reservations are created but never linked to orders, cart items, or PaymentIntents at the database level.

## Critical Bug Found

**The webhook handler (`app/api/webhooks/stripe/route.ts:138-143`) queries `order_id` on `inventory_reservations`, but no such column exists.** This means reservation transitions via webhook silently fail — reservations are never held/converted/released by payment events.

## Resolution Plan

### Step 1: Add `order_id` to `inventory_reservations` (Migration 00005)

```sql
ALTER TABLE inventory_reservations
  ADD COLUMN order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

CREATE INDEX idx_reservations_order ON inventory_reservations(order_id)
  WHERE order_id IS NOT NULL;
```

This is the lock that connects the reservation pipeline to the order pipeline.

### Step 2: Link Reservations to Orders During Checkout

The checkout flow must become:

```
1. User clicks "Purchase"
2. Server action:
   a. Create order (draft) → get order ID
   b. For each cart item, call reserve_inventory with order_id
   c. Create PaymentIntent via Stripe
   d. Link PaymentIntent to order
   e. Transition reservations: pending → held (via payment_intent.created)
   f. Transition order: draft → pending_payment
3. Client confirms payment via Stripe Elements
4. Webhook: payment_intent.succeeded →
   a. Process payment event (idempotent)
   b. Transition reservations: held → converted (for ALL linked reservations)
   c. Transition order: pending_payment → confirmed
```

#### New server action: `app/actions/checkout.ts`

```typescript
export async function initiateCheckoutAction(cartItems: CartItem[], shippingAddress: Address) {
  // 1. Verify auth
  // 2. Calculate totals (server-authoritative, never trust client)
  // 3. Create order
  // 4. Reserve inventory for each item (with order_id link)
  // 5. Create PaymentIntent (when Stripe SDK available)
  // 6. Return: orderId, paymentIntentClientSecret, reservationIds
  // All-or-nothing: if any reservation fails, roll back everything
}
```

### Step 3: Fix Webhook Reservation Lookup

The webhook handler currently does:
```typescript
const { data: reservations } = await admin
  .from('inventory_reservations')
  .select('id')
  .eq('order_id', (result.data as any)?.orderId)  // BUG: order_id doesn't exist
```

After Step 1, this becomes valid. Also add the case where the payment event result might not have an `orderId` — use the PaymentIntent to find the order first, then find reservations by `order_id`.

### Step 4: Add Double-Release Guard

```typescript
// In ReservationService.transitionState — before updating
// Add a DB-level check: only allow transition if current state allows it
// Currently the JS code checks this, but a concurrent request could pass the check
// Solution: add `WHERE reservation_state = <current_state>` to the UPDATE
```

Change the UPDATE to:
```sql
UPDATE inventory_reservations
SET reservation_state = 'converted', converted_at = now()
WHERE id = $1 AND reservation_state = 'held'  -- Only held → converted
```

### Step 5: Reservation Expiry at the Client Layer

Add a `checkReservationStatus` route or server action that the cart page polls:
- Returns reservation state (pending/held/expired/released)
- If expired: notify user, release item, prompt to re-add
- If released: check if intentional (user cancelled) or system (expiry)

---

# PART II: ORDER DETAIL ORCHESTRATION

## Current State

Order service has correct 9-state machine. But: `submitForPayment` has a race condition (status transitions BEFORE linking PaymentIntent ID), and order creation doesn't insert line items.

## Bugs Found

1. `submitForPayment(orderId, paymentIntentId, actorId)` transitions status FIRST, THEN updates `payment_intent_id` — if the update fails, the order is in `pending_payment` with no linked payment intent.

2. `OrderService.create()` only creates the order header — no `order_items` insertion.

3. `PaymentService.processWebhookEvent()` applies `.update({ status: targetStatus })` directly instead of going through `OrderService.transitionStatus()` — bypasses state validation, event logging, and transition map.

## Resolution Plan

### Step 1: Fix `submitForPayment` Atomicity

```typescript
async submitForPayment(orderId, paymentIntentId, actorId) {
  // Update both status AND payment_intent_id in ONE query
  const { data, error } = await admin
    .from('orders')
    .update({ 
      status: 'pending_payment', 
      payment_intent_id: paymentIntentId 
    })
    .eq('id', orderId)
    .eq('status', 'draft')  // Only if still in draft
    .select('*')
    .single();
  
  if (!data) return { success: false, error: 'Order not in draft status', code: 'CONCURRENT_MODIFICATION' };
  
  // Then record event
  await recordEvent({ ... });
  return { success: true, data: orderFromDb(data) };
}
```

### Step 2: Add Order Items to `create()`

Extend `OrderService.create()` to accept and insert order items in the same transaction:

```typescript
async create(params: {
  userId: string;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
  currency?: string;
  shippingAddress: Record<string, unknown>;
  items: { productId: string; variantId?: string; quantity: number; price: number; metadata?: Record<string, unknown> }[];
  metadata?: Record<string, unknown>;
}) {
  // Use the RPC or transaction to insert order + items atomically
  const { data, error } = await admin.rpc('create_order_with_items', {
    p_user_id: params.userId,
    p_subtotal: params.subtotal,
    p_shipping_cost: params.shippingCost,
    p_tax_amount: params.taxAmount,
    p_total: params.total,
    p_currency: params.currency ?? 'usd',
    p_shipping_address: params.shippingAddress,
    p_items: JSON.stringify(params.items),
    p_metadata: params.metadata ?? {},
  });
}
```

### Step 3: Make PaymentService Use OrderService for Transitions

```typescript
// In PaymentService.processWebhookEvent — replace:
await admin.from('orders').update({ status: targetStatus }).eq('id', order.id);
// With:
await OrderService.transitionStatus(order.id, targetStatus, 'system', `via payment: ${params.eventType}`);
```

This ensures every status change goes through the state machine, records proper events, and validates transitions.

### Step 4: Order Dossier Data Model

The order dossier needs to aggregate:
- Order header (from orders table)
- Line items (from order_items table)
- Payment events (from payment_events table)
- Operational events (from operational_events table, filtered by resource_id = order.id)
- Reservations (from inventory_reservations table, joined by order_id)
- Customer info (from profiles table)

Create a `getOrderDossier(orderId)` function that returns the full dossier:
```typescript
interface OrderDossier {
  order: Order;
  items: OrderItem[];
  paymentEvents: PaymentEvent[];
  timeline: OperationalEvent[];
  reservations: InventoryReservation[];
  customer: { id: string; name: string; email: string; tier: string };
}
```

---

# PART III: REAL-TIME INVENTORY SYNC

## Current State

Realtime subscriptions exist for wallet balance and stock updates. Stock subscription filters by `product_id` but stock varies by `variant_id`. No reservation or operational event subscriptions.

## Resolution Plan

### Step 1: Fix Stock Subscription to Use Variant-Level

```typescript
subscribeToStock(variantId: string, onUpdate: (stock: number) => void) {
  // Currently uses product_id — should use variant_id
  const channel = supabase
    .channel(`stock:${variantId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'product_variants',
        filter: `id=eq.${variantId}`,  // Fix: variant_id, not product_id
      },
      (payload) => {
        if (payload.new && typeof payload.new.stock_quantity === 'number') {
          onUpdate(payload.new.stock_quantity);
        }
      }
    )
    .subscribe();
}
```

### Step 2: Add Operational Events Subscription

For live timeline updates in OpsOS:

```typescript
subscribeToOperationalEvents(onEvent: (event: OperationalEvent) => void) {
  const supabase = createClient();
  const channel = supabase
    .channel('operational-events')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'operational_events',
      },
      (payload) => {
        onEvent(payload.new as OperationalEvent);
      }
    )
    .subscribe();
}
```

### Step 3: Add Reservation State Subscription

For PDP and cart real-time stock visibility:

```typescript
subscribeToReservationChanges(variantId: string, onUpdate: (reservations: number) => void) {
  // Listen for INSERT/UPDATE/DELETE on inventory_reservations for this variant
  // Recalculate available = stock - SUM(active reservations)
}
```

### Step 4: Reconnection Strategy

Wrap all subscriptions with exponential backoff reconnection:

```typescript
function withReconnect(subscribe: () => () => void): () => void {
  let cleanup: () => void;
  let retries = 0;
  
  function connect() {
    cleanup = subscribe();
  }
  
  // Listen for Supabase REALTIME_SUBSCRIBE_STATE changes
  // On 'CLOSED' or 'CHANNEL_ERROR': retry with backoff
  // On 'SUBSCRIBED': reset retries
  
  connect();
  return () => cleanup();
}
```

---

# PART IV: SUPABASE PRODUCTION READINESS

## Migration Verification

| ID | Name | Status | Notes |
|----|------|--------|-------|
| 00001 | Initial Schema | ✅ Applied | Core tables, enums, triggers, RLS |
| 00002 | Roles | ✅ Applied | Simple role enum, RLS policies |
| 00003 | Production Readiness | ✅ Applied | Expanded roles, reservation RPC, payment taxonomy |
| 00004 | Orchestration Infra | ✅ Applied | Events table, idempotency, expanded order_status |

## Missing: Migration 00005 (Production Hardening)

```sql
-- 1. Add order_id to reservations (fixes webhook → reservation link)
ALTER TABLE inventory_reservations
  ADD COLUMN order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
CREATE INDEX idx_reservations_order ON inventory_reservations(order_id) WHERE order_id IS NOT NULL;

-- 2. Add order_items table (missing from initial schema)
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id),
  variant_id  UUID REFERENCES product_variants(id),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  price       INTEGER NOT NULL, -- in cents
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- 3. Add created_at + updated_at to tables that need them
ALTER TABLE inventory_reservations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- 4. Create atomic order + items RPC
CREATE OR REPLACE FUNCTION create_order_with_items(...)
-- (full function body)

-- 5. Add composite index for event timeline queries
CREATE INDEX idx_events_domain_severity ON operational_events(domain, severity, created_at DESC);

-- 6. Add brand_id column to operational_events (future multi-brand)
ALTER TABLE operational_events ADD COLUMN brand_id UUID;

-- 7. Add unique constraint on (order_id, event_type) for payment idempotency
--    (prevents duplicate succeeded events for same order)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_order_event
  ON payment_events(order_id, event_type);
```

## RLS Review

| Table | RLS Enabled | Policies | Issues |
|-------|-------------|----------|--------|
| profiles | ✅ | Select (ops roles), Update (super/ops_admin) | ✅ OK |
| products | ❌ Not checked | — | Verify |
| product_variants | ❌ Not checked | — | Verify |
| orders | ❌ Not checked | — | **Must add** RLS |
| order_items | ❌ Not checked | — | **Must add** RLS |
| inventory_reservations | ✅ | User reads own, inserts own | ✅ OK |
| payment_events | ❌ Not checked | — | **Must add** RLS |
| operational_events | ✅ | Ops roles can read, insert allowed | ✅ OK |
| idempotency_keys | ✅ | Service role only | ✅ OK |
| cart_items | ❌ Not checked | — | Verify |
| wallet_transactions | ❌ Not checked | — | Verify |

**Critical**: `orders` table has NO RLS — any authenticated user could read ALL orders. Must add:

```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
  ON orders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Ops roles can read all orders"
  ON orders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin', 'fulfillment', 'support')
  ));

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Ops roles can update orders"
  ON orders FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin', 'fulfillment')
  ));
```

## Performance Index Review

| Table | Existing Indexes | Missing |
|-------|-----------------|---------|
| operational_events | domain, severity, resource, created, actor | **Domain+severity+created composite** (most common query pattern) |
| inventory_reservations | owner, variant+state, expires, owner+state | **order_id** (after Step 1) |
| orders | None found | user_id, status, payment_intent_id, created_at |
| payment_events | stripe_event_id (unique), order+event | order_id |
| profiles | Primary key only | role (used by every OpsGuard check) |

## Rediscover: Supabase Project Checklist

Before going live:
- [ ] Create production Supabase project
- [ ] Enable Phone Auth provider (configure SMS provider — Twilio/MSG91)
- [ ] Enable Google Auth provider (configure OAuth credentials)
- [ ] Apply all 5 migrations (00001 → 00005)
- [ ] Create at least one `super_admin` profile manually
- [ ] Set up Auth rate limiting (dashboard — protects OTP from brute force)
- [ ] Configure custom SMTP for auth emails (optional but recommended)
- [ ] Enable RLS on ALL tables that don't have it (orders, order_items, etc.)
- [ ] Add missing indexes for production query patterns
- [ ] Test reserve_inventory RPC with concurrent requests (race condition test)
- [ ] Test release_expired_reservations RPC
- [ ] Set up pg_cron or external cron for reservation expiry (every 5 min)
- [ ] Set up pg_cron or external cron for reconciliation (every 15 min)

---

# PART V: DEPLOYMENT HARDENING

## Current Status

| Area | Status | Gaps |
|------|--------|------|
| Security headers | ✅ In next.config.ts | None — HSTS, XFO, XSS, Content-Type, Referrer-Policy all set |
| Error boundaries | ✅ Root, store, ops | None |
| 404 page | ✅ app/not-found.tsx | None |
| Env validation | ✅ validateEnvironment() | Not called at startup — only exists as utility |
| TypeScript | ✅ Clean compile | None |
| Build | ✅ Passes (29 routes) | None |
| Stripe webhook verification | ⚠️ Stub | No actual signature verification |
| Rate limiting | ❌ None | Auth endpoints unprotected |
| CORS | ❌ Not configured | API routes allow all origins |
| Logging | ⚠️ Console.error | No structured logging |
| Runtime config verification | ❌ Not implemented | No startup health check |
| CI/CD | ❌ None | No automated deployment pipeline |
| Docker | ❌ None | No containerized dev environment |
| Monitoring | ❌ None | No error tracking (Sentry) or uptime monitoring |

## Resolution Plan

### Immediate (Before Any Real Traffic)

1. **Call `validateEnvironment()` at build time** in `next.config.ts` or during `layout.tsx` initialization
   ```typescript
   // In next.config.ts during `generateBuildId` or add to root layout
   if (process.env.NODE_ENV === 'production') {
     validateEnvironment();
   }
   ```

2. **Add structured logging utility**
   ```typescript
   // lib/logger.ts
   export const logger = {
     info: (msg: string, meta?: Record<string, unknown>) => 
       console.log(JSON.stringify({ level: 'info', msg, meta, timestamp: new Date().toISOString() })),
     warn: (msg: string, meta?: Record<string, unknown>) => 
       console.warn(JSON.stringify({ level: 'warn', msg, meta, timestamp: new Date().toISOString() })),
     error: (msg: string, meta?: Record<string, unknown>) => 
       console.error(JSON.stringify({ level: 'error', msg, meta, timestamp: new Date().toISOString() })),
   };
   ```
   Replace all `console.error('[Events] Failed...')` and similar with `logger`.

3. **Add rate limiting to auth endpoints** (optional, Supabase dashboard has built-in rate limiting for auth)

4. **Add health check endpoint** (`app/api/health/route.ts`)
   ```typescript
   export async function GET() {
     // Verify: Supabase connection, event table accessible, env vars present
     const checks = { supabase: false, events: false, env: false };
     // ... run checks ...
     return NextResponse.json({ status: checks.every(c => c) ? 'healthy' : 'degraded', checks });
   }
   ```

### Near-Term (Before Soft Launch)

5. **Set up error monitoring** (Sentry or similar)
6. **Configure Vercel environment variables** for all required vars
7. **Set up preview deployments** for PRs (Vercel automatically does this)
8. **Add GitHub Actions for CI** (lint → typecheck → build)

---

# PART VI: EVENT TIMELINE ARCHITECTURE

## Current State

`EventTimeline` service provides basic query (domain, severity, resource, actor filters) with limit/offset pagination. Backed by `operational_events` table with 5 indexes.

## Enhancements Needed

### 1. Cursor-Based Pagination

Replace offset-based with cursor-based for timeline views (infinite scroll):
```typescript
async query(params: {
  cursor?: string;  // ISO timestamp of the last visible event
  // ... existing filters
}): Promise<{ events: OperationalEvent[]; nextCursor: string | null }> {
  let query = admin.from('operational_events').select('*');
  
  if (params.cursor) {
    query = query.lt('created_at', params.cursor);
  }
  
  const { data } = await query
    .order('created_at', { ascending: false })
    .limit((params.limit ?? 50) + 1);  // Fetch one extra to detect "has more"
  
  const hasMore = data && data.length > (params.limit ?? 50);
  const events = data?.slice(0, params.limit ?? 50) ?? [];
  const nextCursor = hasMore ? events[events.length - 1]?.createdAt : null;
  
  return { events: events.map(...), nextCursor };
}
```

### 2. Timeline Grouping

Return events grouped by time period for UI rendering:
```typescript
async queryGrouped(params: {
  // ...filters
}): Promise<{ label: string; events: OperationalEvent[] }[]> {
  const { events } = await this.query(params);
  
  const groups: { label: string; events: OperationalEvent[] }[] = [];
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  for (const event of events) {
    const date = new Date(event.createdAt).toDateString();
    let label: string;
    if (date === today) label = 'Today';
    else if (date === yesterday) label = 'Yesterday';
    else label = new Date(event.createdAt).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' });
    
    const group = groups.find(g => g.label === label);
    if (group) group.events.push(event);
    else groups.push({ label, events: [event] });
  }
  
  return groups;
}
```

### 3. Timeline Statistics

```typescript
async getStats(params: {
  since?: string;
  domain?: EventDomain;
}): Promise<TimelineStats> {
  // Count events by domain and severity
  // Calculate error rate
  // Return recent errors
}
```

### 4. Real-time Event Push

Use Supabase Realtime to push new events to the timeline UI:
```typescript
// The RealtimeSubscriptions.subscribeToOperationalEvents provides this
// OpsOS timeline component subscribes on mount
// New events appear at the top of the timeline with a subtle animation
```

---

# PART VII: FAILURE RECOVERY FLOWS

## Every Failure Mode and Its Recovery

### 1. Reservation Creation Failure

| Failure | Recovery |
|---------|----------|
| Insufficient stock | Return `INSUFFICIENT_STOCK` to client. Cart shows "Out of stock" for that variant. User removes item or selects different variant. |
| RPC timeout | Retry once after 500ms. If still fails, return `RESERVATION_ERROR`. Cart checkout blocked. User prompted to retry. |
| Concurrent contention | Atomic RPC handles this — second request gets `INSUFFICIENT_STOCK`. |

### 2. Order Creation Failure

| Failure | Recovery |
|---------|----------|
| Order insert fails | Return `ORDER_CREATE_FAILED`. All reservations from step 1 must be released (manual or via TTL expiry). |
| Items insert fails | Need transaction — all-or-nothing. Use RPC that inserts order + items atomically. |
| PaymentIntent creation fails | Return error. Reservations released. Cart restored. |

### 3. Payment Flow Failure

| Failure | Recovery |
|---------|----------|
| Stripe Elements fails validation | Client-side error. No server state change. |
| PaymentIntent confirmation fails (card declined) | Stripe returns error. Order stays in `pending_payment`. User can retry with different card. Reservation stays `held`. |
| User closes browser during payment | Stripe PaymentIntent stays in `processing`. Webhook eventually delivers `payment_intent.succeeded` or `payment_intent.payment_failed`. If neither arrives within 2h, `releaseStaleReservations` reconciliation cleans up. |
| Stripe webhook delivery fails | Stripe retries webhook for up to 3 days with exponential backoff. Plus, reconciliation run detects orphaned payments. |

### 4. Webhook Processing Failure

| Failure | Recovery |
|---------|----------|
| Idempotency check fails | Already processed — return 200. Safe. |
| ORDER_NOT_FOUND (race condition) | Log as warning, return 200 (prevents Stripe retry spam). Reconciliation finds orphaned payment and auto-confirms when order appears. |
| Payment event insert fails | Return 500. Stripe retries. |
| Reservation transition fails | Log error. Order status was already updated. Reconciliation detects mismatch and fixes. |

### 5. SSR/Auth Failure

| Failure | Recovery |
|---------|----------|
| Supabase session refresh fails | Return null user. Gateway redirects to login. |
| Role resolution fails | Return 'member' role. Gateway denies OpsOS access. User sees 404. |
| Profile query fails | Return null. Root layout shows unauthenticated state. |

### 6. Realtime Subscription Drop

| Failure | Recovery |
|---------|----------|
| WebSocket disconnected | Exponential backoff reconnection (1s, 2s, 4s, 8s, max 30s). |
| Reauthorization required | Re-authenticate subscription with fresh session. |

## Reconciliation Safety Net

The `ReconciliationService.runFullCycle()` catches ALL of these:

```
1. findOrphanedPayments
   → Orders in pending_payment > 24h with confirmed Stripe payment
   → Auto-confirms order
   → Logs as system event with severity: warning

2. releaseStaleReservations
   → Reservations in held > 2h with no order activity
   → Releases back to pool
   → Logs as system event

3. (Future) detectStatusMismatch
   → Orders in confirmed > 1h still in confirmed (should be processing)
   → Orders in processing > 7 days (should be shipped)
   → Flags for manual review
```

---

# PART VIII: WEBHOOK RECONCILIATION STRATEGY

## Current State

Webhook handler receives Stripe events, maps to taxonomy, processes via `PaymentService.processWebhookEvent()`, then attempts reservation transitions (currently broken — `order_id` column missing).

## Resolution Plan

### Step 1: Fix the Reservation → Order Link

(See Part I, Step 1 — add `order_id` column to `inventory_reservations`)

### Step 2: Make Webhook Handler Use OrderService for Status Transitions

```typescript
// Replace PaymentService's direct UPDATE with OrderService.transitionStatus
// This ensures: state validation, event logging, proper transition flow
```

### Step 3: Add Webhook Processing Pipeline

```typescript
interface WebhookPipeline {
  1. Verify signature (Stripe SDK)    → invalid: 400
  2. Idempotency check                → duplicate: 200 (skip)
  3. Map event type to taxonomy       → unknown type: 200 (ack, ignore)
  4. Look up order by PaymentIntent   → not found: 200 (reconciliation handles)
  5. Log payment event                → fail: 500 (Stripe retries)
  6. Update order status (via OrderService) → fail: 500 (Stripe retries)
  7. Transition reservations (via ReservationService) → fail: 500 (Stripe retries)
  8. Complete idempotency key         → done
  9. Return 200
}
```

### Step 4: Add Webhook Dead-Letter Queue

For events that can't be processed after 3 retries:

```typescript
// Create failed_webhooks table
CREATE TABLE failed_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

// In webhook handler, after 3 retries from Stripe:
// Instead of returning 500, log the failure and return 200
// Store in failed_webhooks for manual replay from OpsOS
```

### Step 5: Add Manual Replay UI

OpsOS needs a "Webhook Replay" panel:
- List failed webhooks
- Show error, retry count, payload
- "Replay" button that re-processes the event
- "Dismiss" button for events that should be ignored

### Step 6: Monitoring Dashboard

```typescript
interface WebhookMetrics {
  totalReceived: number;
  processed: number;
  failed: number;
  ignored: number;
  avgProcessingTime: number;
  byEventType: Record<string, number>;
  recentErrors: { eventId: string; error: string; timestamp: string }[];
}
```

---

# SUMMARY: IMMEDIATE PRIORITY ORDER

| Priority | Action | System | Est. Effort |
|----------|--------|--------|-------------|
| 🔴 P0 | Create migration 00005 (add order_id, order_items, RLS, indexes) | Database | 2h |
| 🔴 P0 | Fix submitForPayment atomicity (update status+PI in one query) | Order | 30min |
| 🔴 P0 | Make PaymentService use OrderService for transitions | Payment | 1h |
| 🔴 P0 | Fix inventory_reservations missing order_id column | Migration | (in P0 above) |
| 🔴 P0 | Add RLS to orders table | Database | 30min |
| 🟡 P1 | Create initiateCheckoutAction (order+reservation+PI pipeline) | Checkout | 4h |
| 🟡 P1 | Add order_items to OrderService.create | Order | 1h |
| 🟡 P1 | Add order_id to reserve_inventory RPC | Reservation | 1h |
| 🟡 P1 | Build OrderDossier aggregation service | Order | 2h |
| 🟡 P1 | Add cursor-based pagination to EventTimeline | Events | 1h |
| 🟡 P1 | Add timeline grouping to EventTimeline | Events | 30min |
| 🟢 P2 | Add operational events realtime subscription | Realtime | 1h |
| 🟢 P2 | Add subscription reconnection strategy | Realtime | 2h |
| 🟢 P2 | Create health check endpoint | Deploy | 30min |
| 🟢 P2 | Call validateEnvironment at build time | Deploy | 15min |
| 🟢 P2 | Create structured logger utility | All | 30min |
| 🔵 P3 | Add webhook dead-letter queue | Webhook | 2h |
| 🔵 P3 | Create failed_webhooks table | Database | 30min |
| 🔵 P3 | Add manual replay UI | OpsOS | 3h |
| 🔵 P3 | Set up Vercel cron for reconciliation | Deploy | 1h |
| 🔵 P3 | Add Supabase production readiness checklist items | Deploy | varies |
