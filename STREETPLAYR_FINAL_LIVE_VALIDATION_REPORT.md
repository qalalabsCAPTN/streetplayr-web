# StreetplayR Final Live Validation Report

**Date:** 2026-08-25  
**Master checklist:** `StreetplayR Final Feedback to Map.md`  
**Repo:** `c:\Users\pc\Desktop\streetplayr - open code`  
**Production probed:** `https://www.streetplayr.com`  
**playR.in probed:** `https://playr.in/`  

**Evidence rule used**
- `CODE VERIFIED` — repository inspected/fixed; not assumed from comments or old reports.
- `LIVE VERIFIED` — browser/CDP against production (or playR.in) in this session.
- `BLOCKED` — needs credentials, dashboard, DNS, or a real payment/OTP that must not be faked.

---

## 1. Executive Summary

| Metric | Count |
| ------ | ----- |
| Total checklist items | **38** (sections 1–7, including nested analytics IDs) |
| Already correct on production | **6** |
| Fixed in this repo (awaiting deploy) | **22** |
| Partially fixed | **4** |
| Still failed in code | **1** |
| Blocked (external) | **5** |

**Production is still the 9 Aug 2026 Lookbook commit.** Local working tree is **not deployed**. Live checks therefore describe **old** behaviour. Local checks describe **current** source.

### Architecture (Phase 1)

| Layer | Fact |
| ----- | ---- |
| Framework | Next.js **16.2.4**, React **19.2.4**, App Router, Turbopack |
| Package manager | npm (`package.json`) |
| Monorepo | No — single Next app |
| Storefront | `app/(store)/` |
| Admin | `app/admin/` |
| Database / auth | Supabase (PostgreSQL + RLS). Phone OTP via `signInWithOtp`. No ConvertWay / Interakt / Netcore in repo. |
| Payments | Easebuzz (`lib/easebuzz/client.ts`, `app/actions/easebuzz.ts`, `app/api/webhooks/easebuzz/route.ts`). Demo UI gated off production `NODE_ENV`. |
| Catalog | `ProductQueries` → live Supabase / LKG / `lib/products/data.ts`. Unicommerce sync scripts exist under `src/integrations/unicommerce/`. |
| Loyalty | `profiles.sprr_balance` + `wallet_transactions`. Nectar admin/engine still present; privacy copy cleaned locally. |
| Host routing | `proxy.ts` (Next 16; no `middleware.ts`). StreetplayR storefront host is **streetplayr.com**. |
| PWA | `app/manifest.ts` |
| Deployed HEAD (git) | `85962a8990802423cc2c9de8524d7ac335de96b8` — `v1- Lookbook image change` — **2026-08-09 00:05:28 +0530** — branch `main` tracking `origin/main` |

### Verdict

### YELLOW

Repo implements most checklist items. Production still serves 9 Aug build (2XL, Street PlayR titles, NECTAR policy, missing Pixel/GA4/GSC, 4-col footer). Phone OTP, SMTP `playR Auth`, Nectar balance dump, Merchant/Pinterest **approval**, and a real Easebuzz charge remain external. Scroll/video overlay not root-caused.

Not GREEN: live does not match the checklist. Not RED as a repo verdict: critical storefront gaps have local fixes ready to ship; remaining RED-class items are mostly blockers or undeployed.

---

## 2. Requirement-by-Requirement Matrix

