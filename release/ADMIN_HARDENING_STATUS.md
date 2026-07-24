# Admin Hardening — Status

Updated: 2026-07-24

## Done

| Item | Status |
|------|--------|
| Kill browser writes: settings / pages / platform-store | DONE |
| SSR hydrate sites via admin layout | DONE |
| Kill browser reads: customers / orders / wallets | DONE |
| Realtime gated (`NEXT_PUBLIC_OPS_REALTIME=1`) | DONE |
| Fulfill + campaign POST/PATCH → super_admin/ops_admin | DONE |
| `site_access` aligned to 00010 schema (no fake id/role) | DONE |
| Write RBAC: platform + CMS write roles narrowed | DONE |
| CMS toast only on real success | DONE |
| `tsc --noEmit` | PASS |

## Remaining (not blocking Admin P0 close)

| Item | Severity | Notes |
|------|----------|-------|
| `event-stream-monitor.tsx` browser reads | MEDIUM | LiveOps; next slice |
| Storefront CMS `block-renderer` / `CMSBestSellerWrapper` | OUT OF SCOPE | Storefront, not /admin |
| `lib/ops2/supabase.ts` still exists | OK | Gated realtime + storefront |
| eslint ban on ops2/supabase under admin | Nice | Regression guard |
| Missing API routes (kpis, customer detail) | MEDIUM | UI already has Server Actions |

## Verdict

**Admin Hardening P0: COMPLETE enough to proceed to Cart Schema.**

No `getSupabaseClient` under `app/admin/**`.
Ops already SSR + Server Actions.
Dashboard already server `createClient`.
