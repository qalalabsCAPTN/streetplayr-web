# Payment Event Taxonomy

## Event Types

```sql
CREATE TYPE payment_event_type AS ENUM (
  'payment_intent.created',
  'payment_intent.processing',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.canceled',
  'payment_intent.expired',
  'charge.refunded',
  'charge.disputed',
  'charge.refund.updated'
);
```

## Event Data Model

```sql
CREATE TABLE payment_events (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                UUID NOT NULL REFERENCES orders(id),
  event_type              payment_event_type NOT NULL,
  stripe_event_id         TEXT UNIQUE,         -- idempotency
  stripe_payment_intent_id TEXT,
  amount                  INTEGER NOT NULL CHECK (amount >= 0),
  currency                TEXT DEFAULT 'usd',
  status                  TEXT,
  raw_payload             JSONB,               -- full webhook body for audit
  metadata                JSONB DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ DEFAULT now()
);
```

## Event → Order Status Mapping

| Event | Order Status Transition | Reservation Transition |
|---|---|---|
| `payment_intent.created` | — (already pending_payment) | pending → held |
| `payment_intent.processing` | — | — |
| `payment_intent.succeeded` | pending_payment → confirmed | held → converted |
| `payment_intent.payment_failed` | pending_payment → pending_payment (retry) | held → released |
| `payment_intent.canceled` | pending_payment → cancelled | held → released |
| `payment_intent.expired` | pending_payment → cancelled | pending → expired |
| `charge.refunded` | confirmed/processing/shipped → refunded | converted → released |
| `charge.disputed` | confirmed → on_hold | — |

## Idempotency

- `stripe_event_id` has a UNIQUE constraint — prevents double-processing.
- Webhook handler checks `stripe_event_id` before processing.
- If event already exists, return 200 OK (no-op).