| ID | Requirement | Initial Status | Fix Applied | Code Validation | Live Validation | Final Status | Evidence |
| -- | ----------- | -------------- | ----------- | --------------- | --------------- | ------------ | -------- |
| 1.1 | Brand **StreetplayR** (lowercase p, uppercase R) | FAIL | Metadata, layouts, policy copy, Easebuzz `productInfo` | CODE VERIFIED `app/layout.tsx` title `StreetplayR`; store layouts retitled | LIVE: `<title>Street PlayR \| Enter The Play</title>` on `/home` | PARTIAL — code ready, awaiting deploy | CDP homepage title 2026-08-25 |
| 1.2 | Categories Tees → Topwear, Pants → Bottomwear | PARTIAL | Home sections, collections chips, CMS heading remap, Categories strip | CODE VERIFIED `home/page.tsx`, `collections.ts` DESKTOP_CHIPS Topwear/Bottomwear | LIVE: Topwear + Bottomwear headings exist; extra **Pants** CMS heading; collections chips still T-Shirts / Sweatpants | PARTIAL — code ready, awaiting deploy | Homepage snapshot headings e161/e174/e175; collections chips e10–e13 |
| 1.3 | PWA title **STREET playR** + official playR icon | FAIL | `app/manifest.ts` name/short_name `STREET playR`; icons `/playR.street logo.png` | CODE VERIFIED | LIVE manifest: `"name":"Street PlayR"`, icon `/favicon.ico` only | PARTIAL — code ready; official `.ico` asset never found in repo | `https://www.streetplayr.com/manifest.webmanifest` CDP JSON |
| 1.4 | Favicon official branding | FAIL | `app/layout.tsx` icons → `/playR.street logo.png` | CODE VERIFIED | LIVE tab still uses old favicon.ico path in manifest | PARTIAL — code ready; no separate official favicon file in repo | manifest icons array live |
| 2.1 | Size order XS → S → M → L → XL | FAIL | `lib/products/sizes.ts` + PDP/catalog sort | CODE VERIFIED +  unit tests | LIVE waffle: XS, XL, S, M, L, 2XL; Inspired: M, L, XS, S, 2XL, XL | PARTIAL — code ready, awaiting deploy | PDP `PS-TEE-CRT-WHT`, `PS-TEE-INS-PRP` |
| 2.2 | Remove selectable 2XL/XXL | FAIL | Filter in sizes helper + queries + collections filters | CODE VERIFIED | LIVE 2XL button on waffle + Inspired PDPs | PARTIAL — code ready, awaiting deploy | PDP snapshots button name `2XL` |
| 2.3 | Waffle 220 GSM lightweight copy | FAIL | `withClientProductCopy` replaces 350 GSM on waffle SKUs; appends 220 GSM if missing | CODE VERIFIED | LIVE waffle description has waffle-knit; details still `350 GSM`; no `220 GSM` | PARTIAL — code ready, awaiting deploy | PDP `PS-TEE-CRT-WHT` description + `* Heavyweight … (350 GSM)` |
| 2.4 | PDP image 2–3px right line | FAIL | `styles/storefront.css` image scale/object-fit | CODE VERIFIED CSS | LIVE not pixel-measured this session | PARTIAL — CSS present; live visual unconfirmed on current deploy | storefront.css PDP media |
| 2.5 | Hide 3D product-view CTA (keep architecture) | FAIL | `SHOW_3D_PRODUCT_VIEW = false`; viewer still in tree | CODE VERIFIED `ProductDetailClient.tsx` | LIVE Inspired PDP: no 3D control | CODE READY / LIVE: 3D CTA absent (may also be missing live `model3d`) | Inspired snapshot; flag in source |
| 2.6 | AI Try-On real; remove purple tint (try-on, credits, sizes) light+dark | PARTIAL | Try-on already wired (`@google/genai` / Gradio). Light-mode CSS de-purple | CODE VERIFIED uploader on PDP | LIVE waffle: uploader present. Purple tint / dark mode not screenshot-proven. Try-on result not run (needs photo + API key) | PARTIAL | PDP waffle refs e21–e45; try-on result BLOCKED without live AI credentials |
| 2.7 | Limited Stock; no size-qty counters | FAIL | Copy + CSS; size pills labels only | CODE VERIFIED | LIVE: no Limited Stock; no qty numbers on size pills (good) | PARTIAL — alert missing live; counters already absent | waffle PDP |
| 2.8 | Buy Now + credit slider cursor solid black | FAIL | storefront.css light-mode cursor | CODE VERIFIED | LIVE cursor not inspected (automation cannot prove CSS cursor) | PARTIAL — code ready | CSS only |
| 3.1 | Fix `Unsupported phone provider` | FAIL | Not hidden. Root: Supabase Auth SMS provider unset | N/A | LIVE: Phone OTP tab on `/login?redirect=%2Fcheckout`. OTP send not executed | **BLOCKED** | Needs Supabase Dashboard SMS provider (Twilio/MessageBird/etc.). ConvertWay/Interakt/Netcore **not in codebase** |
| 3.2 | SMS + WhatsApp OTP (ConvertWay / Interakt / Netcore) + templates | FAIL | None — no provider SDK | N/A | Not testable | **BLOCKED** | Zero matches for ConvertWay/Interakt/Netcore. Needs vendor account + DLT templates + Auth hook |
| 3.3 | SMTP `orders@playR.in` / **playR Auth** replace Supabase Auth emails | FAIL | Not in-app | N/A | Email inbox not accessed | **BLOCKED** | Supabase Auth SMTP + sender name. Repo cannot set dashboard SMTP |
| 3.4 | Dashboard visibility + post-login redirect loops | PARTIAL | Auth profile now selects `sprr_balance` | CODE VERIFIED `lib/auth/service.ts` | LIVE: checkout redirects to login (expected). Full signup→dashboard→logout not run (no test account) | PARTIAL | `https://www.streetplayr.com/login?redirect=%2Fcheckout` |
| 3.5 | Order + site-query mail to `orders@playR.in` (forward/CC) | PARTIAL | Contact action `cc: orders@playR.in` on ticket insert | CODE VERIFIED `app/actions/contact.ts` | Footer mailto live. Transactional order email + forwarding not proven | PARTIAL / BLOCKED SMTP | No in-repo mailer for paid-order receipts |
| 4.1 | Live Easebuzz; no Demo Payment; no Razorpay Coming Soon | PARTIAL | Demo gated `NODE_ENV !== 'production'`; Razorpay removed from source; hash/webhook/idempotency in `lib/easebuzz` + webhook route | CODE VERIFIED | LIVE homepage: no Demo Payment, no Razorpay. Checkout not opened (auth wall). No real charge (policy) | PARTIAL — code ready; live checkout UI unverified | Homepage CDP `hasDemoPayment:false hasRazorpay:false` |
| 4.2 | Member credits: balance, redeem, 50% cap, ledger, rollback | FAIL | `lib/loyalty/redemption.ts`; checkout `creditsToApply`; `redeemSPRR`/`refundSPRR` on payment | CODE VERIFIED + tests | LIVE PDP slider **hardcoded 500**, readonly. Checkout not reached | PARTIAL — code ready, awaiting deploy | waffle slider `value: 500` |
| 4.3 | Migrate Nectar balances; cancel Nectar; remove NECTAR Ecosystem from policy | FAIL | Privacy/terms rewrite local. **No production dump applied** | Policy CODE VERIFIED. Migration **not done** | LIVE privacy **§3 NECTAR Ecosystem** still published | Policy: PARTIAL (awaiting deploy). Data migrate: **BLOCKED** | `https://www.streetplayr.com/privacy-policy` heading e35 |
| 5.1 | Bottom nav must not overlap try-on / login / summary / footer | PARTIAL | Login modal + dock padding CSS | CODE VERIFIED | Mobile viewport not driven this session | PARTIAL | Needs device/viewport pass post-deploy |
| 5.2 | Theme toggle must not overlap `+ playR` on policy pages | FAIL | CSS offset | CODE VERIFIED | Privacy page toggle present; overlap not screenshot-measured | PARTIAL | `/privacy-policy` |
| 5.3 | Navbar transparent → glass after ~60px; no solid slabs | PARTIAL | `Navbar.tsx` `scrollY > 60` already | CODE VERIFIED | Scroll-state glass not CDP-proven | PARTIAL | Code path exists pre-this-task |
| 5.4 | Nav icons contrast before scroll | PARTIAL | Existing theme/icon CSS | CODE VERIFIED (not newly proven) | Not contrast-metered | PARTIAL | Needs light/dark screenshot |
| 5.5 | Reduce mobile size / Add to Bag / Buy Now padding | FAIL | storefront.css PDP CTA spacing | CODE VERIFIED | Mobile layout not live-resized | PARTIAL | Awaiting deploy + mobile viewport |
| 5.6 | Footer borderless 1×5; policies + collections; `orders@playR.in`; `+91 95993 70409` | FAIL | `Footer.tsx` 5-col Shop/Policies/Contact/Connect/star | CODE VERIFIED | LIVE 4-col Connect / Order Support / We are playR. Email **yes**. Phone number **not** on homepage footer (on privacy body yes) | PARTIAL — code ready | Homepage footer vs `Footer.tsx` |
| 5.7 | Best Sellers 1×3, highest volume last 15 days | FAIL | `getBestSellers` + `BestSellersRow` + `/api/storefront/best-sellers` | CODE VERIFIED + tests | LIVE homepage **no Best Sellers** heading | PARTIAL — code ready; live query may fall back to catalog slice if join fails | CDP `hasBestSellers:false` |
| 6.1 | Discover More broken secondary page | FAIL | CMS wrapper `moreHref` to real collection URLs; default collections chip = all products | CODE VERIFIED | LIVE href `https://www.streetplayr.com/collections?category=all` — **12 products** load | LIVE: page works (not empty). CMS still uses `category=all` | CDP 12 product links |
| 6.2 | Recently Visited card arrows | FAIL | `recently-visited` CSS forces arrows | CODE VERIFIED | LIVE after PDP visit: Previous/Next image on recently visited cards | LIVE VERIFIED (arrows appear once history exists) | Homepage snapshot e190/e191 |
| 6.3 | Wishlist real; no Coming Soon | PARTIAL | Existing wishlist; no Coming Soon copy | CODE VERIFIED | LIVE `/wishlist`: “Sign in to save and sync”. PDP Save to wishlist. No Coming Soon | LIVE VERIFIED for guest empty state. Auth persistence not logged-in tested | `/wishlist` |
| 6.4 | Search titles + tags + descriptions | PARTIAL | `productMatchesQuery` includes tags/metadata | CODE VERIFIED + tests | LIVE query `waffle` returns 3 waffle tees (title match). Tags/description search not isolated | PARTIAL — titles LIVE; tags CODE only | Search overlay e113–e115 |
| 6.5 | Inverted scroll, lazy load, overlay gap after video | FAIL | **Not root-caused this pass** | None | Not reproduced with a dedicated video-end capture | **FAIL** | Needs scroll/video session after deploy |
| 6.6 | playR.in → dedicated storefront, not streetplayr.com/home | Unknown | `proxy.ts` comment: do not rewrite playR.in onto streetplayr.com | N/A | LIVE `https://playr.in/` is **separate** Shopify/IPL catalog, title “Buy Official IPL Jerseys…”. **Does not** redirect to streetplayr.com/home | LIVE VERIFIED (no bad redirect). StreetplayR itself is **streetplayr.com**. Putting StreetplayR on playR.in is **DNS/hosting BLOCKED** | playR.in snapshot |
| 7.1 | Meta Pixel `1509391096798985` | FAIL | `lib/analytics/tags.ts` + layout Script/noscript | CODE VERIFIED | LIVE HTML **no** pixel ID; `fbq` false | PARTIAL — code ready, awaiting deploy | CDP `pixel:false` |
| 7.2 | GA4 `G-H6YTBN6B8C` | FAIL | gtag config in `app/layout.tsx` | CODE VERIFIED | LIVE **no** `G-H6YTBN6B8C`. GTM `GTM-5ZZQ7XJ2` + Ads `AW-18205202945` **yes** | PARTIAL — code ready | CDP `ga4:false gtm:true ads:true` |
| 7.3 | GSC `google-site-verification=WStkoesAkk2LkFfVGRNGBLsmAKBYOOfmPgD_7Xw0sGo` | FAIL | `metadata.verification.google` | CODE VERIFIED | LIVE HTML **no** verification token | PARTIAL — code ready | CDP `gsc:false` |
| 7.4 | Google Merchant Center product feed | FAIL | `GET /api/feeds/google-merchant` | CODE VERIFIED route | LIVE **404** “This page does not exist in the collection.” Dashboard approval not accessed | PARTIAL (code) + **BLOCKED** (Merchant Center UI) | `https://www.streetplayr.com/api/feeds/google-merchant` |
| 7.5 | Pinterest catalog feed | FAIL | `GET /api/feeds/pinterest` | CODE VERIFIED route | Not hit separately; same undeployed API. Pinterest Business not accessed | PARTIAL (code) + **BLOCKED** (Pinterest UI) | `app/api/feeds/pinterest/route.ts` |

