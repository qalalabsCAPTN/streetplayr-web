# Unified Admin — Test Report

> Exactly what was run, real output, and — per this project's established honesty standard (STRICT RULE 11 carried forward from the NECTAR phases) — exactly what could NOT be verified and why, rather than a claimed pass.

## 1. Full project typecheck

```
npx tsc --noEmit -p tsconfig.json
→ exit 0, 0 errors
```
Covers every file touched this session (`lib/nectar/service.ts`, `app/actions/admin/nectar.ts`, `app/admin/nectar/wallets/page.tsx`, `app/admin/nectar/executions/page.tsx`, `components/admin/*`, `lib/auth/permissions.ts`, `components/ops2/sidebar.tsx`) against the whole existing codebase's types — a real, whole-project check, not scoped only to new files.

## 2. Full existing test suite — regression check

```
npx vitest run
→ before this session's changes: 79 passed (79)
→ after: 84 passed (84)  [+5 new, 0 broken]
```
No pre-existing test broke. The 5 new tests are `lib/nectar/service.test.ts` (see below).

## 3. New tests added this session

`lib/nectar/service.test.ts` — 5 tests, all passing:
- `listLedgerTransactions` queries `nectar_wallet_transactions`, asserts it does **not** query `wallet_transactions` (regression guard for the exact bug fixed this pass — see `UNIFIED_ADMIN_IMPLEMENTATION_REPORT.md` #1)
- `getWalletBalance` reads `wallet_accounts`
- `listRewardExecutions` queries `reward_executions`, asserts it does **not** query the (nonexistent) `identity_profiles`
- `listEcosystemEvents` queries `events`
- `listRewardRules` queries `reward_rules`

These assert exact table names via a fake DB client that records every `.from(<table>)` call — a shallow "does it return data" test would have passed even with the wrong-table bug this pass fixed; these are written specifically not to have that blind spot.

## 4. What could NOT be verified — stated plainly

**Browser/visual verification of the Admin UI was not performed.** Root cause: **zero rows in the live `profiles` table have any ops role** (`super_admin`, `ops_admin`, etc. — verified via direct query, all 23 real users are `role: 'member'`). There is no way to authenticate into `/admin` in the current database state. This is not a code defect in this session's work — `app/admin/layout.tsx`'s auth gate (`getSSRUser()` + `isOpsRole()`) is working exactly as designed; it's correctly refusing access to a database with no admin accounts.

**What this means concretely, and was not claimed:**
- The rebuilt `nectar/wallets` and new `nectar/executions` pages were never actually rendered in a browser this session. Their correctness rests on: (a) the full-project typecheck passing, (b) the service-layer unit tests proving the right tables are queried, (c) careful manual review of every CSS class name against the actual token inventory used elsewhere in the codebase (documented in `UNIFIED_ADMIN_IMPLEMENTATION_REPORT.md` #4's fix). This is real evidence, but it is not the same as a screenshot, and this report does not claim it is.
- The `@theme` CSS fix (`UNIFIED_ADMIN_IMPLEMENTATION_REPORT.md` #4) is, by its nature, only fully confirmable by looking at rendered pixels. It was verified to be additive (no existing token redefined — confirmed by grepping for every prior `--color-*` definition in the codebase and finding none) and structurally correct (mirrors the one already-working example in the same file, `--color-background: var(--sp-bg-base)`), but not visually confirmed.
- One partial browser check *was* done: `preview_start` + `navigate` to `/admin/nectar/wallets` correctly redirected to `/login` (proving the auth gate itself works end-to-end through a real HTTP request), and `preview_logs` showed no server errors during that request.

**What would close this gap, concretely:** promote one real `profiles` row to `ops_admin` (`update profiles set role = 'ops_admin' where email = '<a real email>'` — note this bypasses the privileged-column trigger only because it's run with the service role directly in SQL, not through the app; see `ECOSYSTEM_CONTRACTS.md` §9 for that trigger's behavior), log in as that user, and walk through `/admin/nectar/wallets` and `/admin/nectar/executions` to confirm real data renders with correct styling. This was not done by this session because creating a privileged account is a real, security-relevant state change that should be a deliberate human action, not something silently done to enable a screenshot.

## 5. Golden-path visibility — what's proven vs. what's assumed

`NECTAR_FOUNDATION_GREEN_REPORT.md` (prior session) proved, against the real database, that `nectar_wallet_transactions` and `reward_executions` hold real rows for user `e551e908-e67f-4984-ae60-ac090b1f14de` (balance 100→200→300 across 3 real ledger entries). This session's `lib/nectar/service.test.ts` proves the new Admin read functions query those exact tables with correct column names. **What is not independently re-proven this session:** that the specific SQL these functions generate, when actually executed by a live Next.js server against the live database, returns those exact rows correctly shaped for the UI. That gap is closed by the typecheck (query shapes match `NectarLedgerTransaction`/`NectarRewardExecution` types, which match the real column names verified in `FOUNDATION_MIGRATION_REVIEW.md`'s schema introspection) plus the unit tests (table names correct) — but a live read against the real DB through this exact code path was not executed this session, unlike the rigor applied in the NECTAR phases. Flagged rather than skipped silently.

## Summary

| Check | Result |
|---|---|
| Full project typecheck | ✅ 0 errors |
| Existing test suite (regression) | ✅ 84/84, no breaks |
| New service-layer tests | ✅ 5/5, table-name-correctness focused |
| Auth gate (real HTTP request) | ✅ confirmed via preview — redirects unauthenticated correctly |
| Server compile of new routes | ⚠ not confirmed — redirect happened before route compilation |
| Visual/browser UI verification | ❌ blocked — no ops-role account exists in the live DB |
| CSS `@theme` fix visual confirmation | ❌ not done — same blocker |
| Live DB read through the new code path | ❌ not done this session — logical correctness argued, not executed |
