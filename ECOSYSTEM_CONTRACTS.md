# Ecosystem Contracts — Phase 0 Audit

> Analysis only. No code modified in either repo. Covers StreetPlayR (`C:\Users\pc\Desktop\streetplayr - open code`) and NECTAR 2.0 (`C:\Users\pc\Desktop\Streetplayr with nectar\Nectar 2.0`). Airbone not revisited here (see `AIRBONE_ADMIN_REFERENCE_AUDIT.md`).

## 0. Headline finding — read this first

**StreetPlayR and the NECTAR 2.0 monorepo are two independent, disconnected systems today.** StreetPlayR has its own self-contained loyalty subsystem (wallet/XP/tiers/referrals, its own Supabase project, `app/admin` "OpsOS") that was **built by re-implementing NECTAR 2.0's patterns**, not by integrating with it — confirmed by code comments in StreetPlayR (`lib/orchestration/reservation.ts`, `/api/nectar/redeem`) explicitly citing "adapted from NECTAR 2.0 LedgerRepository pattern." There is zero live bridge: no shared identity ID column, no NECTAR API URL env var anywhere in StreetPlayR, no webhook receiver for NECTAR events, and NECTAR 2.0 has no knowledge of StreetPlayR beyond a seeded `platforms` row (`id='streetplayr'`).

