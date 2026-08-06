# StreetPlayR — Known Limitations (as of this release)

## 🔴 Blocking / needs owner action before handoff
- **Domain mismatch.** `cloudbuild.yaml` configures `_SITE_URL: https://streetplayr.com`, but live testing in this session showed `streetplayr.qalalabs.com` resolving to a Vercel `DEPLOYMENT_NOT_FOUND` page — an unrelated or deleted deployment, not this Cloud Run service. Whoever owns DNS/Vercel/domain settings needs to confirm which domain is the real production target and repoint it, then confirm Supabase Auth's Redirect URLs match.
- **Google/Facebook OAuth redirect allowlist unverified.** Symptom observed: OAuth code landed on the bare domain root (`?code=...`) instead of `/auth/callback`, which happens when the callback URL isn't in Supabase Dashboard → Authentication → URL Configuration → Redirect URLs. Needs Supabase dashboard access to confirm/fix — not fixable from the codebase.

## ⚠️ Should fix soon, not release-blocking
- **Checkout flow has no structured/persistent logging.** `app/actions/checkout.ts` has zero calls into a logger — failures are only visible via Cloud Run stdout, not a queryable log sink. `lib/orchestration/payment.ts` has exactly one error-path log call. Compare to the Unicommerce sync paths, which log every outcome via `UnicommerceLogger` into a persisted sink.
- **Brand resolution failures aren't logged anywhere persistent.** `resolveStorefrontBrandId()` throws but doesn't call any logger — relying entirely on the thrown error surfacing in Cloud Run logs or an error boundary.
- **28 of 49 products are in `draft` status** and correctly excluded from the storefront (`status = 'active'` filter confirmed in `lib/products/queries.ts`) — not a bug, but worth confirming with the client whether that's the intended catalog size or drafts are stuck mid-sync.
- **One product (`signature-cap`) has no collection membership** and is silently excluded from collection filters (console warning observed in live testing). Cosmetic/catalog data gap, not a code defect.
- **`scripts/` still contains ~40 one-off SQL/JSON scratch files** from prior security/perf audit sessions (`advisor_*.json`, `matrix_*.sql`, `_cols*.json`, etc.). Not deleted in this pass — flagged for a follow-up cleanup decision since some may be useful audit evidence (e.g. `advisor_security_before/after.json` documents the RLS fix).

## ℹ️ Informational
- No Vercel/Cloud Run production log access was available during this audit — Phase 6 performance numbers and the "zero occurrences in prod logs" check from the RLS verification could not be directly confirmed; the RLS fix itself *was* verified live against the production database via REST.
- `Nectar 2.0.zip` (228MB) sits at repo root, untracked, contents unverified — left in place pending owner review.
