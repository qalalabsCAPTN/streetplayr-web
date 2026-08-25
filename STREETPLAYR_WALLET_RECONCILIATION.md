# StreetPlayR Wallet Reconciliation

> Phase 5 deliverable. Determines the actual live `wallet_transactions` schema (not the migration files — they disagree with reality and each other), and defines the ownership model going forward.

> ⚠ **CORRECTION (superseded by `FOUNDATION_MIGRATION_REVIEW.md` in the NECTAR repo):** everything below was written on the incorrect assumption that `nectar_wallet_transactions` did not exist live. A later direct-probe check (as opposed to the discovery-listing check used here) found that it **does** exist, already in NECTAR's original full ledger shape, already working, with a real `reward_executions.transaction_id` FK pointing at it. `wallet_transactions` (this document's subject) and `nectar_wallet_transactions` are two separate, already-correctly-separate tables — **no reconciliation was actually needed**, and the "one table, additively extended" model below was never applied (the code was reverted). This document is kept for the historical record of how the live `wallet_transactions` schema itself was determined (that part is still accurate); its ownership-model conclusion is superseded. Read `FOUNDATION_MIGRATION_REVIEW.md` §"Correction" for the full, corrected picture.

## What's actually live (verified via PostgREST schema introspection + full row dump, 2026-08-18 — no mocks, real production project)

`wallet_transactions` currently has exactly these columns:
```
id, user_id, type, delta, source, description, site_id, created_at
```
This is StreetPlayR's `00014_schema_delta.sql`-style definition. NECTAR's `0001_initial_schema.sql` definition (`wallet_id, status, amount, balance_after, idempotency_key, reference_id, reference_type, metadata`) was **never applied** to this table on the live project — confirmed by the same introspection.

**All 12 rows currently in the table are StreetPlayR `welcome_bonus` credits** (`type:'earned', delta:50`, one per new signup). Zero NECTAR-originated rows exist — because, until the fix in this phase, `LedgerRepository` was writing to a table name (`nectar_wallet_transactions`) that doesn't exist at all, so every NECTAR ledger write has been silently failing since... likely since that code was written; see `NECTAR_FOUNDATION_REPAIR_REPORT.md` for the forensic evidence that a "verified +100 points" record in `reward_executions` is fabricated data, not a real successful write.

`wallet_accounts` (12 seed-time rows, matches NECTAR's design) and `wallet_balances` (a real Postgres VIEW, correctly shaped: `wallet_id, user_id, wallet_type, available, held, total, computed_at`) **are** live and NECTAR-shaped — only the underlying transactions table drifted to StreetPlayR's shape. This session could not introspect the view's SQL definition (no DDL-capable credential — see `NECTAR_FOUNDATION_REPAIR_REPORT.md`), and one live discrepancy was found empirically: a wallet showing `available: 100` has only one real underlying transaction (`delta: 50`) — meaning the view's true formula, and/or a piece of test data behind it, is not fully understood and needs a DB-owner with SQL console access to inspect (`\d+ wallet_balances` or `pg_get_viewdef`). Flagged as an open item below, not resolved here.

## Ownership model (target, per the brief's instruction: NECTAR = source of truth, StreetPlayR fields = compat read model)

**One table, `wallet_transactions`, additively extended — not two tables, not a migration of existing rows.**

| Concern | Decision |
|---|---|
| Which table is canonical | `wallet_transactions` (the one that already exists and already has 12 real rows — StreetPlayR's own wallet history is not thrown away or migrated elsewhere). |
| Legacy StreetPlayR columns (`type` free-text, `delta`, `source`, `description`, `site_id`) | **Kept, unmodified.** `LedgerRepository.append()` (NECTAR) now writes `delta` on every insert alongside its own columns, so `wallet_balances` and any other legacy reader that only knows about `delta` keeps working with zero code changes on StreetPlayR's side. |
| New NECTAR ledger columns (`wallet_id`, `status`, `amount`, `balance_after`, `idempotency_key` UNIQUE, `reference_id`, `reference_type`, `metadata`) | Added as **nullable, additive** columns in `infrastructure/supabase/migrations/0007_foundation_repair.sql` (NECTAR repo — not yet applied, see below). Old rows get NULL in all of them; nothing breaks. |
| Who writes going forward | NECTAR's `LedgerRepository.append()` is the only writer that should ever insert a *reward/referral-sourced* row (source `reward_execution`, `referral_bonus`, etc.). StreetPlayR's own `welcome_bonus` and any `/api/nectar/redeem` (`type:'redemption'`) writes continue exactly as they are — StreetPlayR-local wallet events keep flowing through StreetPlayR's own code paths, unchanged. |
| Who reads | Both sides read the same table. StreetPlayR's UI can keep summing `delta`; a future Unified Admin wallet view can read the fuller NECTAR columns (`status`, `reference_type`, `metadata`) when present, and fall back to `type`/`delta`/`description` for legacy rows. |
| Duplicate sources of truth | None. This was the explicit thing to avoid (STRICT RULE 8) — a second `nectar_wallet_transactions` table was rejected outright, in favor of extending the one real table. |

## What was NOT done, and why

- **`profiles.sprr_balance` was not touched.** It's StreetPlayR's cached current-balance column, separate from the ledger. It is out of scope for this reconciliation (no evidence it's wrong, no instruction to touch it) — flagged only as a future question: should it eventually be a materialized/derived value from `wallet_balances` instead of an independently-updated cache? Not answered here; would need its own audit of every write site (`/api/nectar/redeem`, the privileged-column trigger, etc.) before touching it.
- **No existing row was modified or deleted.** All 12 legacy rows are untouched by the migration (additive `ALTER TABLE ... ADD COLUMN` only).
- **`type` vocabulary is now mixed** (StreetPlayR's `earned`/`redemption`/`referral_bonus` free text alongside NECTAR's `credit`/`debit`/`hold`/`release`/`expire`) — both fit in the same untyped TEXT column (confirmed: no CHECK constraint exists on the live column), so this is safe but semantically messy. Normalizing this into one vocabulary is flagged as a real follow-up, not attempted here — STRICT RULE 15 ("prefer small, auditable changes over rewrites") argues against doing it inside this repair pass.
- **`wallet_balances` view formula was not touched or re-derived**, because this session has no way to read or alter it (no DDL credential). The empirical `available:100` vs. one `delta:50` transaction discrepancy noted above is real and unresolved — whoever applies the migrations in this phase should also run `select pg_get_viewdef('wallet_balances'::regclass, true);` and confirm the formula still makes sense once NECTAR-sourced rows start landing with both `delta` and `amount` populated.

## Verification status

- ✅ Live schema shape confirmed via REST/PostgREST introspection (real DB, no mocks).
- ✅ All 12 existing rows read and inspected — confirmed zero NECTAR-sourced rows currently exist, confirming the ledger bug's real-world impact.
- ✅ Migration authored (`0007_foundation_repair.sql`) and code updated (`LedgerRepository.append()` now writes `delta` too) to match this ownership model.
- ⏳ Migration **not yet applied** — no DDL-capable credential available in this session (see `NECTAR_FOUNDATION_REPAIR_REPORT.md`). A real end-to-end test run (`apps/api/tests/golden-path.test.ts`) confirms the code now reaches exactly this missing-column error, proving the migration is the one remaining blocker for this table.
- ⏳ `wallet_balances` view formula unverified — needs SQL-console access to fully close out.