Both systems also each have their own **unresolved internal bugs** that must be fixed before either can be trusted as "source of truth" — see §9 Known Defects. The Unified Admin plan (per the user's Phase 1-12 brief) intends to build on `app/admin` as the foundation and treat NECTAR as the loyalty source of truth reached via API — that requires **building the bridge from scratch**, and fixing NECTAR's ledger-table-name bug first (§9.1) or every reward/referral/wallet write NECTAR issues will silently fail against a real DB.

---

## 1. Identity Contract

**NECTAR 2.0** (`infrastructure/supabase/migrations/0001_initial_schema.sql`):
- `identity_users` — `id UUID PK, email UNIQUE, email_verified, status ('active'|'suspended'|'flagged'|'closed'), created_at, updated_at`.
- `identity_profiles` (1:1, PK=FK) — `user_id, display_name, avatar_url, tier ('seed'|'sprout'|'bloom'|'nectar'|'apex'), reputation_score, lifetime_xp, season_xp, connected_platforms JSONB` — array of `{platform, externalId, connectedAt, metadata}`, populated by `IdentityService.connectPlatform()`.
- No separate identity-mapping table — cross-platform linkage lives inside `connected_platforms[]`.
- `docs/integrations/streetplayr.md` documents an *intended* `streetplayr_user_id ↔ nectar_user_id` mapping, but **no route implements it** (`apps/api/src/app/api/identity/route.ts` re-exports a file that doesn't exist on disk — unbuildable).

**StreetPlayR** (`supabase/migrations/00001…00019`):
- `profiles` (PK = `auth.users.id`) — Supabase-auth-native, columns include `email, username, full_name, referral_code, sprr_balance, role, xp, lifetime_xp, current_streak_days, tier (TEXT, default 'STREET' — see §9.5), referred_by (free text)`.
- Privileged columns (`role, sprr_balance, xp, welcome_bonus_granted`) are locked by a `BEFORE UPDATE` trigger — writable only via service-role.
- `handle_new_user()` trigger always assigns `role='member'` server-side on signup; never trusts client metadata.
- **No external/ecosystem identity column exists on `profiles`** — no `nectar_user_id`, no `external_id`.
- `packages/types/src/identity.ts::PlatformConnection` mirrors NECTAR's shape but is unused — no table, no reader/writer.

**Contract to build (Phase 1+, not yet implemented):**
```
identity_link {
  streetplayr_user_id: UUID   -- profiles.id
  nectar_user_id: UUID        -- identity_users.id
  platform: 'streetplayr'
  linked_at: timestamptz
}
```
Decide and document **one direction of truth** for tier/XP: NECTAR's `identity_profiles.tier` (5-value `seed→apex`) vs. StreetPlayR's `profiles.tier` (currently a broken `'STREET'` default, but `site_configs.tier_multipliers` already expects the NECTAR 5-value set) — these should converge on the NECTAR tier model, since StreetPlayR's own `TIERS` constant already imports it (`packages/types/src/identity.ts`, identical in both repos).

---

## 2. Event Contract

**NECTAR 2.0** — `events` table (`0001`, hardened `0006`): `id UUID PK (caller-supplied, used as-is), event_type TEXT (free-form "domain.action", TS-enforced not DB-enforced), timestamp, actor_user_id FK, platform TEXT, platform_trace_id, payload JSONB, metadata JSONB, status ('received'|'queued'|'processing'|'processed'|'failed'|'dead_lettered'), processing_attempts, processed_at, error_message, version, correlation_id, replay_of_event_id`.
- Ingestion: `POST /v1/events` (headers `X-Nectar-Platform`, `X-Nectar-Token` matched against `platforms.signing_secret` directly — `platform_tokens` table exists but is **dead code**, unused by the actual auth middleware), optional `X-Nectar-Signature` HMAC-SHA256.
- Validated envelope requires `eventId, eventType, timestamp (≤5min future), actorUserId, platform, payload`.
- Dedup: pre-check `events.id = eventId` (PK-based, not a dedicated idempotency column).
- Enqueued to BullMQ queue **`nectar-event-processing`**, job `process-event`, `jobId=eventId`; consumed by `apps/workers` → `RewardEngine.processEvent()`.
- Only the `events` route is confirmed built (`.next` build output has no `wallet`/`identity` route artifacts).

**StreetPlayR** — two unrelated event systems:
1. `operational_events` (real, defined) — orchestration/audit timeline: `domain, severity, action, actor_id, resource_type, resource_id, message, metadata, brand_id, created_at`. INSERT restricted to `service_role`. Written via `recordEvent()` in `lib/orchestration/events.ts` on reservation/order/payment transitions. **This is StreetPlayR's internal audit trail, not an ecosystem event bus — it does not feed NECTAR.**
2. `events` (legacy, undefined-in-migrations — assumed pre-existing on live DB) — read by `admin/nectar/events` → `EventStreamMonitor`, shape unknown from this repo.

**Contract to build:** StreetPlayR must emit a `purchase.completed` (and eventually `purchase.refunded`, `referral.*`, etc.) event to NECTAR's `POST /v1/events` on checkout completion, authenticated with a StreetPlayR-specific `signing_secret` (already seeded as a placeholder in NECTAR's `platforms` table — needs a real secret issued and stored in StreetPlayR's env, never client-side). Event `payload` shape must satisfy NECTAR's `reward_rules.conditions` dot-path lookups (e.g. `payload.orderTotal`, `payload.isFirstOrder`) — this payload contract needs explicit field-by-field agreement, not yet documented anywhere in either repo.

---

## 3. Wallet Contract

**NECTAR 2.0**:
- `wallet_accounts` (`user_id, wallet_type ('points'|'credits'|'xp')`, unique per user+type).
- `wallet_transactions` — **append-only, immutable via trigger**: `wallet_id, user_id, type ('credit'|'debit'|'hold'|'release'|'expire'), status ('pending'|'confirmed'|'rejected'|'expired'), source, amount BIGINT >0, balance_after, idempotency_key UNIQUE, reference_id, reference_type, description, metadata`.
- `wallet_balances` — a **computed VIEW** summing confirmed `wallet_transactions`, not a table.
- ⚠ **Critical bug**: `packages/ledger/src/repositories/ledger-repository.ts` queries `nectar_wallet_transactions` — a table that **does not exist in any migration**. Every other consumer (ecosystem-ops routes, docs) correctly uses `wallet_transactions`. This breaks reward grants, referral bonuses, and manual ops adjustments end-to-end against a real DB. **Must be fixed before Phase 3.**

**StreetPlayR**:
- `profiles.sprr_balance` — current-balance cache, privileged-write-locked.
- `wallet_transactions` — redefined 3 times across migrations with **inconsistent shapes** (`delta INTEGER` vs `amount NUMERIC`, `site_id TEXT` vs `UUID`) — because all three used `CREATE TABLE IF NOT EXISTS`, only whichever applied first to a given DB instance is authoritative. Live/application-authoritative shape (per `/api/nectar/redeem` insert): `user_id, type TEXT, delta INTEGER, source, description?, site_id?, created_at`.
- `wallet_events` — separate, fully dormant table, unused by any app code.
- `manual_wallet_adjustments` — ops-audit trail for manual credits/debits.
- Redeem flow (`/api/nectar/redeem`) updates `profiles.sprr_balance` then inserts a ledger row **non-atomically** (two separate calls with manual rollback-on-failure) — unlike NECTAR's proper DB-constraint-backed idempotency, or StreetPlayR's own atomic `initiate_checkout` RPC used for orders. Worth hardening to match the RPC pattern.

**Contract for the Admin (binding rule, per the user's brief):** Wallet balances/transactions **must never be written directly by the Admin UI or browser code**. All wallet mutations go through NECTAR's ledger service (once the `nectar_wallet_transactions`→`wallet_transactions` bug is fixed) or StreetPlayR's own admin-client-gated server actions — never raw table writes from a client component.

---

## 4. Reward Contract

**NECTAR 2.0** — real rule engine exists:
- `reward_rules`: `name, status ('active'|'inactive'|'draft'|'archived'), type ('points'|'xp'|'multiplier'|'badge'|'drop'), triggers TEXT[] (event types), base_amount, conditions JSONB, max_usage_per_user, cooldown_seconds, eligible_tiers, campaign_id, starts_at/ends_at`.
- `reward_executions` (append-only): `rule_id, user_id, event_id, status ('pending'|'success'|'failed'|'skipped'), points_granted, xp_granted, multiplier_applied, validation_results, transaction_id, idempotency_key UNIQUE`.
- `RewardEngine.processEvent()`: match active rules by trigger + date window → evaluate `conditions` (dot-path into event envelope) → run 7-stage validation pipeline (`identity→blacklist→rate_limit→usage→cooldown→tier→fraud`) → apply tier multiplier from `identity_profiles.tier` → grant points via ledger append (subject to §3's bug) and/or XP via `increment_user_xp` RPC.
- Seeded "Purchase Reward" rule: `triggers:['purchase.completed'], base_amount:100` — this is the literal row behind the documented "+100 points" flow, but **no automated test or verification artifact exists anywhere in the repo** confirming it actually works end-to-end (repo-wide search for `*.test.ts`/`*.spec.ts` returns zero results outside `node_modules`).

**StreetPlayR** — no rule engine locally; reward-adjacent tables are simpler:
- `bonus_campaigns` (name, sprr_reward, xp_reward, starts_at/ends_at, is_active) — functions as both "campaign" and "reward" in StreetPlayR's UI.
- `reward_redemptions` (user_id, description, sprr_cost, status, redeemed_at, fulfilled_at) — the redemption **fulfillment** loop, server-only writes.
- `100000_security_performance_advisor.sql` references `reward_rules`/`reward_executions` as tables that "may exist" on the live production DB (guarded `IF EXISTS`) but **no `CREATE TABLE` for them exists in this repo's migrations** — meaning StreetPlayR's schema does not currently define NECTAR's rule-engine tables locally, consistent with the "rule engine lives in NECTAR" design intent.

**Contract:** Reward *rule authoring and execution* is exclusively NECTAR's responsibility (`reward_rules`/`reward_executions`/`RewardEngine`). StreetPlayR's `bonus_campaigns`/`reward_redemptions` remain StreetPlayR-local concepts (storefront-facing "spend your points" catalog + fulfillment), distinct from NECTAR's earn-side rule engine — **do not merge these two into one table**; the Admin's Rewards section must clearly separate "NECTAR reward rules" (read/adjust via NECTAR API) from "StreetPlayR redemption catalog" (local CRUD).

---

## 5. Referral Contract

**NECTAR 2.0**: `referral_codes` (code PK, user_id, is_active, use_count, max_uses, expires_at), `referrals` (referrer_id, referred_user_id, referral_code FK, status incl. `'fraud'`, referrer/referred points granted, attributed_order_id/value, converted_at), `referral_edges` (adjacency graph, depth). `ReferralService.generateCode()`/`attributeSignup()`/`convertReferral()` — hardcoded bonuses (referrer 250, referred 100). ⚠ **Bug**: `attributeSignup()` calls `db.rpc('increment_referral_code_use')`, a function **never defined in any migration** — will fail against a real DB. No ecosystem-ops UI route for referrals exists (page reads local component state only).

**StreetPlayR**: `profiles.referral_code` (own shareable code) + `referred_by` (free-text, not FK). `referral_claims` (referrer_id, referred_id UNIQUE, bonus_sprr, bonus_xp, status, claimed_at). `referral_edges` (same adjacency-graph shape as NECTAR — confirms the "adapted from NECTAR 2.0" comment). `GET /api/nectar/referrals` reads local `referral_claims`.

**Contract:** Same structural pattern in both (codes + claims/referrals + edges graph) but StreetPlayR's is a local reimplementation, not calling NECTAR. Long-term the referral graph should live in NECTAR (ecosystem-wide, cross-site referrals are the whole point of a shared loyalty layer) with StreetPlayR's `referral_claims` becoming a read-through cache or being retired in favor of a NECTAR API call. **Do not build a third referral system in the Unified Admin** — pick one source of truth (recommend NECTAR, once its RPC bug is fixed) and have StreetPlayR read through it.

---

## 6. Campaign Contract

**NECTAR 2.0** — two disconnected schemas, a real internal inconsistency to resolve before Admin work, not to inherit blindly:
- Legacy `campaigns` (name, status, global_multiplier, starts_at/ends_at) — the only one actually wired: `reward_rules.campaign_id` FKs here.
- `campaigns_v2` (richer: tagline, type incl. `'flash_sale'`, priority, platforms[], boosts JSONB, leaderboard_config, budget/points_awarded tracking) + `campaign_participants` — **modeled but not wired to any service or API route**; ecosystem-ops campaigns UI reads local component state, not either table.

**StreetPlayR** — `bonus_campaigns` only (see §4), the functional equivalent of NECTAR's legacy `campaigns` but merged with reward-grant fields.

**Contract:** Before the Admin's Campaigns module is built, NECTAR needs to pick **one** campaign schema (`campaigns_v2` is the better-designed one — multi-platform aware, which matters for the 4-site rollout) and either migrate `reward_rules.campaign_id` to point at it or retire it. This is a NECTAR-side decision, flagged here as a **blocker to resolve in Phase 7 (NECTAR API hardening)**, not something the Admin should route around.

---

## 7. Tier Contract

Identical constant, duplicated in both repos' `packages/types/src/identity.ts` (same file, same values — confirms shared lineage):
```ts
seed:   xpThreshold 0,     multiplier 1.0
sprout: xpThreshold 500,   multiplier 1.1
bloom:  xpThreshold 2000,  multiplier 1.25
nectar: xpThreshold 7500,  multiplier 1.5
apex:   xpThreshold 25000, multiplier 2.0
```
- NECTAR: mirrored a second time inside the `increment_user_xp()` SQL function's hardcoded `CASE` — **two places to keep in sync, real drift risk**, no shared source of truth at the DB layer.
- StreetPlayR: `profiles.tier` defaults to `'STREET'` (not a member of the `TierId` set at all) while `site_configs.tier_multipliers` JSONB correctly uses the 5-tier lowercase keys — an **unresolved artifact from an earlier tier scheme**, must be fixed (§9.5) before the Admin's tier displays are trustworthy.
- Tier is **not user-settable** in NECTAR — assigned solely by `increment_user_xp()` based on `lifetime_xp`, monotonic (no demotion path).

**Contract:** Treat `TIERS` (the TS constant) as the canonical ecosystem-wide tier definition. NECTAR's DB `CASE` mirror should ideally read from a real `tiers` table instead of a hardcoded function body (flag for Phase 7), and StreetPlayR's `profiles.tier` default must be corrected to `'seed'` before any Admin tier UI reads it.

---

## 8. Site Contract

**NECTAR 2.0** — `platforms` (id TEXT PK e.g. `'streetplayr'`, `name, is_active, webhook_url, signing_secret, allowed_event_types[]`), seeded: `streetplayr, playr-game, playr-club, nectar-internal`. Platform auth = header token matched directly against `signing_secret` (not the separate, unused `platform_tokens` table). Ecosystem-ops has its **own** parallel `PlatformId` union (`'all'|'streetplayr'|'playr'|'playr-club'|'playr-game'`) — note **`'playr'` here vs `'playr-game'` in the DB seed — a real enum mismatch** to resolve before Phase 6.

**StreetPlayR** — `sites` (id UUID, slug, name, domain, color, is_active) + `site_configs` (1:1: earn_rate, redeem_rate, min/max redeem, tier_multipliers JSONB, branding, allow_cross_site_redeem) + `site_access` (grants, `site_id+user_id` composite PK). **Only `streetplayr` is seeded** — `playr`, `playr-club`, `playr-game` exist only as hardcoded UI placeholders in `platform-store.ts`'s static `PLATFORMS` array, with no corresponding `sites` rows.

**Contract:** Reconcile platform-id slugs across all three places (`NECTAR platforms.id`, `StreetPlayR sites.slug`, `ecosystem-ops PlatformId` union) to one canonical set before onboarding playR/LetsPlay/PlayRClub — recommend: `streetplayr | playr | letsplay | playrclub` (drop the inconsistent `-game`/`-club` suffixing). Every future site needs a row in **both** NECTAR's `platforms` and StreetPlayR's `sites` (or the Unified Admin's own site registry, if that becomes the new canonical source — a Phase 6 decision, not yet made).

---

## 9. Admin Contract

**StreetPlayR `app/admin`** (the Phase 1 foundation per the user's brief) — real, working RBAC:
- Roles: `super_admin | ops_admin | fulfillment | editorial | support | viewer | member` (DB-backed `user_role` enum).
- `Permission` union (22 values) + `ROLE_PERMISSIONS` map in `lib/auth/permissions.ts`, enforced **both** server-side (`requireOpsApi()`, `requireSSRRole()`) **and** at the route-group layout level (`AuthGateway.handleRequest()`).
- Privileged-column trigger prevents client-side role/balance tampering even if RLS were misconfigured — a genuinely strong pattern.
- ⚠ **Enum drift**: `00010_multi_site.sql`'s RLS policies reference role strings (`'growth','finance','campaign_manager'`) that are **not part of the actual `user_role` Postgres enum** — those grants are unreachable dead code. Separately, a second, non-DB-backed `OpsUserRole` type exists in `types/ops2/ops.ts` (`super_admin|ops_admin|support|growth|finance|campaign_manager`) — a **UI-prototype role model that doesn't match the real RBAC**, source of the drift above.

**NECTAR `apps/ecosystem-ops`** — weaker:
- `OpsUserRole` + `Permission` + `ROLE_PERMISSIONS` (17 values) defined in types and mirrored by a DB `ops_users.role CHECK` — but **RBAC is not enforced anywhere server-side**, only used to render the `/settings/access` permissions-matrix display page. No middleware/guard references `ROLE_PERMISSIONS` for actual access control.
- Only 5 of ~25 admin routes have real backing API routes (`overview/kpis`, `nectar/events`, `nectar/rewards`, `nectar/wallets`, `customers`) — everything else (`liveops, analytics, orders, inventory, commerce, campaigns, progression, referrals, drops, tiers*, achievements, observability, simulation, segments, risk, settings`) renders from local component state or `@/lib/demo/*` fixtures, not the database. (*`tiers` reads the real static `TIERS` constant directly, not via API.)

**Contract (binding, per the user's architectural rule):** Use StreetPlayR's `lib/auth` RBAC as-is — it's the more complete, server-enforced implementation. Do **not** import NECTAR's `OpsUserRole`/`ROLE_PERMISSIONS` model wholesale; instead, map NECTAR's ecosystem-ops permission *concepts* (`wallets:manual_credit`, `rewards:test_execute`, `access:manage`, etc.) onto new `Permission` union members added to StreetPlayR's existing `lib/auth/permissions.ts`, so there remains exactly one enforced permission system. Fix the `user_role` enum drift (§9 above) before adding new roles.

---

## 9.1–9.x Known defects to resolve before/alongside implementation (do not build on these silently)

1. **`packages/ledger/src/repositories/ledger-repository.ts`** (NECTAR) queries `nectar_wallet_transactions` — table doesn't exist; real table is `wallet_transactions`. Breaks every reward grant, referral bonus, and ops manual adjustment. **Blocks Phase 3/8 entirely until fixed.**
2. **`packages/referrals/.../referral-service.ts`** (NECTAR) calls undefined RPC `increment_referral_code_use`. Blocks referral conversion.
3. **`apps/api/src/app/api/identity/route.ts`** (NECTAR) re-exports a non-existent file — unbuildable. Wallet-read route (`/v1/wallet`) also unconfirmed-built (only `events` route appears in `.next` build output).
4. **Two disconnected campaign schemas** in NECTAR (`campaigns` vs `campaigns_v2`) — pick one (Phase 7 decision, see §6).
5. **RBAC defined-but-unenforced** in `apps/ecosystem-ops` — cosmetic only.
6. **`platform_tokens` table dead** in NECTAR — actual auth bypasses it, compares raw header against `platforms.signing_secret`.
7. **StreetPlayR `wallet_transactions` schema drift** — three conflicting `CREATE TABLE IF NOT EXISTS` definitions across migrations; only the first-applied wins per DB instance. Needs a real reconciling migration, not another `IF NOT EXISTS` patch.
8. **StreetPlayR `profiles.tier` default `'STREET'`** doesn't match the `TIERS` constant's 5-value set (`seed→apex`) that `site_configs.tier_multipliers` already assumes.
9. **StreetPlayR `PlatformId` enum mismatch** (`'playr'` vs NECTAR's `'playr-game'`) — reconcile before Phase 6.
10. **No automated tests anywhere in NECTAR** proving the "purchase.completed → +100 points" pipeline works — the seed data and docs describe it, but per defect #1 it would currently **fail** at the ledger-write step against a real (non-mock) database. Treat the "verified pipeline" language in the original brief as **aspirational, not currently true** — Phase 8's Golden Path must re-verify this from scratch after defect #1 is fixed.

---

## 10. Existing routes reference (for Phase 1 planning — no new discovery, consolidated from raw audits)

**StreetPlayR `app/admin/**`** (23 routes) — already includes `overview, analytics, commerce, customers[/id], inventory, liveops, nectar/{achievements,campaigns,drops,events,progression,redemptions,referrals,rewards,tiers,wallets}, observability, orders, pages, products, referrals, rewards, risk, segments, settings[/access], simulation, users, wallet`. All confirmed **100% local-Supabase-backed, zero external NECTAR API calls anywhere in the repo** — this is the integration StreetPlayR needs to build, not something it already half-has.

**NECTAR `apps/ecosystem-ops/**`** (~25 routes, only 5 with real API backing — see §9) plus **`apps/api`** (the actual platform-facing service): `POST /v1/events` (real, built), `GET /v1/wallet` (defined, build-unconfirmed), `GET /v1/identity` (broken/unbuildable).

Full route-by-route and schema-by-schema detail lives in the two source agent reports this document was synthesized from; ask for the raw dumps if a specific column/route needs re-verification beyond what's summarized above.

---

*Per the user's brief: do not implement UI until this contract audit is reviewed. Next: Phase 1 (Unified Admin foundation on `app/admin`) should not start against NECTAR integration points until defects #1–#3 above are fixed on the NECTAR side, since Phase 3/8 depend on a working ledger write path.*
