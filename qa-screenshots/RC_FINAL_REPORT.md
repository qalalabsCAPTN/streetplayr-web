# StreetPlayR — Final Release Candidate (RC) Audit Report

**Date:** 2026-07-24  
**Environment audited:** `npm run build` + `npm run start` on `http://localhost:3005`  
**Mode:** Verify / harden only — no new features

---

## Release Recommendation

### **NO-GO — do not deploy to production yet**

Blocking issues remain (see below). Fix and re-smoke before client handoff.

---

## Blocking Issues

~~Public `/api/health` env reconnaissance~~ — **fixed** (anonymous payload scrubbed; diagnostics behind `CRON_SECRET`).

### B1. Migration `00018` not applied on live Supabase (mandatory)

Service-role check against live project:

- `collections` → **empty `[]`**
- `collection_products` → **0 rows**
- Storefront collection SoT + wishlist table from `supabase/migrations/00018_collections_sot_wishlist.sql` are **not** present

**Action:** Apply `00018_collections_sot_wishlist.sql` on production Supabase (SQL editor or CLI), then verify rows exist.

### B2. Anon cannot read `products` (collections empty in production build)

| Actor | `products` SELECT |
|-------|-------------------|
| Anon key | **0 rows** (HTTP 200) |
| Service role | 20+ rows including storefront slugs |

Effect on prod build (`NODE_ENV=production`, `allowLocalCatalog() === false`):

- `/collections` (all chips) → **"No products in this collection yet."**
- Client catalog cannot load merch; local fallback correctly disabled

Schema migrations declare `"Products are publicly readable"`, but **live RLS does not allow anon SELECT**. Ops must restore public read for active storefront products (and variants as needed).

### B3. Collection filter validation cannot pass until B1+B2 fixed

Chip UI + titles work (Latest Drop / Short Sleeve / Long Sleeve / Tanks / Sweatpants / All Products).  
Membership filtering **cannot** be validated against live DB until products are readable and `collection_products` seeded.

---

## Lighthouse Results (measured — not estimated)

Target: production `/home`  
Artifacts:

- `qa-screenshots/lighthouse/desktop-home.report.html` (+ `.json`)
- `qa-screenshots/lighthouse/mobile-home.report.html` (+ `.json`)

| Category | Desktop | Mobile |
|----------|---------|--------|
| Performance | **47** | **49** |
| Accessibility | **98** | **98** |
| Best Practices | **78** | **79** |
| SEO | **100** | **100** |

| Metric | Desktop | Mobile |
|--------|---------|--------|
| LCP | **4.2 s** | **5.0 s** |
| CLS | **0** | **0** |
| FCP | 0.4 s | 1.5 s |
| TBT | **1,580 ms** | **6,530 ms** |
| Speed Index | 1.6 s | 4.4 s |
| TTI | 4.3 s | 21.5 s |
| INP | **n/a** (lab navigation audit; use field/CrUX or timespan for INP) |

Top performance drains: oversized/unoptimized images (multi‑MB savings), main-thread JS, unused JS (~320 KiB).

Perf scores are weak for “production-ready polish” but secondary to B1/B2 catalog blockers.

---

## Production Build & Smoke

| Check | Result |
|-------|--------|
| `npm run build` | Pass |
| `npx tsc --noEmit` | Pass (`scratch` + `*.test.*` excluded in `tsconfig.json`) |
| `npm run start` | Pass on port **3005** (3000 failed once: missing build race; rebuild present) |
| `/api/health` | **200** `status: "degraded"` — missing Stripe env keys; Supabase/auth/cron/unicommerce OK |

### Route smoke (HTTP)

All returned **200** (auth gates redirect as expected):

`/home`, `/collections` (+ category params), `/wishlist`, `/contact`, `/login`, `/create-account`, `/forgot-password`, `/faq`, `/about`, `/collaborations`, `/shipping-policy`, `/refund-policy`, `/privacy-policy`, `/terms`, `/exchanges`, `/stores`, `/profile`, `/api/health`  

- `/cart`, `/checkout` → redirect **`/login`** (expected when logged out)  
- `/entering-street-playR` → **`/home`**  
- Nav crawl from `/home` (30 links): **0 broken (4xx)**

---

## Collections Validation

| Item | Status |
|------|--------|
| Chip labels / titles | Pass |
| Loading / empty / error UI present in code | Pass |
| Live counts / uniqueness / sort vs membership | **Blocked** (B1+B2) |
| Prod build empty state | Confirmed on all filter URLs |

Expected membership after `00018` (by design / local SoT map): Latest Drop curated set; Tees exclude long-sleeve; Long sleeve = Stick No Bills; Tanks = Star Tank; Sweatpants = Carpenter; All = full active set.

