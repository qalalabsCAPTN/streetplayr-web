# Access Matrix — Phase 3.2 / 3.3 / 3.4 (verified live)

Linked project tested with `scripts/access_matrix_pentest_v2.sql`.
Deny assertions require SQLSTATE `42501` or RLS error text (not schema errors).

## Role matrix

| Role | Verified |
|------|----------|
| **Anonymous** | Catalog SELECT OK. Profiles/orders/wallet SELECT empty. NECTAR writes RLS-denied. |
| **Authenticated** | Own profile SELECT; other profiles empty. Role escalate + `sprr_balance` mint blocked by trigger. Wallet ledger INSERT RLS-denied; own SELECT OK. Orders INSERT RLS-denied (after `100001`). Addresses own policies present (app uses admin). |
| **Ops** | Orders SELECT via ops policy. Wallet/reward_rules client writes denied (server actions / service role). |
| **Service / privileged** | Wallet tx + reward_redemptions INSERT OK. `wallet_accounts` INSERT OK (`wallet_type` in `points\|credits\|xp`). |

## NECTAR tables

| Table | Client write | Client read | Notes |
|-------|--------------|-------------|-------|
| `wallet_accounts` | service_role only | none | Internal; app uses `profiles.sprr_balance` |
| `nectar_wallet_transactions` | service_role only | none | Unused by app TS |
| `reward_rules` | service_role only | none | Unused by app TS |
| `reward_executions` | service_role only | none | Unused by app TS |
| `reward_redemptions` | no INSERT policy | own SELECT | Redeem via `/api/nectar/redeem` + admin |
| `wallet_transactions` | no INSERT policy | own SELECT | Engine/ops use admin |

## Migrations applied for matrix

- `100001_access_matrix_orders_lock.sql` — drop user INSERT/UPDATE on `orders`
- `100002_restore_cart_wishlist_rls.sql` — wishlist own-row; cart own-row only if `user_id` exists

## Regression notes

| Flow | Status |
|------|--------|
| Google login / profile trigger | OK (Auth + DEFINER trigger) |
| Address CRUD | OK (admin after auth) |
| Checkout demo | OK (admin) |
| Wallet / reward read+redeem | OK (admin for writes) |
| Order history UI | OK (admin) |
| Ops dashboard core | OK (admin actions) |
| Wishlist sync | OK after `100002` (own-row RLS) |
| Cart DB sync | **SCHEMA DRIFT** — live `cart_items` is CRM (`cart_id`/`variant_id`); `CartService` expects `user_id`/`product_id`. Local cart still works; DB sync no-ops/fails until schema alignment. Not caused by RLS deny alone. |
| Admin ops2 anon pages | RISK — some pages use browser anon client; prefer server/admin |

## Advisor

- Security errors: **0**
- Remaining security WARN: Auth leaked-password protection (dashboard toggle)
- Perf WARNs (`auth_rls_initplan`, `multiple_permissive_policies`): deferred cleanup, not access-matrix blockers

## Re-run

```bash
npx supabase db query --linked -f scripts/access_matrix_pentest_v2.sql
```