---

## 3. Changes Made

### New files
- `lib/products/sizes.ts` + `sizes.test.ts`
- `lib/loyalty/redemption.ts` + test
- `lib/products/search.ts` + test
- `lib/products/best-sellers.ts` + test
- `lib/products/copy.ts`
- `lib/analytics/tags.ts`
- `app/api/feeds/google-merchant/route.ts`
- `app/api/feeds/pinterest/route.ts`
- `app/api/storefront/best-sellers/route.ts`
- `components/sections/home/BestSellersRow.tsx`

### Storefront / checkout / auth (high signal)
- `app/layout.tsx` — StreetplayR metadata, GSC, Pixel, GA4
- `app/manifest.ts` — STREET playR
- `app/(store)/product/[slug]/ProductDetailClient.tsx` — size order, hide 3D, Limited Stock, real credits slider
- `app/(store)/product/[slug]/page.tsx`
- `lib/products/queries.ts` — sizes, waffle copy, `getBestSellers`
- `lib/auth/service.ts` — `sprr_balance`
- `app/actions/checkout.ts` — credit deduction
- `lib/orchestration/payment.ts` — redeem/refund credits
- `app/(store)/checkout/page.tsx` — real balance, 50% cap
- `app/(store)/home/page.tsx` — Bottomwear + Best Sellers row
- `app/(store)/collections/page.tsx` — filters, Discover more, Bottomwear types
- `lib/products/collections.ts` — Topwear/Bottomwear chips; empty category = all products
- `components/page-editor/wrappers/CMSBestSellerWrapper.tsx` — **do not hijack all CMS carousels as best-sellers**; remap Pants/Tees headings
- `components/layout/Footer.tsx` — 5-col
- `components/layout/Navbar.tsx` — tag search
- `app/(store)/privacy-policy/page.tsx` + `terms` — NECTAR Ecosystem removed
- `styles/storefront.css` — PDP crop, try-on light mode, CTA cursor, footer, dock padding
- `proxy.ts` — host comment
- Store metadata layouts (login, about, contact, policies, etc.)
- `app/actions/contact.ts` — CC orders@playR.in
- `app/actions/easebuzz.ts` — StreetplayR product info string

