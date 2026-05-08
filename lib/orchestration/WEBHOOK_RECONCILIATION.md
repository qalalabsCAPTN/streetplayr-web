# Webhook Reconciliation Strategy

## Design Principle

**Webhooks are authoritative for payment state.**

Stripe webhooks are the source of truth for payment lifecycle.
Server-side action confirmations are optimistic UI only.

## Architecture

```
Stripe ──→ POST /api/webhooks/stripe ──→ verify_signature
                                              │
                                              ▼
                                         idempotency_check
                                              │
                                    ┌─────────┴─────────┐
                                    ▼                   ▼
                              new event           duplicate event
                                    │                   │
                                    ▼                   ▼
                              process_event         200 OK (no-op)
                                    │
                                    ▼
                              update_order()
                              update_reservation()
                              log_payment_event()
                                    │
                                    ▼
                              200 OK
```

## Webhook Processing Order

1. **Verify signature** using `STRIPE_WEBHOOK_SECRET`
2. **Idempotency check** — `stripe_event_id` in `payment_events`
3. **Process event:**
   a. Look up order by `payment_intent_id`
   b. Update order status (per event→status mapping)
   c. Update reservation state (per event→reservation mapping)
   d. Log to `payment_events` table
4. **Return 200 OK** (always return 200 to prevent Stripe retry spam)

## Reconciliation Cron (Daily)

```sql
-- Find orders stuck in pending_payment with no recent payment activity
SELECT o.id, o.created_at, o.payment_intent_id
FROM orders o
LEFT JOIN payment_events pe ON pe.order_id = o.id
WHERE o.status = 'pending_payment'
  AND o.created_at < now() - interval '24 hours'
  AND (pe.created_at IS NULL OR pe.created_at < now() - interval '1 hour');
```

## Failure Modes

| Failure | Behaviour |
|---|---|
| Webhook delivery fails | Stripe retries with exponential backoff (up to 3 days) |
| Webhook processor crashes | Event not logged → next retry processes it |
| Order not found by payment_intent_id | Log to error table, manual ops review |
| Duplicate webhook | UNIQUE constraint on stripe_event_id → 200 OK |
| Signature verification fails | 400 Bad Request, log security alert |
