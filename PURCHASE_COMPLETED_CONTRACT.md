# `purchase.completed` Event Contract

> Phase 3 deliverable. Canonical envelope + payload for the one event StreetPlayR emits to NECTAR today. Implemented in [`lib/nectar/purchase-event.ts`](lib/nectar/purchase-event.ts) / [`lib/nectar/client.ts`](lib/nectar/client.ts), fired from [`lib/orchestration/order.ts`](lib/orchestration/order.ts).

## Envelope

```jsonc
{
  "eventId": "a2171617-c81a-4311-9ba0-7642eada539d",   // = orders.id (see "Why eventId = orderId" below)
  "eventType": "purchase.completed",
  "version": 1,
  "timestamp": "2026-08-18T04:12:31.000Z",              // emit-time ISO8601
  "actorUserId": "f462b783-d64b-4686-812d-0e020ad924b4", // StreetPlayR profiles.id — see "Identity resolution" below
  "platform": "streetplayr",
  "platformTraceId": "a2171617-c81a-4311-9ba0-7642eada539d", // = orderId again, for cross-system log correlation
  "payload": { /* see below */ }
}
```

This matches exactly what `EventIngester.validateEventEnvelope()` (NECTAR, `packages/events/src/ingestion/event-validator.ts`) requires: `eventId, eventType, timestamp (≤5min future), actorUserId, platform, payload` all present, `version` defaulted to 1 if omitted (we always send it explicitly).

## Payload — real fields only, verified against the live schema

| Field | Type | Source (verified live, 2026-08-18) | Notes |
|---|---|---|---|
| `orderId` | string (UUID) | `orders.id` | |
| `orderTotal` | number | `orders.grand_total` | Live column confirmed via schema introspection: `id, organization_id, brand_id, order_number, customer_id, status, ..., grand_total, currency, ...`. Not `total` — StreetPlayR's real column name is `grand_total`. |
| `currency` | string | `orders.currency` | e.g. `"INR"` — confirmed real values on live orders (`"INR"` in every sampled row). |
| `isFirstOrder` | boolean | computed | `orders` has no boolean flag for this. Computed at emit time: `count(orders where customer_id = X and status in (confirmed,processing,fulfilling,shipped,delivered) and id != this order) === 0`. Matches NECTAR's "First Order Bonus" rule condition (`payload.isFirstOrder eq true`) exactly. |
| `siteId` | string | constant `"streetplayr"` | `orders` has **no `site_id` column** (confirmed absent from the live schema — StreetPlayR's multi-site `sites`/`site_configs` tables exist, but orders were never linked to them). Since exactly one site (`streetplayr`) is live today, this is a documented constant, not an invented per-order value. **Must become a real lookup once a second site takes orders** — flagged in [`PLATFORM_ID_CONTRACT.md`](PLATFORM_ID_CONTRACT.md). |

Fields deliberately **not** included because they don't exist on the real `orders`/`order_items` schema and would be invented: `productIds`, `discountCode`, `shippingMethod`. If a future reward rule needs conditions on these, add them to the payload only once the underlying StreetPlayR column exists — do not pre-guess the shape.

## Identity resolution (the fiddly part)

`orders.customer_id` points at StreetPlayR's `customers` table (a separate CRM-style table, not `profiles`), and **`customers` has no `user_id`/`profiles.id` foreign key** (confirmed: querying `customers.user_id` returns a real Postgres "column does not exist" error). The only linkage that exists anywhere in the live schema is `profiles.email = customers.email` — the exact join `OrderService.getForUser()` already uses in the opposite direction.

`emitPurchaseCompleted()` therefore resolves `actorUserId` as:
```
orders.customer_id → customers.email → profiles.id (where profiles.email = customers.email)
```
If no `profiles` row matches (e.g. a guest checkout with no StreetPlayR account), the event is **not emitted** — there is no ecosystem identity to credit, and guessing one would violate the identity contract in `IDENTITY_BRIDGE_DESIGN.md`. This is logged (`console.warn`) but does not fail the order.

## Idempotency

`eventId` is set to `orders.id`, not a fresh random UUID, deliberately. NECTAR's `events` table PK is the caller-supplied `eventId` (see `ECOSYSTEM_CONTRACTS.md` §2 — dedup is PK-based, no separate `idempotency_key` column on `events`). Reusing the order id means:
- A retried `transitionStatus('pending' → 'confirmed')` call (e.g. from `app/api/cron/sync-order-status`'s reconciliation path) that fires the emit twice produces the same `eventId` both times — NECTAR's own PK-uniqueness check catches the duplicate and returns `{status:'duplicate'}` instead of double-processing.
- One order can never produce two different `purchase.completed` events, by construction — you'd need a second order.

## Trigger point (why the payment webhook itself isn't touched)

The event fires from `lib/orchestration/order.ts::transitionStatus()` / `submitForPayment()`, specifically only on a `pending → confirmed` transition — the point every payment success path (Easebuzz webhook, Stripe webhook, demo checkout, cron reconciliation) already funnels through via `OrderService`. This is an **orchestration-layer** hook, not a payment-gateway change: `lib/orchestration/payment.ts`, `app/api/webhooks/easebuzz/route.ts`, and `app/api/webhooks/stripe/route.ts` are untouched, per the "do not work on payment" scope rule. See the `fireNectarPurchaseCompletedIfNewlyConfirmed()` helper in `order.ts` for the exact guard (`fromStatus === 'pending' && updated.status === 'confirmed'`).

## Delivery guarantee (be honest about what this is NOT)

`emitEvent()` is fire-and-forget with a 5s timeout: it never throws back into the order-transition call, and never retries. If NECTAR is down at the exact moment of confirmation, **that purchase.completed event is lost** — the order still confirms correctly in StreetPlayR (business-critical path protected), but no reward is ever granted for it. This is an explicit, documented trade-off, not an oversight:
- Building real retry/outage-recovery (an outbox table + a cron sweep, mirroring StreetPlayR's own `operational_events` audit pattern) is real, scoped work for a later phase — not invented here to avoid over-building beyond what Phase 2 asked for ("clean server-side NECTAR client/adapter" — a synchronous best-effort call satisfies that).
- If reliability matters before that's built, the cheapest stopgap is: keep `operational_events` as the retry source of truth (it already fires on every order transition) and add a periodic reconciliation job comparing `operational_events` order-confirmation rows against NECTAR's `events` table for gaps — noted here, not built, to keep this phase's diff small per STRICT RULE 15.