### Not changed (on purpose)
- No fake OTP success, no fake payment, no invented Nectar balances.
- 3D viewer code kept behind flag.
- Nectar engine left in admin; customer-facing policy copy only.

### Environment / migrations
- No new env vars required for Pixel/GA4/GSC (IDs in `lib/analytics/tags.ts`).
- Easebuzz still needs production `EASEBUZZ_*` already expected by client.
- SMS/SMTP still dashboard-only.
- `supabase/migrations/100007_payment_events_reconciled.sql` existed in working tree (payment workstream); not claimed as Nectar migrate.

---

## 4. Tests

Commands run this session (2026-08-25):

```text
npx tsc --noEmit
npx vitest run lib/products/sizes.test.ts lib/products/search.test.ts lib/products/best-sellers.test.ts lib/loyalty/redemption.test.ts
```

Results:
- `tsc --noEmit` — **exit 0**
- Vitest — **4 files, 28 tests, all passed** (377ms)

Earlier in the same overall effort (prior turn): broader vitest set **77 passed**; ESLint on touched files **0 errors** (pre-existing warnings: `any`, unused vars, `next-script-for-ga`, noscript pixel `<img>`).

**Not re-run this turn:** `npm run build` (minutes-long). Typecheck is the compile gate used here.

**Not run:** full WCAG `a11y_scanner.py` (script not in this repo). PDP sizes use native `<button>`; collections cards are links.

---

## 5. Production Validation

Desktop Chromium via Cursor browser. Viewport: default desktop automation (not iPhone). No real payment. No OTP send.

| URL | Test | Expected | Actual | Result |
| --- | ---- | -------- | ------ | ------ |
| `https://www.streetplayr.com/home` | Brand title | StreetplayR | Street PlayR \| Enter The Play | FAIL live |
| `/home` | Topwear / Bottomwear | Only those category names | Topwear + Bottomwear **and** Pants | PARTIAL |
| `/home` | Best Sellers 1×3 | Present, order-volume | Heading absent | FAIL live |
| `/home` | Demo / Razorpay | Absent | Absent | PASS live |
| `/home` | Footer 5-col + phone | 5-col; +91 95993 70409 | 4-col; email yes; phone no | FAIL live |
| `/home` | Analytics | Pixel + GA4 + GSC | GTM + Google Ads only | FAIL live |
| `/home` Discover more | Working collection | Products | `collections?category=all` **12 pieces** | PASS live (href still `all`) |
| `/home` Recently visited | Arrows | Visible | Prev/Next after visiting PDPs | PASS live |
| `/product/PS-TEE-CRT-WHT` | Size order / 2XL / 220 GSM / Limited Stock / 3D | XS–XL, no 2XL, 220 GSM, Limited Stock, no 3D | Jumbled + 2XL; 350 GSM; no Limited Stock; AI Try-On present; credits=500 | FAIL vs checklist |
| `/product/PS-TEE-INS-PRP` | 3D CTA / sizes | Hidden 3D; XS–XL no 2XL | No 3D CTA; 2XL present; order M L XS S 2XL XL | PARTIAL |
| `/collections?category=all` | Discover target | Product grid | 12 products | PASS live |
| Search `waffle` | Title match | Waffle SKUs | 3 waffle tees | PASS live (titles) |
| `/wishlist` | No Coming Soon | Real wishlist | Sign-in empty state | PASS live (guest) |
| `/login?redirect=/checkout` | Auth gate | Login, Phone OTP | Email + Phone OTP + Google/Facebook | PASS structure; OTP BLOCKED |
| `/privacy-policy` | No NECTAR Ecosystem | Removed | §3 NECTAR Ecosystem | FAIL live |
| `/privacy-policy` | Phone | +91 95993 70409 | Link present | PASS live |
| `/manifest.webmanifest` | STREET playR | STREET playR | Street PlayR / StreetPlayR | FAIL live |
| `/api/feeds/google-merchant` | XML feed | 200 XML | 404 storefront | FAIL live |
| `https://playr.in/` | Not redirect to streetplayr.com/home | Own storefront | Own Shopify/IPL site | PASS (no redirect) |

---

## 6. Remaining Blockers

1. **Deploy** this working tree to production. Until then almost every “fixed” row stays LIVE FAIL.
2. **Supabase Auth SMS provider** — `Unsupported phone provider`. Not ConvertWay/Interakt/Netcore in code. Needs dashboard provider + DLT templates + sender ID.
3. **Supabase Auth SMTP** — `orders@playR.in` / **playR Auth**. Inbox not accessible from this repo.
4. **Nectar → `sprr_balance` migration** — no dump, no production write. Cancelling Nectar without a migrate script would drop ecosystem credits.
5. **Easebuzz live charge** — not executed (safe). Confirm production key/salt/webhook URL in Easebuzz dashboard after deploy.
6. **Google Merchant Center / Pinterest** — feeds exist in repo; dashboards not logged in; live 404 until deploy.
7. **Official playR PWA/favicon master asset** — using `/playR.street logo.png`. No dedicated `.ico` from brand pack in repo.
8. **playR.in DNS** — currently a different store. Pointing it at this Next app is a hosting/DNS change, not an app redirect bug.
9. **Logged-in dashboard / credit checkout / AI Try-On result** — need a real member account and AI provider key.

