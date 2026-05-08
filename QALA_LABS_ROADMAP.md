# Qala Labs CRM — Transformation Roadmap

## From CRM Template → Cinematic Orchestration Platform

---

# PART I: ARCHITECTURAL FOUNDATION

## 1. Final Target Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                    STREETPLAYR (Commerce Layer)                    │
│                                                                    │
│  app/(store)/        Customer-facing cinematic commerce            │
│  ├── home, shop, collections, lookbook, journal, about             │
│  ├── product/[slug] — PDP with scarcity, editorial narrative       │
│  ├── cart — optimistic local-first with DB sync                    │
│  ├── checkout — Stripe Elements (PCI-compliant)                    │
│  ├── login — phone OTP + Google OAuth                              │
│  ├── profile/* — identity, orders, wallet, addresses, settings     │
│  └── auth/callback — OAuth code exchange                           │
│                                                                    │
│  Server Actions: auth, cart (checkpoint sync), order placement     │
│  API: POST /api/webhooks/stripe — webhook ingestion                │
│  Middleware: session refresh + auth gateway                         │
│                                                                    │
│  Owns: payment collection, customer auth, product catalog browse   │
│  Defers to Qala: order lifecycle, fulfillment, drops, inventory    │
└────────────────────────┬───────────────────────────────────────────┘
                         │
            Events · Webhooks · Sync Service
                         │
┌────────────────────────▼───────────────────────────────────────────┐
│                    QALA LABS CRM (Orchestration Layer)              │
│                                                                    │
│  app/(qala)/           Cinematic orchestration operating system    │
│  ├── dashboard — strategic overview, active orchestration          │
│  ├── drops/ — release lifecycle, product association, timing       │
│  ├── orders/ — order dossiers, fulfillment workflow                │
│  ├── fulfillment/ — batch management, carrier integration          │
│  ├── inventory/ — allocation intelligence, variant pools           │
│  ├── customers/ — lifetime dossiers, tier progression, activity    │
│  ├── wallet/ — incentive authority, ledger, burn analytics         │
│  ├── editorial/ — campaign workflow, content scheduling            │
│  ├── support/ — ticket orchestration, escalation workflows         │
│  ├── brand/ — multi-brand management, configuration                │
│  ├── analytics/ — observability, event log, alerts                 │
│  └── ai/ — workflow engine, predictions, anomaly detection         │
│                                                                    │
│  Owns: order lifecycle, fulfillment orchestration, inventory       │
│  intelligence, drops management, customer intelligence, wallet     │
│  authority, editorial workflows, support, multi-brand config       │
└────────────────────────────────────────────────────────────────────┘
```

### Core Principle: Two Systems, One Event Bus

StreetPlayR and Qala Labs CRM are **architecturally separate** domains within the same deployment (Phase 1), eventually deployable as independent units (Phase 3+). They communicate exclusively through:

- **Operational Events** (DB-backed event log — already exists as `operational_events` table)
- **Webhooks** (Stripe → StreetPlayR → Event → Qala Labs CRM)
- **Sync Service** (background reconciliation — already exists as `ReconciliationService`)

Neither system directly calls the other's functions. This is the non-negotiable boundary.

---

## 2. System Boundary Map

### StreetPlayR Owns (stays in app/(store)/)

| System | Reason |
|--------|--------|
| Customer-facing store UI | Brand experience, editorial narrative, mobile-first cinematic UX |
| Auth (login, signup, OAuth) | Customer identity — StreetPlayR owns customer relationship |
| Cart (client + DB sync) | Shopping experience — optimistic, realtime |
| Checkout (Stripe Elements) | PCI compliance, payment collection |
| Product catalog browse | PDP, collections, lookbook — editorial product storytelling |
| Customer profile (read/write) | Identity, addresses, settings |
| Webhook ingestion point | Stripe webhooks enter here → relayed as events |
| Session management | Auth cookie, session refresh, middleware |

### Qala Labs CRM Owns (moves to app/(qala)/)

| System | Reason |
|--------|--------|
| Order lifecycle orchestration | Full 9-state machine — needs ops UI, not customer-facing |
| Fulfillment management | Batch picking, carrier integration, tracking |
| Inventory intelligence | Allocation pools, contention detection, restock planning |
| Drop/release lifecycle | Calendar, timing engine, product association |
| Customer intelligence | Lifetime value, tier progression, activity patterns |
| Wallet/Incentive authority | Ledger, burn rate, bonus strategies |
| Editorial workflow | Campaign scheduling, content calendar, asset approval |
| Support orchestration | Ticket lifecycle, escalation, resolution tracking |
| Multi-brand management | Brand config, domain mapping, feature flags |
| System observability | Event log, alerts, reconciliation monitoring |
| AI workflow engine | Predictions, anomaly detection, automation rules |

### Shared (cross-cutting, in lib/shared/)

| System | Notes |
|--------|-------|
| Operational event bus | `operational_events` table — append-only, domains: order, reservation, inventory, fulfillment, drop, customer, editorial, support, system, ai |
| Idempotency guard | `idempotency_keys` table — shared across both systems |
| Auth base (Supabase) | Same Supabase project, same user pool, same auth provider |
| RBAC permission matrix | Same role definitions, separate UI enforcement |
| Supabase clients | 4 variants (browser, server, middleware, admin) — shared |
| Environment validation | `validateEnvironment()` — shared across entry points |
| Database migrations | Single migration set, applies to shared DB |

---

## 3. Infrastructure Segmentation

### Phase 1 (Monorepo — Current Next.js App)

Single Next.js 16 app with strict route grouping:

```
app/
├── (store)/       → StreetPlayR commerce routes
├── (qala)/        → Qala Labs CRM routes  (transformed from app/(ops)/)
├── (auth)/        → Shared auth pages (login, callback, auth-code-error)
├── actions/       → Server actions (separated by domain)
├── api/           → API routes (webhooks, inter-system API)
├── layout.tsx     → Root layout (fonts, providers — minimal, no store-specific)
└── globals.css    → Design tokens (brand theme + ops theme)
```

Advantages: Shared runtime, zero network overhead, same auth session, atomic deploys.
Disadvantage: Cannot scale independently, single deployment risk.

### Phase 2 (Separate Deployments — Independent Next.js Apps)

```
repository-root/
├── apps/
│   ├── store/           → Standalone Next.js app: StreetPlayR commerce
│   └── qala/            → Standalone Next.js app: Qala Labs CRM
├── packages/
│   ├── shared-types/    → Domain types, event schemas, API contracts
│   ├── event-bus/       → Event publishing/subscription client
│   ├── auth/            → Shared auth utilities
│   └── ui/              → Design system (optional, systems have different aesthetics)
├── services/
│   ├── sync/            → Background sync service (orphaned payments, stale reservations)
│   └── events/          → Event router (streams events between systems)
├── infra/
│   ├── database/        → Shared migrations
│   └── terraform/       → Infrastructure as code
└── docker-compose.yml   → Local development with all services
```

### Phase 3 (Full Micro-Service — Mature Scale)

```
                    Event Bus (Kafka/PubSub)
                    ┌──────────────────┐
                    │  System Events   │
                    └──┬──┬──┬──┬──┬──┘
                       │  │  │  │  │
    ┌──────────────────┘  │  │  │  └──────────────────┐
    ▼                     ▼  ▼  ▼                     ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐
│ Store    │  │ Qala CRM │  │ Sync     │  │ AI Engine    │
│ (Next.js)│  │ (Next.js)│  │ (Worker) │  │ (Python/ML)  │
└──────────┘  └──────────┘  └──────────┘  └──────────────┘
    │              │              │               │
    └──────────────┴──────┬──────┴───────────────┘
                          ▼
              ┌──────────────────────┐
              │   Shared Database    │
              │  (Supabase/Postgres) │
              │  schemas:            │
              │  - store_*           │
              │  - qala_*            │
              │  - shared_*          │
              └──────────────────────┘
```

---

# PART II: SYSTEM DESIGN

## 4. Orchestration Layer Design

### Current (StreetPlayR OpsOS)

```
lib/orchestration/
├── types.ts           ← Flat type definitions
├── events.ts          ← Event timeline service
├── idempotency.ts     ← Idempotency guard
├── order.ts           ← Order state machine
├── payment.ts         ← Payment event processing
├── reconciliation.ts  ← Reconciliation runner
└── reservation.ts     ← Reservation state machine
```

### Target (Qala Labs CRM)

```
lib/orchestration/
├── core/
│   ├── types.ts              ← Domain types (order, reservation, fulfillment, etc.)
│   ├── state-machine.ts      ← Generic state machine engine (states, transitions, guards)
│   ├── event-bus.ts          ← Event publishing (writes to operational_events + triggers subscribers)
│   ├── idempotency.ts        ← Idempotency guard (shared)
│   └── errors.ts             ← Orchestration error types
│
├── order/
│   ├── lifecycle.ts          ← Order state machine (9 states, transitions, guards)
│   ├── service.ts            ← Order CRUD + business logic
│   └── transitions/          ← Per-transition side effects
│       ├── confirm.ts        ← On confirm: trigger reservation conversion, emit event
│       ├── ship.ts           ← On ship: update fulfillment, emit event
│       └── cancel.ts         ← On cancel: release reservations, refund if paid
│
├── reservation/
│   ├── lifecycle.ts          ← Reservation state machine (5 states)
│   └── service.ts            ← Reservation CRUD + expiry
│
├── fulfillment/
│   ├── lifecycle.ts          ← Batch state machine (draft → picking → shipped → delivered)
│   ├── service.ts            ← Fulfillment CRUD, carrier integration
│   └── batch.ts              ← Batch grouping logic (orders → batches)
│
├── drop/
│   ├── lifecycle.ts          ← Drop state machine (draft → scheduled → active → cooling → archived)
│   ├── service.ts            ← Drop CRUD, product association
│   └── timing.ts             ← Timing engine, countdown, auto-activation
│
├── customer/
│   ├── intelligence.ts       ← Tier progression, LTV calculation, activity patterns
│   └── service.ts            ← Customer profile, merge, segmentation
│
├── wallet/
│   ├── service.ts            ← Balance management, transaction ledger
│   ├── incentives.ts         ← Bonus strategies, referral rewards
│   └── burn.ts               ← Burn rate analysis, redemption events
│
├── editorial/
│   ├── workflow.ts           ← Campaign lifecycle, content approval
│   └── calendar.ts           ← Content scheduling, publishing
│
├── support/
│   ├── lifecycle.ts          ← Ticket state machine (open → triage → in_progress → resolved)
│   ├── service.ts            ← Ticket CRUD, assignment
│   └── escalation.ts         ← Escalation rules, SLA tracking
│
├── reconciliation.ts         ← Cross-system reconciliation (orphaned payments, stale reservations)
│
├── ai/
│   ├── engine.ts             ← AI workflow execution (rules → predictions → actions)
│   ├── predictions.ts        ← Demand forecasting, inventory recommendations
│   └── anomalies.ts          ← Anomaly detection (unusual order patterns, fraud signals)
│
└── brand/
    ├── context.ts            ← Brand context resolver (current brand from request/domain)
    ├── config.ts             ← Brand configuration (TTLs, tiers, currency, feature flags)
    └── service.ts            ← Brand CRUD, domain mapping
```

### State Machine Engine (Generic)

Every lifecycle uses a shared state machine pattern:

```typescript
interface StateMachineDefinition<S extends string, T extends string> {
  states: S[];
  initialState: S;
  transitions: {
    [key in T]?: {
      from: S[];
      to: S;
      guard?: (context: TransitionContext) => boolean | Promise<boolean>;
      effects?: (context: TransitionContext) => Promise<void>;
    };
  };
}
```

This enforces: valid transitions are declared explicitly, side effects are isolated per transition, guards prevent illegal transitions, and every transition emits an event.

---

## 5. Multi-Brand Architecture Strategy

### Brand Data Model

```typescript
interface Brand {
  id: string;                    // UUID
  slug: string;                  // URL-safe: "streetplayr", "qala-labs"
  name: string;                  // Display: "StreetPlayR", "Qala Labs"
  domain: string | null;         // Custom domain: "streetplayr.in"
  status: 'active' | 'inactive' | 'suspended';
  config: BrandConfig;           // JSON — brand-specific configuration
  createdAt: string;
  updatedAt: string;
}

interface BrandConfig {
  // Identity
  logo: string | null;
  colors: { primary: string; accent: string; };
  fonts: { display: string; body: string; mono: string; };
  
  // Commerce
  currency: string;              // "INR", "USD"
  phonePrefix: string;           // "+91", "+1"
  timezone: string;              // "Asia/Kolkata"
  
  // Orchestration
  reservationTTL: number;        // Seconds — default 900 (15 min)
  dropActivationMode: 'manual' | 'scheduled' | 'event';
  
  // Tiers
  tiers: {                       // Brand-specific loyalty tiers
    name: string;                // "Genesis", "Tier 1", "Member"
    threshold: number;           // Minimum wallet balance
    benefits: string[];          // ["early_access", "free_shipping"]
  }[];
  
  // Feature flags
  features: {
    wallet: boolean;
    drops: boolean;
    reservations: boolean;
    aiWorkflows: boolean;
  };
}
```

### Scoping Strategy

Every domain table in Qala Labs CRM carries `brand_id`:

- `qala_orders` → `brand_id`
- `qala_drops` → `brand_id`
- `qala_fulfillment_batches` → `brand_id`
- `qala_inventory_allocations` → `brand_id`
- `qala_customer_profiles` → `brand_id` (or multi-brand)
- `qala_wallet_transactions` → `brand_id`
- `qala_editorial_campaigns` → `brand_id`
- `qala_support_tickets` → `brand_id`

Cross-brand tables (shared):
- `operational_events` → `brand_id` (optional — can be cross-brand)
- `idempotency_keys` → `brand_id`
- `brands` itself
- `profiles` (Supabase auth) → user can be associated with multiple brands

### Multi-Brand Auth (RBAC Scoping)

Roles are scoped by brand:

```
super_admin@system     → Everything, all brands
ops_admin@streetplayr  → Admin for StreetPlayR only
fulfillment@streetplayr→ Fulfillment for StreetPlayR only
editorial@qalalabs     → Editorial for Qala Labs only
```

Implementation: `user_brand_roles` join table:

```sql
CREATE TABLE public.user_brand_roles (
  user_id UUID REFERENCES auth.users(id),
  brand_id UUID REFERENCES brands(id),
  role user_role NOT NULL,
  PRIMARY KEY (user_id, brand_id)
);
```

### Brand Resolution Flow

1. Request comes in with brand hint (domain, header, or subdomain)
2. `BrandContext` middleware resolves current brand
3. All scoped queries include `brand_id = resolvedBrand.id`
4. Auth checks verify role exists for that brand or user is super_admin
5. UI renders brand-specific config (colors, fonts, feature flags)

---

## 6. RBAC Evolution Strategy

### Current (StreetPlayR OpsOS)

7 roles, 25 permissions, flat structure. Roles: `super_admin`, `ops_admin`, `fulfillment`, `editorial`, `support`, `viewer`, `member`.

### Target (Qala Labs CRM)

**Two-axis RBAC**: Role × Brand scope

| Role | System Scope | Brand Scope |
|------|-------------|-------------|
| `super_admin` | All permissions, all brands | Cross-brand |
| `ops_admin` | All ops permissions | Per-brand |
| `fulfillment` | Fulfillment + inventory + orders:view | Per-brand |
| `editorial` | Products:view/edit, drops:view/create, content | Per-brand |
| `support` | Orders:view, customers:view/edit, tickets | Per-brand |
| `viewer` | Read-only across domains | Per-brand |
| `brand_admin` | All ops for a single brand | Per-brand (NEW) |
| `analyst` | Reports:view, analytics:view | Per-brand (NEW) |
| `ai_operator` | AI workflow:view/create/edit | Per-brand (NEW) |
| `member` | No ops access | N/A |

### Permission Expansion

Current: 25 permissions. Target: ~60 permissions organized by domain module:

```
Domain: drops
├── drops:view
├── drops:create
├── drops:edit
├── drops:schedule
├── drops:activate
├── drops:archive
├── drops:link_products

Domain: fulfillment
├── fulfillment:view
├── fulfillment:create_batch
├── fulfillment:assign
├── fulfillment:mark_shipped
├── fulfillment:mark_delivered
├── fulfillment:carrier_config

Domain: customers
├── customers:view
├── customers:edit
├── customers:merge
├── customers:export
├── customers:segment
├── customers:notes

Domain: wallet
├── wallet:view
├── wallet:adjust
├── wallet:create_bonus
├── wallet:view_ledger

Domain: editorial
├── editorial:view
├── editorial:create_campaign
├── editorial:edit_campaign
├── editorial:approve_assets
├── editorial:publish

Domain: support
├── support:view
├── support:assign
├── support:escalate
├── support:resolve
├── support:sla_config

Domain: ai
├── ai:view
├── ai:create_workflow
├── ai:edit_workflow
├── ai:approve_actions

Domain: brand
├── brand:view
├── brand:edit_config
├── brand:manage_domain
├── brand:manage_users

Domain: analytics
├── analytics:view
├── analytics:create_report
├── analytics:export

Domain: system
├── system:view_config
├── system:edit_config
├── system:view_logs
├── system:view_events
├── system:run_reconciliation
├── system:manage_webhooks
```

### Migration Path

1. Extend `user_role` enum with new roles (`brand_admin`, `analyst`, `ai_operator`)
2. Create `user_brand_roles` join table
3. Add new permission strings to `Permission` type
4. Migrate existing user roles to `user_brand_roles` with brand_id = streetplayr
5. Add brand-context middleware to resolve current brand
6. Update gateway to check brand-scoped roles
7. Retire flat role column in profiles (or keep legacy)

---

## 7. Event-Driven Architecture Strategy

### Event Schema

```typescript
interface SystemEvent {
  id: string;
  brandId?: string;
  domain: EventDomain;       // order, reservation, inventory, fulfillment, drop, customer, editorial, support, system, ai
  action: string;            // order.created, fulfillment.shipped, etc.
  severity: 'info' | 'warning' | 'error' | 'critical';
  source: string;            // "streetplayr", "qala-crm", "stripe-webhook", "sync-service"
  actorId?: string;          // User who triggered, or "system"
  resourceType: string;      // "order", "reservation", "product"
  resourceId: string;        // UUID of the resource
  payload: Record<string, unknown>;  // Arbitrary data payload
  metadata: Record<string, unknown>; // Correlation IDs, trace info
  createdAt: string;
}
```

### Event Flow Diagram

```
Stripe Webhook
    │
    ▼
StreetPlayR /api/webhooks/stripe
    │
    ├── 1. Verify signature
    ├── 2. Map to PaymentEventType
    ├── 3. Process payment event (update order, release/convert reservation)
    └── 4. Emit event: payment.succeeded
              │
              ▼
        Event Bus (operational_events table)
              │
              ├── Qala Labs CRM (polling or realtime subscription)
              │   ├── order.payment_confirmed → update order dossier
              │   ├── order.payment_confirmed → trigger fulfillment prep
              │   └── reservation.converted → update inventory intelligence
              │
              ├── Sync Service
              │   └── Reconciliation cron checks for missed events
              │
              └── Analytics
                  └── Stream events to reporting
```

### Event Categories

| Category | Direction | Examples |
|----------|-----------|----------|
| Commerce → CRM | StreetPlayR emits → Qala consumes | `order.placed`, `payment.confirmed`, `customer.registered` |
| CRM → Commerce | Qala emits → StreetPlayR consumes | `fulfillment.shipped`, `order.cancelled`, `inventory.restocked` |
| System | Both emit | `reconciliation.completed`, `webhook.received`, `anomaly.detected` |
| External → System | External → StreetPlayR or Qala | `stripe.payment_intent.succeeded`, `shipengine.tracking.updated` |

### Real-time Subscription Strategy

- Use Supabase Realtime for intra-system event delivery (streetplayr + qala within same project)
- Use `operational_events` table INSERT subscription for live timeline updates
- Long-polling fallback for reliability
- Webhook relay for external systems

---

## 8. API / Service-Layer Strategy

### Internal APIs (Server Actions)

Both StreetPlayR and Qala Labs CRM use Next.js Server Actions for mutations. They remain separate:

```
StreetPlayR Server Actions:
app/actions/
├── auth.ts           → login, logout, getProfile
├── cart.ts           → syncCart, pullCart
├── reservation.ts    → reserve, release, getAvailableStock
├── order.ts          → createOrder, submitForPayment, getMyOrders
└── checkout.ts       → createPaymentIntent (future, needs Stripe SDK)

Qala Labs CRM Server Actions:
app/actions/
├── drops/            → create, schedule, activate, archive, linkProduct
├── orders/           → updateStatus, assignFulfillment, cancel, refund
├── fulfillment/      → createBatch, assignToBatch, markShipped, markDelivered
├── inventory/        → adjustAllocation, reconcile, setRestockThreshold
├── customers/        → updateProfile, merge, addNote, exportSegment
├── wallet/           → adjustBalance, createBonus, viewLedger
├── editorial/        → createCampaign, approveAsset, publish
├── support/          → createTicket, assign, escalate, resolve
├── ai/               → triggerWorkflow, approveAction, dismissAnomaly
└── brand/            → create, updateConfig, manageUsers
```

### External APIs (Routes)

```
/app/api/
├── webhooks/
│   └── stripe/route.ts     ← StreetPlayR — Stripe event ingestion
├── qala/                   ← Qala Labs CRM internal API (for sync service)
│   ├── events/route.ts     ← Receive events from StreetPlayR
│   └── sync/route.ts       ← Reconciliation endpoint
└── health/route.ts          ← Shared health check
```

### Sync Service

A lightweight worker that:
1. Runs reconciliation cycles (`ReconciliationService.runFullCycle()`)
2. Detects orphaned payments and auto-confirms orders
3. Releases stale reservations
4. Fixes drift between StreetPlayR and Qala Labs CRM data
5. Logs all corrections as system events

Can run as: Vercel Cron Job, GitHub Actions scheduled workflow, or standalone Node.js worker.

---

## 9. Webhook Architecture

### Inbound Webhooks

```
Stripe
  │  POST /api/webhooks/stripe
  ▼
StreetPlayR
  ├── Verify signature (Stripe SDK)
  ├── Map event to taxonomy (payment_intent.succeeded → PaymentEventType)
  ├── Process: update order status, convert/release reservations
  ├── Record idempotency key (prevents duplicate processing)
  │
  └── Emit operational event ──► Event Bus
                                  │
                                  ▼
                            Qala Labs CRM
                            (subscribes via Realtime)
```

### Outbound Webhooks (Qala Labs CRM → External)

```
Qala Labs CRM
  │
  ├── ShipEngine Webhook
  │   └── fulfillment.shipped → POST to ShipEngine API → tracking updates
  │
  ├── Notification Service
  │   └── order.shipped → POST to notification provider → SMS/email to customer
  │
  └── Analytics Pipeline
      └── Various events → POST to analytics provider → dashboards
```

### Webhook Reliability

- Idempotency keys prevent duplicate processing
- Failed webhook deliveries retried with exponential backoff (3 attempts)
- Dead-letter queue for persistent failures (logged as operational events with severity: error)
- Manual replay capability via Qala Labs CRM UI

---

## 10. Operational Timeline Architecture

### Current State

The `EventTimeline` service in `lib/orchestration/events.ts` provides basic query capabilities — filtering by domain, severity, resource, actor. It queries the `operational_events` table.

### Target Architecture

The timeline is the **primary navigational metaphor** of Qala Labs CRM — replacing the table/CRUD-first approach entirely.

```
Timeline (unified)                Dossier (per-entity)
    │                                    │
    │  All events across all             │  Events filtered to a single
    │  domains, filterable               │  resource (order, customer, drop)
    │                                    │
    ▼                                    ▼
┌─────────────────────┐    ┌──────────────────────────┐
│ System Timeline     │    │ Order Dossier Timeline   │
│                     │    │                          │
│ 10:04 Order #0421  │    │ 10:04 Fulfillment picking │
│       processing   │    │ 09:42 Payment confirmed   │
│ 10:04 Drop genesis │    │ 09:40 Order submitted     │
│       active       │    │ 09:38 Reservation held    │
│ 09:42 Reservation  │    │                          │
│       expired      │    └──────────────────────────┘
│ 09:15 Inventory    │
│       reconciled   │
└─────────────────────┘
```

### Enhanced Timeline Service

```typescript
interface TimelineOptions {
  domain?: EventDomain[];
  severity?: EventSeverity[];
  resourceType?: string;
  resourceId?: string;
  brandId?: string;
  actorId?: string;
  since?: string;
  until?: string;
  limit?: number;
  cursor?: string;         // Cursor-based pagination
  groupBy?: 'domain' | 'resource' | 'actor' | 'day';
  includeMetadata?: boolean;
}

interface TimelineEvent {
  id: string;
  timestamp: string;
  domain: EventDomain;
  severity: EventSeverity;
  action: string;
  actor: { id: string; name: string; } | 'system';
  resource: { type: string; id: string; label: string; };
  message: string;
  metadata?: Record<string, unknown>;
  brandId?: string;
}

// Timeline grouping for UI
interface TimelineGroup {
  label: string;           // "Today", "Yesterday", "May 5, 2026"
  events: TimelineEvent[];
}

// Timeline statistics
interface TimelineStats {
  total: number;
  byDomain: Record<EventDomain, number>;
  bySeverity: Record<EventSeverity, number>;
  errorRate: number;
  recentErrors: TimelineEvent[];
}
```

### Dossier Timeline

Every entity in Qala Labs CRM has a dossier that includes:
- **Narrative header**: Entity name, status, key metrics, current state
- **Timeline**: Filtered events for this entity (immutable, append-only)
- **Related entities**: Connected orders, customers, drops, tickets
- **Actions**: State transitions available based on current state + RBAC

---

## 11. Dossier System Architecture

### What is a Dossier?

A dossier replaces the concept of a "detail page" or "CRUD form." It's a cinematic, narrative-driven view of an entity that tells the complete operational story.

### Dossier Structure (Generic)

```
┌─────────────────────────────────────────────┐
│  DOSSIER HEADER                              │
│  Entity name, status badge, ID, brand tag   │
│  Key metrics (horizontal)                    │
│  Quick actions (state transitions)           │
├─────────────────────────────────────────────┤
│  NARRATIVE PANEL                             │
│  Current state description, alerts, context  │
├──────────────────┬──────────────────────────┤
│  TIMELINE        │  DETAIL PANEL             │
│  (events for     │  (structured data:        │
│   this entity)   │   fields, relations,      │
│                  │   metadata)               │
│                  │                           │
│  • Event 1       │  Field: Value             │
│  • Event 2       │  Field: Value             │
│  • Event 3       │  Related: [links]         │
│                  │                           │
├──────────────────┴──────────────────────────┤
│  RELATED DOSSIERS                            │
│  Connected entities (orders → customer, etc.)│
├─────────────────────────────────────────────┤
│  SYSTEM FOOTER                               │
│  Last updated, sync status, data authority   │
└─────────────────────────────────────────────┘
```

### Dossier Types

| Dossier | Timeline Sources | Related Dossiers | Key Actions |
|---------|-----------------|------------------|-------------|
| Order | reservation, payment, fulfillment, system | Customer, Product, Fulfillment Batch | Submit, Confirm, Cancel, Refund, Ship |
| Customer | order, wallet, support, system | Orders, Wallet, Support Tickets | Edit, Merge, Export, Adjust Wallet |
| Drop | editorial, inventory, system | Products, Campaign, Fulfillment Batches | Schedule, Activate, Archive, Link Product |
| Product | inventory, editorial, drop | Drops, Variants, Campaign | Edit, Link to Drop, Adjust Allocation |
| Fulfillment Batch | fulfillment, shipping, system | Orders, Carrier | Assign, Mark Shipped, Track |
| Support Ticket | support, system | Customer, Order | Assign, Escalate, Resolve |
| Wallet | wallet, system | Customer, Transactions | Adjust, Create Bonus, View Ledger |
| Campaign | editorial, system | Drops, Products, Assets | Approve, Publish, Archive |
| Brand | system | All scoped entities | Edit Config, Manage Users, Feature Flags |

### Dossier Implementation Pattern

```typescript
// Generic dossier component pattern
interface DossierProps<T> {
  entity: T;
  timeline: TimelineEvent[];
  related: Record<string, RelatedEntity[]>;
  actions: Action[];
  config: BrandConfig;
}

// Each dossier page follows this shape:
// app/(qala)/orders/[orderId]/page.tsx
//   → fetches order + timeline + related entities
//   → renders <DossierShell> with domain-specific panels
```

---

## 12. Inventory Orchestration Direction

### Current
Scarcity intelligence per-variant (stock pool, reserved, pressure), displayed as cards in the product dossier. Data from `inventory_reservations` table + `getAvailableStock()` RPC.

### Target

Inventory becomes its own orchestration domain with intelligence layer:

- **Allocation pools**: active pool (available for purchase), reserved pool (held by carts in checkout), safety pool (VIP/early access), damaged/defective pool
- **Contention detection**: automatic flagging when reserved pool exceeds threshold (configurable per brand: 70% warning, 90% critical)
- **Restock planning**: suggested restock quantities based on burn rate and drop schedule
- **Reconciliation**: automatic vs manual pool shifts, all logged as inventory events
- **Multi-warehouse**: future support for warehouse-specific allocation
- **Carrier-specific inventory**: allocate stock per fulfillment region

### Key Difference from Current

Current: Static pools shown in UI.
Target: Dynamic pools with automated contention detection, allocation suggestions, and event-driven pool adjustments.

---

## 13. Fulfillment Orchestration Direction

### Current
No fulfillment system exists. Orders have statuses (processing, shipped, delivered) but no fulfillment-specific infrastructure.

### Target

Fulfillment as a first-class orchestration domain:

- **Batch lifecycle**: draft → picking → packed → shipped → delivered
- **Batch grouping**: algorithm groups eligible orders into fulfillment batches (by region, by carrier, by priority)
- **Carrier management**: configurable carriers per brand, rate comparison, label generation
- **Tracking integration**: webhook ingestion from ShipEngine/Shippo for automatic status updates
- **Returns management**: RMA workflow — return request → label generation → item inspection → refund/replacement
- **Reconciliation**: auto-detect orders stuck in processing, flag for manual review

### Fulfillment Dossier

```
Fulfillment Batch DOSSIER
├── Batch ID, status, carrier, destination
├── Timeline: batch created → picking → packed → shipped → delivered
├── Orders in batch: list of linked order dossiers
├── Items: consolidated item list for batch
├── Tracking: carrier tracking number, current status
└── Actions: assign carrier, mark shipped, mark delivered
```

---

## 14. Customer Intelligence Direction

### Current
Customer profiles show name, tier, wallet balance, order count, total spent, last activity. Static mock data.

### Target

Customer Intelligence Layer:

- **Lifetime value tracking**: real LTV calculation (total spend - returns - discounts), projected LTV
- **Tier progression**: full tier change history, time-in-tier, next tier progress with personalized recommendations
- **Activity patterns**: session frequency, browse-to-purchase conversion, peak engagement hours
- **Segment builder**: filter by tier, spend range, activity recency, acquisition source
- **Churn prediction**: AI-powered churn risk scoring (future)
- **Unified customer profile**: merge guest checkout profiles with authenticated profiles, consolidate across brands
- **Activity timeline**: every touchpoint — order placed, support ticket opened, wallet credited, lookbook viewed (optional), drop participated in

### Customer Dossier

```
Customer DOSSIER
├── Header: name, tier, status, brand association
├── Key metrics: LTV, order count, wallet balance, churn risk
├── Timeline: every customer event (order, support, wallet, activity)
├── Order history: linked order dossiers
├── Wallet: linked wallet dossier
├── Support tickets: linked ticket dossiers
├── Notes: internal operator notes (with audit log)
└── Actions: edit profile, adjust wallet, merge profiles, export
```

---

## 15. AI Workflow Preparation Architecture

### Guiding Principle
AI is not a feature — it's an **infrastructure layer** that augments every dossier with intelligence.

### Architecture

```
AI Engine (phase 3, separate service — Python/ML)
│
├── Prediction Models
│   ├── Demand forecasting (per product, per variant)
│   ├── Inventory allocation optimization
│   ├── Churn prediction (per customer)
│   └── Drop timing optimization
│
├── Anomaly Detection
│   ├── Unusual order patterns (fraud signals)
│   ├── Reservation abuse (bot detection)
│   ├── Fulfillment delays (predicted vs actual)
│   └── Wallet manipulation
│
└── Workflow Engine
    ├── Rule-based automations (if/then triggers)
    ├── ML-assisted decisions (recommended actions in dossiers)
    └── Scheduled operations (auto-activate drops, release stale reservations)
```

### AI in the UI (Phase 2 preparation)

Every dossier has an AI intelligence panel:

```
┌─────────────────────────────┐
│  AI INTELLIGENCE            │
│                             │
│  ▸ Demand for this size     │
│    is projected at 92%      │
│    of available stock.      │
│                             │
│  ▸ Suggested action:        │
│    Increase safety pool     │
│    by 8 units.              │
│                             │
│  [Apply] [Dismiss]          │
└─────────────────────────────┘
```

### Preparation Steps (Phase 1)

1. Create `ai_workflow_definitions` table (name, trigger event, conditions, actions)
2. Create `ai_suggestions` table (resource type, resource id, suggestion type, message, status: pending/applied/dismissed, confidence)
3. Build suggestion display component (inline panel in every dossier)
4. Implement simple rule engine (if stock < threshold → flag for restock)
5. Log all AI actions as operational events (domain: ai)

---

## 16. Support / Workflow Orchestration

### Current
No support system exists.

### Target

Support as an orchestrated workflow:

- **Ticket lifecycle**: open → triage → in_progress → awaiting_customer → resolved → closed
- **Ticket types**: order issue, account issue, product inquiry, return request, other
- **Assignment**: automatic round-robin or manual assignment to support operators
- **Escalation**: SLA-based escalation (if unassigned > 4h → notify ops_admin, if unresolved > 24h → auto-escalate)
- **Customer context**: ticket dossier includes customer's order history, wallet, previous tickets
- **Internal notes**: operator-only notes with audit trail
- **CSAT**: post-resolution satisfaction survey (future)

### Support Dossier

```
Support Ticket DOSSIER
├── Header: ticket ID, status, priority, assigned to
├── Timeline: opened → triaged → in progress → resolved
├── Customer context: name, tier, recent orders, wallet balance
├── Conversation thread: messages (customer + operator)
├── Related orders: linked order dossiers
├── Internal notes: operator-only
└── Actions: assign, escalate, resolve, close, link to order
```

---

# PART III: IMPLEMENTATION STRATEGY

## 17. Recommended Folder/Domain Structure

### Phase 1 Immediate Restructure

```
app/
├── (store)/                     ← StreetPlayR — untouched
│   └── ... (existing routes)
│
├── (qala)/                      ← Qala Labs CRM — new root group
│   ├── layout.tsx               ← QalaProvider, QalaGuard, QalaHeader, CommandPalette
│   ├── error.tsx
│   ├── page.tsx                 ← Qala Labs dashboard (dossier-first)
│   │
│   ├── drops/
│   │   ├── page.tsx             ← Drop orchestration (exists, enhance)
│   │   └── [dropId]/
│   │       └── page.tsx         ← Drop dossier (NEW)
│   │
│   ├── orders/
│   │   ├── page.tsx             ← Order narratives (exists, enhance)
│   │   └── [orderId]/
│   │       └── page.tsx         ← Order dossier (NEW)
│   │
│   ├── fulfillment/
│   │   ├── page.tsx             ← Fulfillment queue (NEW)
│   │   └── [batchId]/
│   │       └── page.tsx         ← Batch dossier (NEW)
│   │
│   ├── inventory/
│   │   ├── page.tsx             ← Inventory overview (exists, enhance)
│   │   └── products/
│   │       └── [variantId]/
│   │           └── page.tsx     ← Variant dossier (NEW)
│   │
│   ├── customers/
│   │   ├── page.tsx             ← Customer profiles (exists, rename from ops/customers)
│   │   └── [customerId]/
│   │       └── page.tsx         ← Customer dossier (NEW)
│   │
│   ├── wallet/
│   │   ├── page.tsx             ← Wallet overview (exists, enhance)
│   │   └── [walletId]/
│   │       └── page.tsx         ← Wallet dossier (NEW)
│   │
│   ├── editorial/
│   │   ├── page.tsx             ← Content calendar (NEW)
│   │   └── [campaignId]/
│   │       └── page.tsx         ← Campaign dossier (NEW)
│   │
│   ├── support/
│   │   ├── page.tsx             ← Ticket queue (NEW)
│   │   └── [ticketId]/
│   │       └── page.tsx         ← Ticket dossier (NEW)
│   │
│   ├── brand/
│   │   ├── page.tsx             ← Brand list (NEW)
│   │   └── [brandId]/
│   │       └── page.tsx         ← Brand dossier + config (NEW)
│   │
│   ├── analytics/
│   │   ├── page.tsx             ← System observability (NEW)
│   │   └── events/
│   │       └── page.tsx         ← Event log browser (NEW)
│   │
│   └── ai/
│       ├── page.tsx             ← AI dashboard (NEW)
│       └── workflows/
│           └── page.tsx         ← Workflow editor (NEW)
│
├── actions/
│   ├── auth.ts                  ← Shared auth actions
│   ├── cart.ts                  ← StreetPlayR cart actions
│   ├── reservation.ts           ← StreetPlayR reservation actions
│   ├── order.ts                 ← StreetPlayR order placement actions
│   └── qala/                    ← Qala Labs CRM server actions (NEW, organized by domain)
│       ├── drops.ts
│       ├── orders.ts
│       ├── fulfillment.ts
│       ├── inventory.ts
│       ├── customers.ts
│       ├── wallet.ts
│       ├── editorial.ts
│       ├── support.ts
│       ├── ai.ts
│       └── brand.ts
│
├── api/
│   ├── webhooks/stripe/route.ts ← StreetPlayR (exists)
│   ├── qala/                    ← Qala Labs internal API (NEW)
│   └── health/route.ts          ← Shared (NEW)
│
├── components/
│   ├── auth/                    ← Shared auth components (exists)
│   ├── cart/                    ← StreetPlayR (exists)
│   ├── checkout/                ← StreetPlayR (exists)
│   ├── layout/                  ← StreetPlayR (exists)
│   ├── product/                 ← StreetPlayR (exists)
│   ├── profile/                 ← StreetPlayR (exists)
│   ├── launch/                  ← StreetPlayR (exists)
│   ├── sections/                ← StreetPlayR (exists)
│   ├── ui/                      ← Shared UI (exists)
│   ├── ops/                     ← RENAME TO qala/ (move existing)
│   │   ├── CommandPalette.tsx
│   │   ├── OpsHeader.tsx
│   │   ├── OpsProvider.tsx
│   │   └── ... (existing ops components)
│   └── qala/                    ← Qala Labs CRM components (NEW)
│       ├── dossier/             ← Generic dossier components
│       │   ├── DossierShell.tsx
│       │   ├── DossierHeader.tsx
│       │   ├── DossierTimeline.tsx
│       │   └── DossierActions.tsx
│       ├── timeline/            ← Timeline components
│       │   ├── SystemTimeline.tsx
│       │   └── TimelineEvent.tsx
│       ├── intelligence/        ← AI panel components
│       │   ├── AIPanel.tsx
│       │   └── SuggestionCard.tsx
│       └── brand/               ← Multi-brand UI
│           └── BrandSelector.tsx

lib/
├── auth/                        ← Shared (exists)
├── commerce/cart.ts             ← StreetPlayR (exists)
├── env/validate.ts              ← Shared (exists)
├── orchestration/               ← RENAME TO qala/
│   ├── core/                    ← Generic state machine, event bus, idempotency
│   ├── order/                   ← Order lifecycle (enhance from existing)
│   ├── reservation/             ← Reservation lifecycle (exists)
│   ├── fulfillment/             ← NEW
│   ├── drop/                    ← NEW (enhance from existing mock data)
│   ├── customer/                ← NEW (customer intelligence)
│   ├── wallet/                  ← NEW (enhance from existing wallet service)
│   ├── editorial/               ← NEW
│   ├── support/                 ← NEW
│   ├── ai/                      ← NEW (workflow engine + predictions)
│   ├── brand/                   ← NEW (multi-brand context)
│   └── reconciliation.ts        ← Shared (exists)
├── products/queries.ts          ← StreetPlayR (exists)
├── realtime/                    ← Shared (exists)
├── supabase/                    ← Shared (exists)
└── wallet/service.ts            ← StreetPlayR (exists, customer-facing)
```

---

## 18. OpenCode Implementation Sequencing

### Phase 1A — Foundation (Current → Qala Labs CRM Base)

```
Week 1-2: Infrastructure
├── 1. Rename app/(ops)/ → app/(qala)/
├── 2. Rename components/ops/ → components/qala/ (or keep ops/ as shared)
├── 3. Create brand domain: table, config type, context resolver
├── 4. Create user_brand_roles table
├── 5. Extend RBAC: new roles, new permissions, brand scoping
├── 6. Add brand_id to operational_events table
├── 7. Create database migration plan (qala_* schema prefix)

Week 3-4: Core Orchestration
├── 8. Build generic state machine engine (lib/qala/core/state-machine.ts)
├── 9. Build dossier system components (DossierShell, DossierHeader, DossierTimeline)
├── 10. Build unified timeline component with filtering
├── 11. Enhance EventTimeline service with grouping, stats, cursor pagination
├── 12. Add brand context middleware
├── 13. Create QalaProvider (replaces OpsProvider, adds brand context)
```

### Phase 1B — Domain Modules (Existing Pages → Dossier Pages)

```
Week 5-6: Order & Fulfillment
├── 14. Build Order dossier page (app/(qala)/orders/[orderId]/)
├── 15. Build fulfillment module (batch creation, carrier config)
├── 16. Build Fulfillment batch dossier
├── 17. Create order fulfillment server actions

Week 7-8: Drops & Inventory
├── 18. Enhance drops page with dossier detail view
├── 19. Build inventory intelligence layer (contention detection, pool management)
├── 20. Build Variant dossier

Week 9-10: Customers, Wallet & Support
├── 21. Build Customer dossier (lifetime timeline, activity patterns)
├── 22. Enhance wallet page with dossier view and burn analytics
├── 23. Build support/ticket module
├── 24. Create customer intelligence service (LTV, segments)
```

### Phase 1C — Editorial & AI Prep

```
Week 11-12: Editorial & AI
├── 25. Build editorial workflow (campaign lifecycle, content approval)
├── 26. Build AI infrastructure (workflow definitions table, suggestions table)
├── 27. Build AI panel component for dossiers
├── 28. Implement simple rule engine
├── 29. Build analytics/observability page
└── 30. Full system integration test
```

### Phase 2 — Separation (Independent Deployments)

```
├── 31. Extract shared types into packages/shared-types
├── 32. Build sync service as standalone worker
├── 33. Split Next.js apps: store/ and qala/
├── 34. Configure shared Supabase with schema separation
├── 35. Set up event routing between apps
├── 36. Deploy separately with independent scaling
```

### Phase 3 — AI & Scale

```
├── 37. Build Python ML service for demand forecasting
├── 38. Train churn prediction model
├── 39. Implement anomaly detection pipeline
├── 40. Add multi-warehouse inventory support
├── 41. Build carrier rate comparison engine
└── 42. Full multi-brand onboarding toolkit
```

---

## 19. Production Deployment Strategy

### Hosting

| Component | Host | Rationale |
|-----------|------|-----------|
| StreetPlayR (Next.js) | Vercel | Edge network, SSR, preview deploys, team collaboration |
| Qala Labs CRM (Next.js) | Vercel | Same stack, shared infra, unified CI/CD |
| Supabase (DB + Auth) | Supabase Managed (Pro/Team) | Managed Postgres, auth, realtime, storage |
| Stripe | Stripe | Payment processing (already planned) |
| Sanity CMS | Sanity Managed | Content management (Phase 3) |
| Cloudinary | Cloudinary | Media pipeline (Phase 3) |
| AI Service | Railway / Fly.io | Python/ML workloads, GPU optional |

### CI/CD

Use Vercel's native Git integration:
- Main branch → Production deploy
- Feature branches → Preview deploys
- Environment variables managed in Vercel dashboard

Additional (for sync service and AI):
- GitHub Actions for scheduled cron jobs (reconciliation every 5 min)
- Docker build + deploy for AI service

### Database Migrations

- Run via `supabase migration up` in CI
- Never run automatic migrations in production — manual approval gate
- Backward-compatible migrations only (no destructive changes without deprecation period)

### Monitoring & Observability

| Aspect | Tool |
|--------|------|
| Application performance | Vercel Analytics |
| Error tracking | Sentry |
| Database performance | Supabase Monitoring |
| Operational events | Qala Labs CRM Event Log |
| Uptime monitoring | Better Uptime / Checkly |
| AI model performance | MLflow / custom |

---

## 20. Security Architecture

### Authentication

- Supabase Auth (Phone OTP + Google OAuth) — shared
- JWT session with cookie storage (httpOnly, secure, sameSite)
- Session refresh handled by middleware (exists)

### Authorization

- RBAC with brand scoping (Qala Labs CRM-specific)
- Server action gating (each action checks role + brand)
- Route-level gating (layout checks role + brand)
- API route protection (gateway pattern)

### Data Isolation

- Row-level security (Supabase RLS) for shared tables
- Brand_id scoping for all Qala Labs CRM tables
- Service-role client only in trusted server contexts

### Webhook Security

- Stripe webhook signature verification
- Idempotency keys prevent replay attacks
- Rate limiting on webhook endpoints
- IP allowlisting for known webhook sources

### Infrastructure Security

- All env vars stored in Vercel (never in code)
- Supabase service role key used only in server-only contexts
- CORS configured per API route
- Security headers in next.config.ts (HSTS, XFO, XSS, etc.)

---

## 21. Long-Term Platform Evolution Strategy

### Phase 1 (Weeks 1-12): Qala Labs CRM Base

**Goal**: Transform flat OpsOS template into multi-brand orchestration platform.

Deliverables:
- Renamed route group: `app/(qala)/`
- Dossier system for all existing entities
- Timeline as primary navigation metaphor
- Multi-brand infra (brand table, config, scoping)
- RBAC with brand scoping
- Generic state machine engine
- Domain-organized lib structure
- AI preparation infrastructure (tables, suggestions)

### Phase 2 (Months 4-6): Independent Systems

**Goal**: Split into independently deployable StreetPlayR and Qala Labs CRM.

Deliverables:
- Separate Next.js apps
- Shared types package
- Sync service worker
- Event routing between systems
- Independent scaling
- Multi-brand customer onboarding

### Phase 3 (Months 7-12): AI & Scale

**Goal**: Full intelligence layer and multi-tenant readiness.

Deliverables:
- Python ML service (demand forecasting, churn prediction)
- Anomaly detection pipeline
- AI-suggested actions in every dossier
- Multi-warehouse inventory
- Carrier rate comparison and optimization
- Full multi-brand onboarding toolkit (self-service brand creation)
- Public API for brand integration

### Year 2+ : Platform

**Goal**: Qala Labs CRM as a standalone product serving multiple brands.

Deliverables:
- Public API for external brand integration
- Plugin marketplace (fulfillment carriers, AI models, notification providers)
- White-label CRM (brands host their own Qala Labs CRM instance)
- Everything as a service — orchestration, intelligence, workflows

---

# PART IV: EXECUTION GUIDELINES

## Ground Rules

1. **Never mutate directly** — always go through state machines. Every state transition passes through `StateMachine.transition()` which validates, emits events, and logs to timeline.

2. **Events are the source of truth** — UI reads events for timelines. Never query a mutable table for history. The `operational_events` table is immutable — no updates, no deletes.

3. **Brand scope everything** — From day one, every new table, query, and component accepts `brandId`. Even when only one brand exists. This avoids a painful migration later.

4. **Dossiers replace detail pages** — Never build a CRUD form. Always build a dossier. The difference is philosophical: a form edits data, a dossier tells a story.

5. **No direct cross-system calls** — StreetPlayR never imports from Qala Labs CRM. Qala Labs CRM never imports from StreetPlayR. They communicate through events and sync service.

6. **Calm observability** — No alert fatigue. No blinking red numbers. Operational UX should feel like a luxury control room — information-dense but visually calm, with severity hierarchies that demand attention only when warranted.

7. **Multi-brand from day one** — Even if StreetPlayR is the only brand for months, every table, every query, every component accounts for brand_id. The brand selector may be hidden, but the architecture is ready.

## Key Distinctions From Template CRM Thinking

| Template CRM | Qala Labs CRM |
|-------------|---------------|
| Tables | Timelines |
| Forms | Dossiers |
| CRUD operations | State transitions |
| KPI dashboards | Strategic orchestration overview |
| User management | Brand-scoped RBAC |
| Flat routes | Domain-organized routes |
| Single-tenant | Multi-brand from day one |
| Direct service calls | Event-driven communication |
| Admin UI | Cinematic operational UX |
| Data entry | Orchestration actions |
| Templates | State machines |
| Reports | Event streams + intelligence |
