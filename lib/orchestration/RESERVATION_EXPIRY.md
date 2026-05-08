# Reservation Expiration & Release Logic

## TTL Configuration

| Context | TTL | Config |
|---|---|---|
| Standard checkout | 15 minutes | `RESERVATION_TTL_STANDARD` |
| Limited drops | 5 minutes | `RESERVATION_TTL_DROP` |
| VIP/whitelist | 30 minutes | `RESERVATION_TTL_VIP` |

## Expiry Mechanism

### Layer 1: On-Read Expiry (Always Active)

When any query reads inventory reservations, expired ones are filtered:

```sql
WHERE reservation_state IN ('pending', 'held')
  AND expires_at > now()
```

### Layer 2: Batch Expiry Cron (Supabase pg_cron)

```sql
SELECT cron.schedule(
  'release-expired-reservations',
  '*/5 * * * *',  -- every 5 minutes
  $$
  UPDATE inventory_reservations
  SET reservation_state = 'expired',
      released_at = now()
  WHERE reservation_state IN ('pending', 'held')
    AND expires_at < now();
  $$
);
```

### Layer 3: On-Reservation Read

When a reservation is loaded for checkout, check and expire inline:

```sql
UPDATE inventory_reservations
SET reservation_state = 'expired',
    released_at = now()
WHERE id = $1
  AND reservation_state IN ('pending', 'held')
  AND expires_at < now()
RETURNING *;
```

## Release Flow

```
expired_at < now()
      │
      ▼
state → 'expired'
released_at = now()
      │
      ▼
Available stock recalculated:
  SUM(variant.stock_quantity)
  - SUM(converted_reservations.quantity)
  - SUM(active_reservations.quantity)  -- excludes expired
```

## Client-Side Behaviour

- Checkout page shows countdown timer from reservation expiry
- On expiry: show toast "Session expired", redirect to cart
- Cart items preserved — user can re-enter checkout
- Re-entry creates new reservation (if stock available)