---

## 7. Final Verdict

### YELLOW

---

## Appendix A — What was already correct (production)

- `orders@playR.in` in storefront footer.
- Wishlist is not a fake “Coming Soon” page.
- Search finds waffle products by title.
- Discover More `?category=all` returns 12 SKUs.
- Recently Visited image arrows appear after browsing PDPs.
- AI Try-On uploader exists on waffle PDP.
- Homepage does not show Demo Payment or Razorpay.
- GTM `GTM-5ZZQ7XJ2` and Google Ads `AW-18205202945` initialize.
- playR.in does **not** bounce to streetplayr.com/home.
- Inspired PDP has no visible 3D CTA.
- Size pills do not show per-size quantity numbers.

## Appendix B — What was broken (production, this session)

- Brand string **Street PlayR** / **StreetPlayR**.
- Extra **Pants** shelf; collections chips still T-Shirts / Sweatpants.
- PWA name Street PlayR; favicon.ico only.
- Size order jumbled; **2XL selectable**.
- Waffle **350 GSM**, not 220 GSM.
- Member credits slider **500 hardcoded**.
- No Limited Stock line.
- Privacy **NECTAR Ecosystem**.
- Footer not 5-col; homepage missing phone.
- No Best Sellers 15-day row.
- No Meta Pixel / GA4 `G-H6YTBN6B8C` / GSC token.
- Merchant feed 404.
- Phone OTP provider (not exercised; architecture BLOCKED).

## Appendix C — What this repo now does (undeployed)

See §3. Highest-impact: sizes, 2XL strip, credits math, analytics IDs, feeds, footer, privacy, PWA name, CMS carousel not overwritten by best-sellers, waffle 220 GSM overlay.

## Appendix D — Production git / deploy state

```
85962a8990802423cc2c9de8524d7ac335de96b8
qalalabsCAPTN
v1- Lookbook image change
2026-08-09 00:05:28 +0530
main...origin/main
```

Working tree: **dirty** (this feedback pass + prior Easebuzz/Nectar files). **No commit created** (not requested). Production will not change until someone deploys.

---

# FINAL POST-FIX VALIDATION

**Pass date:** 2026-08-25 (second pass, same calendar day as Pass 1)  
**Browser:** Cursor Chromium (CDP)  
**Production host:** `https://www.streetplayr.com`  
**Did not use localhost for live checks.**

Evidence states used below:

- `CODE VERIFIED` — present in this working tree
- `LIVE VERIFIED` — observed on production
- `BLOCKED` — external credential / dump / dashboard / intentional non-execution
- `FAIL` — still wrong where tested

These four are never swapped.

---

## Repository State

| Field | Value |
| ----- | ----- |
| Branch | `main` tracking `origin/main` |
| HEAD | `85962a8990802423cc2c9de8524d7ac335de96b8` |
| `origin/main` | `85962a8990802423cc2c9de8524d7ac335de96b8` (identical) |
| Ahead / behind | 0 / 0 |
| Working tree | **DIRTY** — do not discard |
| Latest committed message | `v1- Lookbook image change` (2026-08-09 00:05:28 +0530) |
| This pass committed? | **No** (not requested) |
| This pass deployed? | **No** |

### What is committed (production-equivalent git)

Only the 9 Aug Lookbook commit. Production HTML/title/feeds still match that era, not the dirty tree.

### What is uncommitted (local only)

Modified storefront/layout/PDP/footer/analytics/checkout/privacy files, plus untracked `app/api/feeds/`, `app/api/storefront/best-sellers`, `lib/analytics/`, `lib/loyalty/`, `lib/products/{sizes,copy,search,best-sellers}*`, `components/sections/home/BestSellersRow.tsx`, this report, and prior admin/Nectar artifacts.

### What is deployed

Production still behaves as the old commit: `Street PlayR` titles, 2XL, 350 GSM, 4-col footer headings, feeds 404, no Pixel/GA4/GSC in HTML.

### What is not deployed

**All Pass 1 + Pass 2 storefront fixes.** Status: **CODE FIXED — NOT DEPLOYED.**

No Cloud Run / hosting credentials were used from this environment.

---

## Build/Test

| Check | Result | Notes |
| ----- | ------ | ----- |
| `npx tsc --noEmit` | **PASS** (exit 0) | After Pass 2 source |
| `npx vitest run` | **PASS** | 16 files / 130 tests |
| `npm run build` | **PASS** | Next.js 16.2.4 Turbopack ~78s; routes include `/api/feeds/google-merchant`, `/api/feeds/pinterest`, `/api/storefront/best-sellers`, `/manifest.webmanifest` |
| Build warning | Non-blocking | Product `signature-cap` excluded from filtered collections (no `collection_products` row) |

CSS-only follow-up after that build: sticky `.pdp__actions` above the mobile dock (`styles/storefront.css`). Not a type/test regression; not in the compiled production bundle until next deploy.

---

## Requirement Matrix

