# StreetPlayR — Client Handoff

## What's live
A Next.js storefront backed by Supabase (products, collections, orders, auth) with:
- Product catalog synced automatically from Unicommerce every few minutes (products, inventory, order status, returns).
- Email, phone OTP, Google, and Facebook sign-in.
- Stripe and Easebuzz checkout.
- Wishlist, wallet/member credits, order tracking.
- 21 active products across 5 collections (Short Sleeve, Long Sleeve, Tanks, Sweatpants, All Products), verified live against the production database.

## What you need to do before go-live
1. **Confirm the production domain.** We found the site's expected domain (`streetplayr.com`, per deploy config) doesn't match the domain used in testing (`streetplayr.qalalabs.com`, which currently shows a broken/unrelated Vercel page). Someone with DNS and Vercel access needs to confirm the correct domain and repoint it to the Cloud Run service.
2. **Fix Google/Facebook login redirect.** Once the domain is confirmed, add `https://<your-domain>/auth/callback` to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs. This needs Supabase dashboard access we don't have.
3. **Review `Nectar 2.0.zip`** at the repo root — untouched, contents not verified in this pass, decide if it should ship or be removed.

## What we cleaned up
- Removed a 513MB duplicate nested copy of the entire repo (`streetplayr-web/`) and 116MB of one-off QA debug scripts (`tmp/`) that weren't part of the shipped app.
- Archived 20 old internal audit-report markdown files into `docs/archive/` so the repo root is readable for handoff.
- Removed 4 dead one-off debug parser scripts from `scripts/`.

## Where things live
- Deployment steps: `DEPLOYMENT.md`
- Operational troubleshooting: `RUNBOOK.md`
- Rollback steps: `ROLLBACK.md`
- Known gaps/limitations: `KNOWN_LIMITATIONS.md`
- Full release scorecard: this session's final report (below), plus `docs/archive/` for prior audit history.

## Support boundary
We do not have access to your Vercel account, Cloud Run production logs, or Supabase dashboard settings for this project — items requiring those (domain config, OAuth redirect allowlist, live prod log tailing) are flagged above as owner-action items, not resolved in this pass.
