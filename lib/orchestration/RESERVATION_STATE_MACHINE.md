# Reservation State Machine

## States

```
CART     ──→  PENDING   ──→  HELD     ──→  CONVERTED
 (no reserve)  (checkout entry)  (payment intent)  (payment confirmed)

                  │                │                  │
                  ▼                ▼                  ▼
              EXPIRED           RELEASED          RELEASED
              (TTL 15m)         (payment fail)    (refund)
```

| State | Meaning |
|---|---|
| `pending` | User entered checkout. Reserved. Timer starts. |
| `held` | PaymentIntent created. Waiting for confirmation. |
| `converted` | Payment confirmed. Stock permanently deducted. |
| `released` | Released back to pool (failure, cancel, refund). |
| `expired` | TTL reached without conversion. Auto-released. |

## Transitions

| From | To | Trigger | Server Action |
|---|---|---|---|
| — | `pending` | User clicks "Secure Allocation" | `reserveInventoryAction` |
| `pending` | `held` | PaymentIntent.created webhook | `holdReservationAction` |
| `held` | `converted` | payment_intent.succeeded webhook | `convertReservationAction` |
| `held` | `released` | payment_intent.payment_failed webhook | `releaseReservationAction` |
| `pending` | `expired` | TTL exceeded (cron or on-read) | `expireReservationsAction` |
| `expired` | `released` | Cleanup job | `releaseExpiredAction` |
| `converted` | `released` | Refund/return | `releaseReservationAction` |

## Data Model

```sql
CREATE TYPE reservation_state AS ENUM (
  'pending', 'held', 'converted', 'released', 'expired'
);

CREATE TABLE inventory_reservations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id           UUID,
  product_id        UUID NOT NULL REFERENCES products(id),
  variant_id        UUID NOT NULL REFERENCES product_variants(id),
  reserved_quantity INTEGER NOT NULL CHECK (reserved_quantity > 0),
  reservation_state reservation_state NOT NULL DEFAULT 'pending',
  reservation_owner UUID NOT NULL REFERENCES profiles(id),
  expires_at        TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  converted_at      TIMESTAMPTZ,
  released_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);
```

## Boundaries

- **Stripe is NOT the orchestration authority.** Reservations exist independently.
- Stripe confirmation only triggers `pending → converted`.
- All other transitions (expiry, release, cancel) are Stripe-independent.