| ID | Requirement | Previous Status | Fix | Current Code Status | Current Live Status | Final Status | Evidence |
| -- | ----------- | --------------- | --- | ------------------- | ------------------- | ------------ | -------- |
| 1.1 | Brand StreetplayR | PARTIAL | Metadata/layouts still StreetplayR | CODE VERIFIED `app/layout.tsx` title `StreetplayR` | LIVE FAIL: `<title>Street PlayR \| Enter The Play</title>` | PARTIAL | Homepage HTML 2026-08-25 pass 2 |
| 1.2 | Topwear / Bottomwear | PARTIAL | Home + chips + CMS remap still in source | CODE VERIFIED | LIVE PARTIAL: home has Topwear + Bottomwear; collections chips still Short/Long Sleeve T-Shirts + Sweatpants | PARTIAL | Home headings CDP; collections chips |
| 1.3 | PWA `STREET playR` | PARTIAL | `app/manifest.ts` name/short_name | CODE VERIFIED | LIVE FAIL: `"name":"Street PlayR"`, `"short_name":"StreetPlayR"`, `start_url:"/"` | PARTIAL | `https://www.streetplayr.com/manifest.webmanifest` 200 |
| 1.4 | Favicon / app icon | PARTIAL | Icons → `/playR.street logo.png` | CODE VERIFIED PNG exists on disk. **No `.ico` in repo** — not a fabricated PASS | LIVE FAIL: manifest icons `/favicon.ico` only | PARTIAL | public `playR.street logo.png`; live manifest JSON |
| 2.1 | Sizes XS→S→M→L→XL | PARTIAL | `sortApparelSizes` | CODE VERIFIED + tests | LIVE FAIL: waffle `XS, XL, S, M, L, 2XL` | PARTIAL | PDP `PS-TEE-CRT-WHT` CDP 390×844 |
| 2.2 | No 2XL/XXL | PARTIAL | `REMOVED_APPAREL_SIZES` | CODE VERIFIED | LIVE FAIL: 2XL still selectable | PARTIAL | same PDP |
| 2.3 | Waffle 220 GSM | PARTIAL | `lib/products/copy.ts` | CODE VERIFIED | LIVE FAIL: 350 GSM present, 220 GSM absent | PARTIAL | waffle PDP text |
| 2.4 | Image offset | PARTIAL | CSS | CODE VERIFIED | LIVE not re-measured in px | PARTIAL | CSS only |
| 2.5 | Hide 3D CTA | PARTIAL | `SHOW_3D_PRODUCT_VIEW = false` | CODE VERIFIED | LIVE: no 3D CTA (old deploy also omitted it) | PARTIAL | waffle/inspired; flag still false locally |
| 2.6 | AI Try-On | PARTIAL | Uploader already wired | CODE VERIFIED | LIVE: uploader on waffle. Result not run | PARTIAL | try-on box t=908 (below fold at measured scroll) |
| 2.7 | Limited Stock; no qty counters | PARTIAL | Copy + size labels | CODE VERIFIED | LIVE: no Limited Stock; size pills have no qty numbers | PARTIAL | waffle CDP `hasLimited:false` |
| 2.8 | CTA cursor | PARTIAL | CSS | CODE VERIFIED | LIVE cursor not inspectable via automation | PARTIAL | CSS only |
| 3.1 | Phone OTP provider | BLOCKED | None — cannot invent SMS | N/A | LIVE: Phone OTP tab + Phone number + Send code. OTP **not sent** | BLOCKED | `/login?redirect=%2Fcheckout` click Phone OTP |
| 3.2 | ConvertWay/Interakt/Netcore | BLOCKED | Absent from repo | N/A | Not testable | BLOCKED | Zero provider SDKs |
| 3.3 | playR Auth SMTP | BLOCKED | Dashboard SMTP | N/A | Inbox not accessed | BLOCKED | Supabase Auth SMTP unset from this env |
| 3.4 | Dashboard / redirects | PARTIAL | `sprr_balance` select | CODE VERIFIED | LIVE: `/checkout` → `/login?redirect=%2Fcheckout`. Member dashboard not logged in | PARTIAL | CDP login URL |
| 3.5 | Order mail `orders@playR.in` | PARTIAL | Contact CC | CODE VERIFIED | LIVE mailto exists. Receipts unproven | PARTIAL | Footer + FAQ contact |
| 4.1 | Easebuzz live pay | PARTIAL | initiate hash, `verifyResponseHash`, webhook, demo gated | CODE VERIFIED `lib/easebuzz/client.ts` `EASEBUZZ_ENV` prod vs test | LIVE: no Demo Payment / Razorpay on home. Checkout UI behind auth. **No real charge** | BLOCKED — live charge intentionally not executed | Homepage `hasDemo:false`; checkout auth wall |
| 4.2 | Member credits 50% / `sprr_balance` | PARTIAL | `maxRedeemableCredits`; checkout cap | CODE VERIFIED + tests | LIVE FAIL: slider value `500` hardcoded/readonly. Live redemption not authenticated | PARTIAL | waffle `credits:"500"` |
| 4.3 | Nectar migrate + policy | PARTIAL / BLOCKED | Privacy copy cleaned locally. No dump | Policy CODE VERIFIED. Migration not executed | LIVE FAIL: §3 NECTAR Ecosystem. Balances unverified | Policy PARTIAL. Data **BLOCKED — production balance dump/access unavailable** | privacy heading e36 |
| 5.1 | Bottom nav overlap | PARTIAL | Prior padding + **new** sticky `.pdp__actions` | CODE VERIFIED (sticky after build) | LIVE FAIL: Add to Bag overlaps dock (`addVsDock:true`, add 812–850 vs dock 788–838). Buy Now just below dock. Try-on below fold (no overlap at that scroll). Login Sign in 425 vs dock 788 — no overlap. Footer vs dock overlap when footer fills viewport | PARTIAL | waffle 390×844 CDP; home y=3938 `dockVsFooter:true` |
| 5.2 | Theme vs logo | PARTIAL | Header z-index CSS | CODE VERIFIED | LIVE: home logo 56–84 vs toggle ~243 (pass 1). FAQ click did not set `.theme-dark` (possible stale ref). Toggle **present** on FAQ/privacy/shipping/login | PARTIAL | home + FAQ 390×844 |
| 5.3 | Navbar glass | PARTIAL | existing CSS | CODE VERIFIED | LIVE not newly screenshot-scored | PARTIAL | prior pass |
| 5.4 | Icon contrast | PARTIAL | existing | CODE VERIFIED | LIVE not WCAG-scored this pass | PARTIAL | — |
| 5.5 | Mobile spacing | PARTIAL | dock padding | CODE VERIFIED | LIVE: dock y 788–838 of 844; overlays Latest Drop as sticky chrome | PARTIAL | home 390×844 |
| 5.6 | Footer 5-col + phone + email | PARTIAL | `footer__grid--5`; `SOCIAL_LINKS` | CODE VERIFIED `orders@playR.in`, `+91 95993 70409` | LIVE FAIL structure: 3 h4s Connect / Order Support / We are playR. Email live. Phone **missing on homepage footer**; present on FAQ/privacy/shipping | PARTIAL | home footerLinks; FAQ e19 |
| 5.7 | Best Sellers 15d / exactly 3 / 1×3 | PARTIAL | `getBestSellers` + `BestSellersRow` + CMS only if best-seller slug | CODE VERIFIED; CMS carousels not hijacked | LIVE FAIL: no Best Sellers 15-day row; `/api/storefront/best-sellers` **404**. Home CMS shelves are Latest Drop / tanks / tees — not the new row | PARTIAL | API 404; home headings |
| 6.1 | Discover More | PASS live previously | unchanged | CODE VERIFIED | Not re-hit this pass; prior 12 SKUs | PASS | Pass 1 |
| 6.2 | Recently Visited arrows | PASS live previously | unchanged | CODE VERIFIED | Not re-hit this pass | PASS | Pass 1 |
| 6.3 | Wishlist | PASS live previously | unchanged | CODE VERIFIED | LIVE: “Sign in to save and sync your wishlist.” No Coming Soon | PASS | `/wishlist` 390 tab |
| 6.4 | Search waffle | PASS live previously | search helper | CODE VERIFIED | Not re-run this pass | PASS | Pass 1 |
| 6.5 | Scroll / video overlay | FAIL | LazyVideo keep-observe; CollectionHero **one** src via `matchMedia`; NinjaStar `scrollY` fallback; intro overlay `.exit { visibility:hidden }`; hero overlay boxed | CODE VERIFIED | LIVE: homepage **0 videos**. Collections **both** MP4s play (`collection-mobile.mp4` visible 238px; desktop `display:none` but `paused:false`). Overlay height **equals** hero (238 mobile / 718.5 desktop earlier) — no measured gap. Inverted page scroll **not reproduced** (`html`/`body` transform `none`, `scrollY` 3938). Videos `loop` so `ended` never true | FAIL live / code patched. **Not converted to PASS** | collections 390 CDP; home transform probe |
| 6.6 | playR.in routing | PASS (no bounce) | `proxy.ts` comment only | CODE VERIFIED (no rewrite onto streetplayr.com) | LIVE: `https://playr.in/` = Shopify IPL store, title “Buy Official IPL Jerseys…”. Does **not** route to `streetplayr.com/home` | PASS (no unintended redirect). StreetplayR itself remains streetplayr.com | playR.in snapshot |
| 7.1 | Meta Pixel `1509391096798985` | PARTIAL | `lib/analytics/tags.ts` + layout `fbq` | CODE VERIFIED | LIVE FAIL: homepage HTML `pixel:false` `fbq:false` | PARTIAL | Invoke-WebRequest `/home` |
| 7.2 | GA4 `G-H6YTBN6B8C` | PARTIAL | gtag in layout | CODE VERIFIED | LIVE FAIL: `ga4:false`. GTM `GTM-5ZZQ7XJ2` and Ads `AW-18205202945` **are** present | PARTIAL | same HTML |
| 7.3 | GSC token | PARTIAL | `metadata.verification.google` | CODE VERIFIED | LIVE FAIL: token absent from HTML | PARTIAL | same HTML |
| 7.4 | Merchant feed | PARTIAL | `app/api/feeds/google-merchant/route.ts` XML + `https://streetplayr.com` links | CODE VERIFIED | LIVE FAIL: **404** | PARTIAL | HTTP 404 |
| 7.5 | Pinterest feed | PARTIAL | CSV route | CODE VERIFIED | LIVE FAIL: **404** | PARTIAL | HTTP 404 |

