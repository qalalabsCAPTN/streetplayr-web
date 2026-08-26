# StreetPlayR — Operations Runbook

## Health Check
`GET /api/health` — used by Cloud Run startup/liveness probes and by Cloud Build's own smoke test during deploy. Should return 200 with no auth required.

## Common Incidents

### "Failed to resolve dynamic brand ID"
`lib/products/brand.ts` throws this when the `brands` table has no row matching `NEXT_PUBLIC_BRAND_ID` (default `streetplayr`), or when the anonymous client can't read it.
1. Check RLS: `SELECT id FROM brands WHERE slug = 'streetplayr';` as the anon role should return exactly 1 row. If it errors/empty, verify the `"Brands are publicly readable"` SELECT policy exists on `public.brands`.
2. Check `NEXT_PUBLIC_BRAND_ID` matches an actual `brands.slug`.
3. This throws synchronously in server code paths — until fixed, catalog/collection/home pages will error rather than silently show nothing.

### Storefront shows empty catalog / collections
1. Confirm brand resolution above isn't failing.
2. Confirm products exist with `status = 'active'` for the resolved `brand_id` (draft products are intentionally excluded — see `lib/products/queries.ts:222`).
3. Check `collection_products` membership for the affected collection.

### Cron job failing / not running
1. All `/api/cron/*` routes require `Authorization: Bearer $CRON_SECRET` — a 401 means the Cloud Scheduler OIDC config or `CRON_SECRET` secret drifted.
2. Sync jobs log structured events via `UnicommerceLogger` (see `src/integrations/unicommerce/logging.ts`) — check that log sink for `cron.sync_*_failed` events before checking Cloud Run logs.
3. Jobs are idempotent per time window (`idempotencyGuard`) — a job that already ran in the current window returns `{skipped: true}`, not an error.

### Google/Facebook login fails, lands on `/auth/auth-code-error`
1. Confirm `app/(store)/auth/callback/route.ts` actually received the request — if the browser instead lands on the bare domain root with a `?code=` param, the OAuth code never reached the callback route at all. That means Supabase's **Site URL** fallback fired because `<origin>/auth/callback` isn't in Supabase Dashboard → Authentication → URL Configuration → Redirect URLs. Fix the allowlist, not the code.
2. Confirm the domain in question actually resolves to this Cloud Run service (see `KNOWN_LIMITATIONS.md` — a stray domain pointing at an unrelated/deleted deployment produces the same "auth broken" symptom without touching any auth code).
3. If the code does reach `/auth/callback` and still fails, check server logs for `[Auth Callback] exchangeCodeForSession error:` — usually a PKCE code-verifier cookie mismatch (must use the browser Supabase client for `signInWithOAuth`, not a Server Action — already implemented correctly in `LoginModal.tsx`/`login/page.tsx`).

### Payment webhook not updating order status
1. Verify Easebuzz reverse-hash uses the same `EASEBUZZ_SALT` / `EASEBUZZ_ENV` as initiate for **this** environment.
2. Check `lib/orchestration/payment.ts` and `operational_events` for `payment.*` / Unicommerce push failures.

## Rollback
See `ROLLBACK.md`.

## Escalation
Unicommerce sync failures, payment webhook failures, and RLS/auth regressions are the highest-blast-radius incident classes for this app — they affect live orders and login, not just display. Treat 5xx spikes on `/api/cron/*` or `/api/webhooks/*` as high priority.