---

## Wishlist Validation

| Step | Status |
|------|--------|
| Guest → login gate → pending flush (code) | Implemented |
| End-to-end on prod build | **Not fully exercised** (needs auth + readable products + `wishlists` from 00018) |
| Logout guest reset | Code path present; live E2E pending |

---

## Contact Form

| Check | Status |
|------|--------|
| HTML validation (empty submit) | Pass — `contact-name/email/subject/message` invalid |
| `isPending` disables fields / CTA | Pass (code + UI) |
| Server validation | Pass (`submitContactAction`) |
| Success / error UI | Present; DB insert soft-fails without breaking UX |
| Double-submit guard | Pending flag; no request-id dedupe (non-blocking) |

---

## Responsive Validation Summary

Puppeteer overflow-X pass on `/home` at:

320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920  

- `overflowX: false` all widths  
- Header + footer present  
- Visual polish of hero/cards/drawer not pixel-audited (no interactive drawer matrix beyond overflow)

---

## Security

| Check | Result |
|-------|--------|
| Hardcoded `sk_live` / `sk_test` / JWT blobs in source | Not found |
| Client secrets / service role in client bundles (spot) | Service role server-only pattern retained |
| Contact PII `console.log` | Removed earlier |
| Auth verbose logs | Gated to non-production `debug()` |
| Health route | **Hardened after swarm review:** public GET returns status enums only; full env `missing` / key inventories require `Authorization: Bearer $CRON_SECRET` |
| Debug endpoints | No extra debug routes found in smoke |

### Code-review swarm addendum ([RC storefront code review](98cfdd43-ab53-4927-ac23-eeab543974e4))

- **B1 health leak:** fixed in `app/api/health/route.ts` (scrub anonymous payload).
- **B2/B3 migration 00018 + schema preflight:** still open ops — confirm `collections.name` / `sort_order` and `collection_products.sort_order` before apply.
- **B4 UniCommerce:** `collection_products` upsert is create-only; do not rely on sync alone for SoT.
- Wishlist RLS: upsert may need UPDATE policy (non-blocking until multi-device sync stressed).

---

## Technical Debt Removed

- Unused contact section components deleted  
- `tsconfig` excludes `scratch` + `**/*.test.ts(x)` → clean `tsc`  
- Auth callback / contact logging hardened for production  
- Repo TODO/FIXME/debugger grep in app TS: **none**  
- Remaining `console.warn/error` are operational (catalog, wishlist adapter, integrations) — keep

---

## Files Deleted

- `components/sections/contact/Hero.tsx`
- `components/sections/contact/ContactInfo.tsx`

(Only `ContactForm.tsx` remains under `components/sections/contact/`. No remaining imports.)

---

## Files Modified (RC / related storefront set)

Notable: `tsconfig.json`, `app/(store)/auth/callback/route.ts`, `app/actions/contact.ts`, collections/wishlist/nav/contact/home/product paths, `lib/products/*`, `supabase/migrations/00018_*.sql`, Lighthouse artifacts under `qa-screenshots/lighthouse/`.

Full diff: see `git status`.

---

## Remaining Non-Blocking Items

1. Lighthouse Performance ~47–49 — image compression/next-gen formats, JS weight  
2. Health `degraded` for Stripe when Easebuzz is primary — align health required keys or set Stripe stubs intentionally  
3. Contact always returns success even if `support_tickets` insert fails — tickets may not persist  
4. Home/server may still surface local merch paths inconsistently vs collections fail-closed  
5. Wishlist E2E + guest→login→refresh matrix still needs manual pass after B1/B2  
6. INP not in lab navigation report — capture via field data or Lighthouse timespan  
7. Server logs: intermittent `PGRST116` product-by-slug 0-row coercions  

---

## Mandatory Handoff Checklist (from Meri Recommendation)

| # | Item | Status |
|---|------|--------|
| 1 | Apply Supabase migration **00018** on production | **OPEN — blocking** |
| 2 | Smoke on `npm run build && npm run start` | Done — catalog empty (B2) |
| 3 | Lighthouse Desktop + Mobile attached | Done — see paths above |
| 4 | Health + scratch TS clean / exclude | Done — `tsc` clean; health degraded for Stripe only |

---

## Re-test Gate (before GO)

1. Apply `00018` → confirm `collections` (6 rows) + `collection_products` links  
2. Fix anon RLS → anon `products?status=eq.active` returns storefront rows  
3. Prod start: each collection chip shows correct **count + unique slugs**  
4. Wishlist guest→login→restore→refresh→logout  
5. Contact success path once  
6. Optional: re-run Lighthouse; attach updated HTML