---

## Mobile Validation

Viewport: **390 × 844**, `Emulation.setDeviceMetricsOverride` `mobile:true` `deviceScaleFactor:2`. Chromium via Cursor browser.

| Route | Test | Expected | Actual | Result |
| ----- | ---- | -------- | ------ | ------ |
| `/home` | Navbar + logo vs theme | No overlap | Logo 56–84; theme previously ~243 | PASS (no overlap) |
| `/home` | Bottom dock | Visible, usable | Dock t=788 b=838 of 844 | PASS structure |
| `/home` | Dock vs Latest Drop | Prefer no cover | Dock overlays carousel (sticky chrome) | FAIL / expected sticky |
| `/home` | Videos | Play/pause in view | **0 `<video>` elements** | Cannot validate playback on home |
| `/home` | Scroll down / up | `scrollY` increases down; no invert | y=3938, html/body transform none | Invert **not reproduced** |
| `/home` | Footer phone/email | Both | Email yes; phone **no** | PARTIAL |
| `/home` | Footer vs dock | Footer readable | `dockVsFooter:true` when footer fills viewport | FAIL overlap |
| `/collections` | Chips | Topwear/Bottomwear | T-Shirts / Tanks / Sweatpants | FAIL vs spec (old deploy) |
| `/collections` | Video before/during/after | One source; overlay matches; pause out of view | Two sources both playing; overlay=hero 238px; loop so no after-ended | FAIL dual-play; overlay size OK |
| `/product/PS-TEE-CRT-WHT` | Sizes / 2XL / GSM / Limited / credits | XS–XL, no 2XL, 220, Limited, real balance | XS,XL,S,M,L,2XL; 350 GSM; no Limited; credits 500 | FAIL (old deploy) |
| `/product/PS-TEE-CRT-WHT` | Add to Bag / Buy Now vs dock | No overlap | `addVsDock:true`; Buy Now 858–896 (below dock) | FAIL Add to Bag |
| `/product/PS-TEE-CRT-WHT` | AI Try-On vs dock | No overlap | Try-on 908–1232 (below fold) | PASS at that scroll; untested when scrolled up |
| `/login` | Fields vs dock | No overlap | Email 277–323; Sign in 425–470 vs dock 788 | PASS |
| `/login?redirect=/checkout` | Phone OTP UI | Tab exists; no send | Phone number + Send code; **Send not clicked** | BLOCKED send |
| `/wishlist` | Guest state | Not Coming Soon | Sign in to save… | PASS |
| `/privacy-policy` | Nectar / theme / phone | No Nectar; toggle; phone | §3 NECTAR; phone +91; toggle in a11y tree | FAIL nectar |
| `/shipping-policy` | Loads + phone | Policy + phone | Headings + `+91 95993 70409` | PASS page load |
| `/faq` | Policy + theme toggle | Loads; toggle works | FAQ content + phone. One click did not add `theme-dark` | PARTIAL toggle proof |
| Order summary | Checkout | Authenticated summary | Never reached (login wall) | BLOCKED |

