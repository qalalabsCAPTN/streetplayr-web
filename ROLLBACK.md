# StreetPlayR — Rollback Procedure

## Application (Cloud Run)
Cloud Build's blue/green deploy keeps the previous revision serving traffic until the new one passes health checks, so most bad deploys never receive traffic in the first place. If a bad revision *did* get promoted:

```bash
# List revisions, newest first
gcloud run revisions list --service=streetplayr-web --region=asia-south1

# Roll back 100% traffic to the last known-good revision
gcloud run services update-traffic streetplayr-web \
  --region=asia-south1 \
  --to-revisions=<GOOD_REVISION_NAME>=100
```
No rebuild required — this just repoints traffic. Confirm with `curl <service_url>/api/health`.

## Database (Supabase migrations)
Migrations in `supabase/migrations/` are additive/forward-only by convention (no down-migrations checked in). To roll back a bad migration:
1. Write a new migration that reverses the specific change (e.g. `DROP POLICY`, restore prior column) — do not hand-edit prod schema directly.
2. Apply via Supabase CLI/MCP `apply_migration`.
3. If the bad migration granted overly-broad RLS access (the highest-risk category here — see `100006_allow_public_brands_read.sql` history), verify with `get_advisors(type=security)` immediately after the fix.

## Cron / Scheduler
Cloud Scheduler jobs are defined in Terraform (`terraform/modules/scheduler/main.tf`). To pause a misbehaving sync job without a full rollback:
```bash
gcloud scheduler jobs pause cron-sync-products --location=asia-south1
```
Resume with `jobs resume` once the underlying issue (usually Unicommerce API failure) is fixed. Jobs are idempotent per window, so pausing/resuming doesn't cause double-processing.

## Payments
Never manually retry a webhook without confirming idempotency — check `lib/orchestration/payment.ts` and the relevant order's existing status first. Stripe/Easebuzz will retry failed webhooks automatically; do not also trigger side effects from the dashboard unless the order is confirmed stuck.
