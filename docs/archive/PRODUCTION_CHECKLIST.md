# Production Deployment Checklist

Ensure all items are verified prior to launching the Unicommerce integration layer.

---

## 1. Environment Configurations
- [ ] Configure `UNICOMMERCE_API_URL` with the production REST API domain.
- [ ] Configure `UNICOMMERCE_CLIENT_ID` (default: `my-trusted-client`).
- [ ] Configure `UNICOMMERCE_USERNAME` with credentials of an API user holding administrator roles in Uniware.
- [ ] Configure `UNICOMMERCE_PASSWORD` for the API user.
- [ ] Configure `UNICOMMERCE_FACILITY_CODE` representing the primary warehouse.
- [ ] Configure `UNICOMMERCE_WEBHOOK_SECRET` for cryptographically verifying webhook events.
- [ ] Set `DEMO_INVENTORY_MODE` to `false` inside the production `.env` settings to enable live database stock lookups.

---

## 2. Webhook Setup
- [ ] Enable webhooks in the Unicommerce console.
- [ ] Register the webhook callback endpoint: `https://<your-production-domain>/api/webhooks/unicommerce`.
- [ ] Map webhook subscription events:
  - `order.shipped`
  - `order.delivered`
  - `inventory.updated`

---

## 3. Database & Sync Schedules
- [ ] Deploy catalog items and verify that variant SKUs correspond to the SKUs registered in Unicommerce.
- [ ] Deploy schedulable runners (Vercel Cron / GitHub Actions) to trigger:
  - Catalog synchronization endpoint (hourly/daily): `UnicommerceService.sync.syncProducts()`
  - Inventory stock level updates (every 5-15 mins): `UnicommerceService.sync.syncInventory()`
- [ ] Verify that database RLS (Row Level Security) policies allow the service role to write records to:
  - `products`
  - `product_variants`
  - `inventory`
  - `idempotency_keys`
  - `operational_events`

---

## 4. Operational Sign-Off & SRE
- [ ] Run connection validation test: `await UnicommerceService.checkConnection()` must return `success: true`.
- [ ] Verify that the `/api/health` health check dashboard successfully reports `unicommerce` status as `ok`.
- [ ] Verify that operational event updates flow into the `operational_events` table log for administrator auditability.
