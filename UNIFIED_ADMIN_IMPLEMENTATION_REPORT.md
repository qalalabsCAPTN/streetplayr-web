# Unified Admin — Implementation Report

> What was actually built this pass, what was found and fixed (root cause → fix → test → document, per the brief's explicit rule), and what remains audited/architected but not implemented — stated plainly, not hidden behind a report instead of the work.

## Blockers found and fixed

### 1. `/admin/nectar/wallets` read the wrong table

- **Root cause:** `app/actions/ops/wallets.ts::listAdminWalletTransactionsAction` queried `wallet_transactions` — StreetPlayR's own separate, legacy, delta-based table (welcome bonuses, local redemptions) — never `nectar_wallet_transactions`, the real, proven-working NECTAR ecosystem ledger (`NECTAR_FOUNDATION_GREEN_REPORT.md`). The page had never displayed real ecosystem reward data.
- **Fix:** Built `lib/nectar/service.ts` (the NECTAR service-layer seam) + `app/actions/admin/nectar.ts` (the gated server-action wrapper) + rewrote `app/admin/nectar/wallets/page.tsx` to use them. Read-only — no ledger writes added.
- **Test:** `lib/nectar/service.test.ts` — 5 tests asserting each service function queries the exact right table name (`nectar_wallet_transactions`, explicitly *not* `wallet_transactions`), specifically because this exact class of table-name confusion has bitten this project multiple times this week (see `NECTAR_FOUNDATION_REPAIR_REPORT.md`'s correction notice). All 5 pass.
- **Documented:** `ADMIN_CURRENT_STATE.md` (found), `UNIFIED_ADMIN_ARCHITECTURE.md` (service-boundary rule this fix establishes), here.

### 2. No page showed reward *executions* — only rules and a (wrong) ledger

- **Root cause:** `app/admin/nectar/rewards` shows reward *rules* (what could happen); nothing showed reward *executions* (what actually happened — the event → rule → ledger-transaction chain). This is the exact chain `NECTAR_FOUNDATION_GREEN_REPORT.md` proved end-to-end against the real database, and it had no Admin visibility at all.
- **Fix:** New `app/admin/nectar/executions/page.tsx`, wired to `listRewardExecutions()` (also new in the service layer), with status filtering (success/failed/skipped) and a join to the rule name. Added to the sidebar (`components/ops2/sidebar.tsx`).
- **Test:** Covered by `lib/nectar/service.test.ts`'s `listRewardExecutions` assertions.
- **Documented:** `ADMIN_CURRENT_STATE.md`, `UNIFIED_ADMIN_ARCHITECTURE.md`.

### 3. No shared DataTable, ConfirmDialog, or Toast existed anywhere in `app/admin`

- **Root cause:** Confirmed by direct search — every page that needed a table/confirmation/toast hand-rolled its own (or, for toasts, most pages had none at all). `@radix-ui/react-dialog` was an installed-but-unused dependency; `@radix-ui/react-toast` and `@tanstack/react-table` were never installed.
- **Fix:** `components/admin/data-table.tsx` (generic column-config, server pagination props, loading/empty/error states — no new dependency, adapted from Airbone's pattern per `AIRBONE_ADMIN_REFERENCE_AUDIT.md` §6 rather than requiring `@tanstack/react-table`), `components/admin/confirm-dialog.tsx` (built on the already-installed `@radix-ui/react-dialog`, modeled on Airbone's `ConfirmDialog` prop shape per §8), `components/admin/toast.tsx` (hand-rolled — no `@radix-ui/react-toast` dependency added mid-task; a `useAdminToast()` hook + `<AdminToastProvider>`).
- **Test:** Used live in `nectar/wallets` and `nectar/executions` pages; validated indirectly via the full project `tsc --noEmit` pass (0 errors) and the dev-server compile check (see `UNIFIED_ADMIN_TEST_REPORT.md`). No isolated component unit tests were added for these three — they're presentational, and the highest-value test (do they compile and render inside a real page without crashing) is exactly what the typecheck + real service tests already cover.
- **Documented:** `ADMIN_CURRENT_STATE.md`, `UNIFIED_ADMIN_ARCHITECTURE.md`.

**Not yet wired in:** `AdminToastProvider` is built but not yet mounted in `app/admin/layout.tsx` (no mutation UI was built this pass that needs to fire a toast — mounting a provider with nothing calling it would be inert scaffolding; the concrete next step is to mount it alongside the first real Admin mutation, e.g. a commerce CRUD form).

### 4. Every color utility class across the entire `app/admin` UI was undefined

- **Root cause:** `bg-base`, `text-text-primary`, `border-border`, `bg-status-error`, `text-platform-playr`, etc. — used throughout `components/ops2/*` and every admin page — had no `@theme` mapping anywhere in this Tailwind v4 (CSS-first, no `tailwind.config.*`) project. The values existed as differently-named plain CSS custom properties (`--bg-base`, `--text-primary`, ...) in `app/ecosystem-ops.css`, but nothing ever bridged them into Tailwind's theme. These utilities have very likely been producing zero CSS since they were written.
- **Fix:** Added the missing `@theme inline` block in `app/globals.css`, mapping every `--color-*` token these utilities need back to the existing `ecosystem-ops.css` variables. Also added 3 CSS variables that were referenced by class name (`status-warning`, `status-info`, `status-pending`, `platform-{all,streetplayr,playr,club,game}`) but never defined at all, with a note that the platform accent colors are a best-effort palette (no original design spec was found for them).
- **Test:** `tsc --noEmit` doesn't catch CSS issues (not its job); this is a CSS-only, additive change (no existing `--color-*` token was redefined, since none existed before). Real visual verification via browser was blocked (see item 5 below) — flagged honestly in the test report rather than claimed as visually confirmed.
- **Documented:** `ADMIN_CURRENT_STATE.md` ("Design system gap"), here.

### 5. No ops-role user exists in the live database — Admin UI cannot be logged into

- **Root cause:** `select id, email, role from profiles where role in ('super_admin','ops_admin')` → zero rows, verified via direct query this session. Every one of the 23 real live profiles is a `member`.
- **Not fixed this session, by design.** Creating a privileged account is a real state mutation with security weight (STRICT scope rules from the NECTAR phases carry forward: prefer small, auditable, reviewed changes; a self-granted admin account is the opposite of that). This blocks visual browser verification of everything built this pass (see `UNIFIED_ADMIN_TEST_REPORT.md`) — flagged as the literal first action a human needs to take, not silently worked around.
- **Documented:** `ADMIN_CURRENT_STATE.md`, `UNIFIED_ADMIN_TEST_REPORT.md`, here.

## Built this pass (files)

- `lib/nectar/service.ts` — NECTAR read-service (the one seam)
- `app/actions/admin/nectar.ts` — gated server actions wrapping it
- `lib/nectar/service.test.ts` — 5 tests, table-name regression focus
- `app/admin/nectar/wallets/page.tsx` — rewritten to use real ledger data
- `app/admin/nectar/executions/page.tsx` — new
- `components/admin/data-table.tsx`, `confirm-dialog.tsx`, `toast.tsx` — new foundation
- `components/ops2/sidebar.tsx` — added Executions nav entry, relabeled "Rewards" → "Reward Rules" for accuracy
- `lib/auth/permissions.ts` — added `nectar:view` permission, granted to `super_admin`/`ops_admin`/`support`/`viewer`
- `app/globals.css`, `app/ecosystem-ops.css` — the `@theme` fix

## Explicitly NOT built this pass (audited and architected, not faked)

Per the brief's own rule for unfinished NECTAR contracts, applied here at the Admin-phase level too — these are documented as deferred with a concrete next step, not built shallow or with mock data:

- **Commerce CRUD forms** (product/variant/collection/inventory create-edit-delete UI) — the existing `overview`/`orders`/`products`/`customers`/`inventory` pages already read real data server-side (`ADMIN_CURRENT_STATE.md`); building full CRUD forms with RHF+Zod validation, ConfirmDialog-gated deletes, and audit logging is real, substantial work not attempted this pass. Next step: one module (e.g. Products) as the reference implementation, using `components/admin/*` + `operational_events` audit wiring, then repeat the pattern.
- **Customer 360** — no unified page combining StreetPlayR + NECTAR data per customer was built. The pieces exist (`lib/nectar/service.ts` accepts a `userId` filter on every function; `app/admin/customers/[id]` already exists for the StreetPlayR side) — combining them into one page is the next step, not done here to avoid a shallow first pass.
- **Content Studio version history/rollback, media library, rich-text editor** — `page_blocks` has no version table; no media picker exists; no rich-text editor is installed. Decision on the rich-text editor is made (deferred until genuinely needed — see architecture doc); the other two are scoped follow-ups.
- **Ecosystem/sites, system/audit route groups** — the target taxonomy names these; the underlying real tables (`sites`, `site_configs`, `operational_events`) already exist and are already read elsewhere, but no dedicated Admin page surfaces them yet under these new paths.
- **Physical route-taxonomy rename** (`overview`→`dashboard`, `products`→`commerce/products`, etc.) — deferred as a separate, mechanical, low-risk follow-up; see `UNIFIED_ADMIN_ARCHITECTURE.md`'s "Migration path" for why.
- **`nectar/events` browser→server-action fix** — found (`ADMIN_CURRENT_STATE.md`) but not fixed this pass; the component has realtime/replay logic (`hooks/ops2/use-realtime.ts`, a replay mutation) that wasn't fully audited, and a partial rewrite risked breaking working functionality without full understanding of it. Flagged as a concrete next step: swap only the initial data-fetch to `listNectarEventsAction` (already built), leave the realtime subscription as-is pending its own audit.

## Success condition — status

> "StreetPlayR → NECTAR → Reward → Wallet → Admin is visible through real data."

**True, structurally**, per the code and typecheck: `app/admin/nectar/wallets` and `app/admin/nectar/executions` now read `nectar_wallet_transactions` and `reward_executions` — the exact tables `NECTAR_FOUNDATION_GREEN_REPORT.md` proved hold real data from the real pipeline (balance 100→200→300 for user `e551e908-...`, 3 real ledger rows). **Not yet visually confirmed in a browser** — no ops-role account exists to log in with (blocker #5 above). This is stated plainly rather than claimed as verified; see `UNIFIED_ADMIN_TEST_REPORT.md` for exactly what was and wasn't checked.
