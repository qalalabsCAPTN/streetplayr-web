# E2E User Journey Audit Matrix (Launch Gate)

Status: DEFINED — not executed yet.
Run after Sprint 4 engine green, before Sprint 6 Payment Live.

Legend: PASS | FAIL | BLOCKED | SKIP | NOT RUN

---

## A. Guest commerce

| ID | Journey | NOT RUN |
|----|---------|---------|
| A01 | Guest browse home | |
| A02 | Guest search → PDP | |
| A03 | Guest PDP size select → add cart | |
| A04 | Guest cart persist refresh | |
| A05 | Guest cart → login gate at checkout | |
| A06 | Guest → login → cart merge | |
| A07 | Guest wishlist attempt → login bridge | |
| A08 | Guest collections filter → PDP | |
| A09 | Guest mobile bottom nav all tabs | |
| A10 | Guest back-button from PDP keeps cart | |

## B. Auth / session

| ID | Journey | NOT RUN |
|----|---------|---------|
| B01 | Email login → dashboard | |
| B02 | Google login → wishlist | |
| B03 | Logout → wishlist cleared from UI | |
| B04 | Re-login → wishlist persist | |
| B05 | Session expiry mid-checkout | |
| B06 | Two tabs same session | |
| B07 | Two tabs logout one tab | |
| B08 | Refresh during checkout | |
| B09 | Back button payment return | |
| B10 | Auth redirect deep link `/checkout` | |

## C. Cart / inventory / checkout (ENGINE — Sprint 4)

| ID | Journey | NOT RUN |
|----|---------|---------|
| C01 | Add cart → variant UUID only | |
| C02 | Oversell blocked at reserve | |
| C03 | Reserve timeout releases stock | |
| C04 | Checkout create order + reserve | |
| C05 | Payment gateway redirect | |
| C06 | Webhook signature valid → confirm | |
| C07 | Webhook signature invalid → reject | |
| C08 | Payment success → inventory commit | |
| C09 | Payment fail → inventory release | |
| C10 | Payment retry same order | |
| C11 | Demo path disabled in prod build | |
| C12 | Cart schema guest session_id | |
| C13 | Cart schema auth customer_id | |
| C14 | Login merge guest+auth cart | |
| C15 | Empty cart checkout blocked | |

## D. NECTAR / wallet

| ID | Journey | NOT RUN |
|----|---------|---------|
| D01 | Payment success → SPRR credit | |
| D02 | Payment success → XP | |
| D03 | Wallet ledger row matches balance | |
| D04 | Redeem at checkout | |
| D05 | Redeem insufficient balance blocked | |
| D06 | Referral claim → reward | |
| D07 | Welcome bonus once | |
| D08 | Wallet view matches DB | |
| D09 | Achievement unlock (if live) | |
| D10 | Notification after reward (if live) | |

## E. Admin / ops

| ID | Journey | NOT RUN |
|----|---------|---------|
| E01 | Viewer cannot mutate sites | |
| E02 | Ops admin grant/revoke site access | |
| E03 | Super admin settings write | |
| E04 | No browser Supabase on /admin settings | |
| E05 | Product edit → storefront reflect | |
| E06 | Inventory adjust → checkout stock | |
| E07 | Order fulfill | |
| E08 | Refund path | |
| E09 | Campaign create RBAC | |
| E10 | CMS publish SSR action only | |

## F. Devices / network

| ID | Journey | NOT RUN |
|----|---------|---------|
| F01 | Mobile Safari iOS browse→checkout | |
| F02 | Mobile Chrome Android | |
| F03 | Desktop Edge | |
| F04 | Desktop Chrome | |
| F05 | Slow 3G checkout | |
| F06 | Offline toast / fail soft | |
| F07 | Viewport 375 | |
| F08 | Viewport 768 | |
| F09 | Viewport 1440 | |
| F10 | Dark mode checkout | |

## G. Edge chaos

| ID | Journey | NOT RUN |
|----|---------|---------|
| G01 | Double-click pay | |
| G02 | Browser back mid-gateway | |
| G03 | Webhook replay idempotent | |
| G04 | Cron release expired reservations | |
| G05 | Concurrent two users last unit | |
| G06 | Stale cart variant deleted | |
| G07 | Price change mid-cart | |
| G08 | Coupon invalid | |
| G09 | Address validation fail | |
| G10 | Email fail does not block order confirm | |

## H. Expand to 100+

Duplicate A–G across:
- Short sleeve / long sleeve / tanks / sweatpants PDP
- Empty search / no results
- Sold out size
- Multi-line cart (3+ SKUs)
- International vs INR (if applicable)
- Ops roles: viewer / support / fulfillment / editorial / ops_admin / super_admin

Target: **≥100** executable rows before launch signoff.

---

## Execution rule

Journey PASS only when:
1. Manual or automated run recorded
2. Desktop OR mobile noted
3. No console error
4. DB side-effect verified where engine step
