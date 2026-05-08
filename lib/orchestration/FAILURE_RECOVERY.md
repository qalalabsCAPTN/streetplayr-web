# Failure Recovery & Rollback Behavior

## Payment Intent Creation Failure

| Stage | Behaviour | Data Integrity |
|---|---|---|
| Order creation fails | Inline error in checkout. Cart preserved. | Nothing persisted |
| PaymentIntent creation fails | Inline error. Order in 'draft' not visible to customer. | Draft order cleaned by TTL |
| Reservation creation fails | Blocked — stock unavailable. Show "No longer available". | No reservation created |

## Payment Confirmation Failure

| Stage | Behaviour | Data Integrity |
|---|---|---|
| Card declined | Inline error on PaymentElement. Customer retries. | Reservation held (15m TTL) |
| 3DS fails | Same as decline. | Reservation held |
| Network error during confirm | Idempotency key prevents double-charge on retry. | Reservation held |

## Webhook Delivery Failure

| Failure | Stripe Behaviour | Our Behaviour |
|---|---|---|
| Webhook endpoint down | Stripe retries with exponential backoff (up to 3 days) | On recovery, process all queued events |
| Webhook processing error | Stripe retries after 5s, then escalating | Log error. 500 response → Stripe retries |
| Idempotent replay | — | UNIQUE constraint on stripe_event_id → 200 OK |

## Order Placement Failure After Payment

| Scenario | Resolution |
|---|---|
| Payment succeeded but order update failed | Stripe has the payment. Our DB has no order. Reconciliation cron finds orphan PaymentIntent → creates order. |
| Payment succeeded but reservation conversion failed | Reservation stays 'held'. Payment is captured. Reconciliation converts reservation retroactively. |
| Partial refund after fulfillment | Stripe webhook `charge.refunded` → order → 'refunded'. Reservation stays 'converted' (already fulfilled). |

## Reservation Expiry During Checkout

| Stage | Client | Server |
|---|---|---|
| User idle >15m | Countdown timer hits 0. Toast: "Session expired". Redirect to cart. | Cron/on-read marks reservation 'expired'. Stock released. |
| User submits after expiry | PaymentIntent creation fails on stock check. | Show "Item no longer available. Cart updated." |
| Payment confirmed after expiry | Stripe confirmed, but our stock check fails. | Full refund processed. Notification sent. Ops alerted. |

## Server Crash Recovery

| Crash Point | Recovery |
|---|---|
| During checkout submission | Idempotency key on PaymentIntent. User can retry safely. |
| During webhook processing | Stripe retries. Idempotent event handling. |
| During reservation creation | No reservation → checkout fails cleanly → user retries. |
| During order confirmation | Webhook replay creates order. Reconciliation deduplicates. |

## Manual Recovery (OpsOS)

| Action | Who | Effect |
|---|---|---|
| Force release reservation | Ops admin | Releases held/pending reservation. Stock returned. |
| Manual confirm order | Super admin / ops admin | Transitions order to confirmed. Creates payment event. |
| Force cancel order | Ops admin / support | Cancels order. Triggers refund if paid. Releases reservation. |
| Retry webhook | Ops admin | Re-fires webhook processing for a given event ID. |
