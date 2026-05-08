# Order Lifecycle State Machine

## States

```
DRAFT ──→ PENDING_PAYMENT ──→ CONFIRMED ──→ PROCESSING ──→ SHIPPED ──→ DELIVERED
              │                    │              │
              ▼                    ▼              ▼
         CANCELLED             ON_HOLD        REFUNDED
         (before payment)      (review)       (after payment)
```

| State | Meaning | Customer Visible |
|---|---|---|
| `draft` | Created during checkout, not submitted | No |
| `pending_payment` | Awaiting payment confirmation | Yes |
| `confirmed` | Payment received, verified | Yes |
| `processing` | Fulfillment started | Yes |
| `shipped` | Dispatched with tracking | Yes |
| `delivered` | Confirmed received | Yes |
| `cancelled` | Cancelled before fulfillment | Yes |
| `on_hold` | Payment issue, manual review | Yes |
| `refunded` | Returned/refunded after fulfillment | Yes |

## Transitions

```
DRAFT → PENDING_PAYMENT     User submits checkout
PENDING_PAYMENT → CONFIRMED  payment_intent.succeeded webhook
CONFIRMED → PROCESSING       OpsOS: fulfillment begins
PROCESSING → SHIPPED         OpsOS: tracking added
SHIPPED → DELIVERED          OpsOS: delivery confirmed
PENDING_PAYMENT → CANCELLED  User cancels (before payment completes)
CONFIRMED → ON_HOLD          Payment review / fraud check
ON_HOLD → CONFIRMED          Review cleared
ON_HOLD → CANCELLED          Review failed
CONFIRMED → REFUNDED         Full refund processed
SHIPPED → REFUNDED           Return received + refunded
```

## Order Data Model

```sql
CREATE TYPE order_status AS ENUM (
  'draft', 'pending_payment', 'confirmed', 'processing',
  'shipped', 'delivered', 'cancelled', 'on_hold', 'refunded'
);

CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id),
  status            order_status NOT NULL DEFAULT 'draft',
  total             INTEGER NOT NULL CHECK (total >= 0),
  subtotal          INTEGER NOT NULL CHECK (subtotal >= 0),
  shipping_cost     INTEGER DEFAULT 0,
  tax_amount        INTEGER DEFAULT 0,
  currency          TEXT DEFAULT 'usd',
  shipping_address  JSONB NOT NULL DEFAULT '{}'::jsonb,
  billing_address   JSONB,
  payment_intent_id TEXT,
  stripe_session_id TEXT,
  metadata          JSONB DEFAULT '{}'::jsonb,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
```

## Boundaries

- Order is authority for commerce state.
- Payment is a sub-process of order, not the reverse.
- Inventory reservations are linked to orders via order_id.