---

## Production Validation

| URL | Browser | Viewport | Test | Expected | Actual | Result |
| --- | ------- | -------- | ---- | -------- | ------ | ------ |
| `https://www.streetplayr.com/home` | Chromium | 390×844 + HTML fetch | Brand title | StreetplayR | Street PlayR \| Enter The Play | FAIL |
| `https://www.streetplayr.com/home` | Chromium | HTML | Pixel / GA4 / GSC | IDs in document | pixel/ga4/gsc **false**; GTM+Ads **true** | FAIL new tags; PASS legacy GTM/Ads |
| `https://www.streetplayr.com/manifest.webmanifest` | HTTP | n/a | STREET playR + PNG icon | STREET playR | Street PlayR / favicon.ico | FAIL |
| `https://www.streetplayr.com/api/feeds/google-merchant` | HTTP | n/a | 200 XML | XML catalog | **404** | FAIL |
| `https://www.streetplayr.com/api/feeds/pinterest` | HTTP | n/a | 200 CSV | CSV catalog | **404** | FAIL |
| `https://www.streetplayr.com/api/storefront/best-sellers` | HTTP | n/a | JSON 3 products | 200 | **404** | FAIL |
| `https://www.streetplayr.com/product/PS-TEE-CRT-WHT` | Chromium | 390×844 | PDP checklist | sorted sizes, 220, Limited, credits | unsorted+2XL, 350, no Limited, 500 | FAIL |
| `https://www.streetplayr.com/collections` | Chromium | 390×844 | Hero video | single LazyVideo | two MP4s both `paused:false` | FAIL |
| `https://www.streetplayr.com/privacy-policy` | Chromium | 390 + desktop | Nectar removed | gone | §3 NECTAR Ecosystem | FAIL |
| `https://www.streetplayr.com/login?redirect=%2Fcheckout` | Chromium | 390 | Auth + OTP UI | login, OTP tab | Email + Phone OTP + Send code | PASS UI; OTP BLOCKED |
| `https://playr.in/` | Chromium | default | Not streetplayr.com/home | own store | Shopify IPL storefront | PASS (no bounce) |

---

## 6.5 Scroll / video — investigation (do not mark PASS)

Root causes in **this repo** (fixed locally, not live):

1. Lookbook / lazy videos: `preload="none"` without reliable `play()`; IO disconnected after first intersect → pause/resume broken.
2. `CollectionHero` mounted **desktop + mobile** MP4s. Hidden `display:none` video still plays (live proof: desktop file `paused:false` at 390×844).
3. `NinjaStar` read `__scrollDampingY` from removed `ScrollDamping.tsx` → always 0. Fallback now `window.scrollY`.
4. Intro overlay `position:fixed; z-index:998` could remain during route exit; `.exit { visibility: hidden }` added.

Reproduction this pass:

- Routes: `/home`, `/collections` (desktop earlier + 390×844).
- Viewport: 390×844 and prior desktop collections (hero/overlay both 718.5).
- Result: invert **not seen**. Dual-video **seen on live collections**. Homepage has no videos so play/pause/ended **cannot** be proven there.
- After playback: live videos `loop:true` → `ended` stays false.

---

## Remaining Blockers

1. **Deploy** — dirty tree vs production 85962a8. Until then almost all “fixed” rows stay LIVE FAIL.
2. **Supabase Auth SMS provider** — Phone OTP UI exists; provider unset. ConvertWay/Interakt/Netcore not in code.
3. **Supabase Auth SMTP / playR Auth** — not configurable from the repo.
4. **Nectar balance dump** — `BLOCKED — production balance dump/access unavailable`.
5. **Easebuzz live charge** — `BLOCKED — live charge intentionally not executed`. Hash/webhook/env split verified in code only.
6. **Merchant Center / Pinterest dashboard approval** — feeds 404 live until deploy; dashboards not logged in.
7. **Official `.ico`** — PNG logo exists; **no `.ico`**. Do not call favicon fully PASS.
8. **Logged-in member** — dashboard, credit redemption, order summary, OTP success all unproven.
9. **playR.in DNS** — separate Shopify host. Not a StreetplayR app bug. Putting StreetplayR on that domain is hosting, not a code redirect.

---

## Deployment State

**CODE FIXED — NOT DEPLOYED.**

Production is still consistent with:

`85962a8990802423cc2c9de8524d7ac335de96b8`

Fixes exist only in the dirty working tree. They are **not live**.

---

## Final Verdict

### YELLOW

Repo + `tsc` + Vitest + production **build** are green. Mobile 390×844 was driven. Scroll/video was traced and patched in source; **live collections still dual-plays**, so 6.5 is **not** PASS. Production still serves the 9 Aug commit.

Not GREEN: production is old code; many LIVE FAILs; OTP/payment/Nectar dump remain BLOCKED; `.ico` never existed.

A live-only score of this production host would be **RED**. This verdict stays YELLOW because the remaining critical storefront gaps are **undeployed local fixes**, not missing implementations — except the genuine external BLOCKED items.

---

*End of report (Pass 1 retained above; Pass 2 is this section).*

