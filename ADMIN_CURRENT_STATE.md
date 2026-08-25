# Admin Current State — Audit

> Phase 1 deliverable, Unified Admin build. Real inspection of `app/admin` as it exists at the start of this work — routes, components, auth, data sources, gaps. Findings feed directly into `UNIFIED_ADMIN_ARCHITECTURE.md` and `UNIFIED_ADMIN_IMPLEMENTATION_REPORT.md`.

## Routes (34 route files, 23 distinct paths under `app/admin/`)

```
overview, analytics, commerce, customers[/id], inventory, liveops,
nectar/{achievements,campaigns,drops,events,progression,redemptions,
        referrals,rewards,tiers,wallets},
observability, orders, pages, products, referrals, rewards, risk,
segments, settings[/access], simulation, users, wallet
```
`app/admin/page.tsx` redirects to `/admin/overview`.

## Auth & RBAC — solid, reused as-is

`app/admin/layout.tsx`: `getSSRUser()` → redirect `/login` if unauthenticated; `isOpsRole(user.role)` → redirect `/home` if not an ops role. Server-side, not client-gated.

`lib/auth/permissions.ts`: real `Permission` union + `ROLE_PERMISSIONS` map, DB-backed `UserRole` enum (`super_admin | ops_admin | fulfillment | editorial | support | viewer | member`). Enforced both at layout level and per-server-action via `requireSSRRole()`/`requireOpsApi()`. This is genuinely production-grade — no rebuild needed, only additive extension (see below).

**Real, current gap:** zero rows in `profiles` currently have any ops role (`super_admin`/`ops_admin`/etc.) — verified via direct query, `select id,email,role from profiles where role in ('super_admin','ops_admin')` → empty. There is no way to log into `/admin` today without first manually promoting a real user's `role` column. This blocked browser-based UI verification this session (see `UNIFIED_ADMIN_TEST_REPORT.md`) and should be the very first thing a human does before using any of this work.

## Sidebar / navigation

`components/ops2/sidebar.tsx` — config-driven `NavSection[]` (`NAV`), grouped (Core / Commerce / NECTAR / Intelligence / System), active-state via `usePathname()`, collapsible. `components/ops2/top-bar.tsx`, `components/ops2/command-palette.tsx` (cmdk, ⌘K), `components/ops2/platform-switcher.tsx` + `stores/ops2/platform-store.ts` (Zustand, persisted). All functional, no rebuild needed.

**Gap found and fixed this session:** the sidebar had no entry for reward executions (the join between events, rules, and ledger transactions) — added.

## Data sources — audited page by page, this is the real finding

| Page | Data source before this session | Verdict |
|---|---|---|
| `nectar/wallets` | `app/actions/ops/wallets.ts::listAdminWalletTransactionsAction` → **`wallet_transactions`** | **Wrong table.** StreetPlayR's separate, legacy, delta-based table — not the NECTAR ecosystem ledger. Confirmed live: `nectar_wallet_transactions` (the real ledger, proven working in `NECTAR_FOUNDATION_GREEN_REPORT.md`) was never queried anywhere in `app/admin`. **Fixed this session** — see implementation report. |
| `nectar/events` | `modules/nectar/events/components/event-stream-monitor.tsx`, client component, `getSupabaseClient()` (browser client) → `events` table | Right table, wrong access pattern — a browser-side Supabase client reading real operational data directly, inconsistent with every other admin page (which routes through server actions + `createAdminClient()`). Not fixed this session (real-time/replay logic in this component wasn't fully audited — flagged as a follow-up, not silently rewritten). |
| `nectar/rewards` | `modules/nectar/rewards/components/{rule-list,rule-builder}` — no `.from(...)` calls found; appears to read from `@nectar/types` static imports / local component state | Not connected to real `reward_rules` table. Not fixed this session — `lib/nectar/service.ts::listRewardRules()` now exists and is ready to wire in, but the rule-*authoring* UI (`rule-builder.tsx`) implies write capability this phase deliberately does not build (Phase 7: "read-side first", no reward-rule write path exists in NECTAR yet either). |
| `nectar/tiers` | Imports `TIERS` directly from `@nectar/types` — static data, no DB call | Accurate as a reference table (tier thresholds are genuinely constants), but doesn't show real per-user tier distribution. Not fixed — low priority, thresholds are correctly static. |
| `nectar/achievements`, `drops`, `progression`, `referrals`, `campaigns`, `redemptions` | No `.from(...)`/fetch calls found — hard-coded `DEMO_*` arrays or local component state | **Mock data, not real.** None of the underlying tables/RPCs these would need are even deployed yet (`campaigns_v2`, referral conversion tables — see `ECOSYSTEM_CONTRACTS.md`/`FOUNDATION_MIGRATION_REVIEW.md`). Correctly left alone — building real UI on top of an unmigrated schema would violate this project's explicit "don't pretend unfinished contracts are production-ready" rule. |
| `overview`, `orders`, `products`, `customers[/id]`, `inventory` | `createAdminClient()` server components/actions against real StreetPlayR tables (`orders`, `products`, `customers`, `profiles`) | Real, working, server-side. No changes needed this pass. |
| `pages` (CMS) | `app/actions/cms.ts` + `lib/page-editor/get-page-blocks.ts` against real `page_blocks` table | Real, working — draft/publish/reorder all functional. See "Content Studio" below. |
| `settings/access` | Renders `ROLE_PERMISSIONS` read-only | Real data (it's the actual permission map), no mutation capability — accurate as a display, not a management UI. |

## Reusable UI components — the real gap this phase targeted

Confirmed via direct search: **no shared toast, no shared modal/dialog, and no shared server-paginated DataTable existed anywhere in `app/admin` before this session.** `@radix-ui/react-dialog` was an installed-but-unused dependency. `@radix-ui/react-toast` and `@tanstack/react-table` are not installed at all. Existing components: `components/ops2/ui/{badge,empty-state,metric-card,status-dot}.tsx` — solid, kept as-is.

**Built this session** (see `UNIFIED_ADMIN_IMPLEMENTATION_REPORT.md` for detail): `components/admin/data-table.tsx`, `components/admin/confirm-dialog.tsx`, `components/admin/toast.tsx`.

## Design system gap — undefined color utilities across app/admin (found this session)

Every ops2/admin component uses Tailwind utility classes like `bg-base`, `text-text-primary`, `border-border`, `bg-status-error`, `text-platform-playr` — but **no `@theme` block in this Tailwind v4 (CSS-first, no `tailwind.config.*` file) project ever mapped these to real values.** The color values themselves existed as plain CSS custom properties in `app/ecosystem-ops.css` (`--bg-base`, `--text-primary`, etc.), imported via `layer(ops)`, but were never wired into Tailwind's `@theme`. This means these utility classes have been producing **zero CSS** since they were written — the entire admin UI has likely never rendered its intended color scheme, relying instead on the plain-CSS `.surface`/`.metric-card`/`.btn-*` classes in the same file for whatever visual structure it does have.

**Fixed this session** (see implementation report): added the missing `@theme inline` mapping in `app/globals.css`, plus 3 new CSS variables (`--status-warning`, `--status-info`, `--status-pending`, `--platform-*`) that were referenced by class name across the codebase but never defined at all.

## Content Studio (CMS) — real, working, not rebuilt

`components/page-editor/*` (block renderer, 15 block types) + `app/actions/cms.ts` (list/create/update/delete/reorder/publish, all `requireSSRRole`-gated) + `lib/page-editor/get-page-blocks.ts`. Draft/publish model via `page_blocks.content` (draft) vs `page_blocks.published_content` (live). This is a genuinely working, non-trivial CMS — per the explicit instruction not to build a second one, it is reused as-is this phase (see architecture doc for the one gap it has: no version-history/rollback table, which `AIRBONE_ADMIN_REFERENCE_AUDIT.md` flagged as worth adding later).

**No rich-text editor exists anywhere in this codebase** (confirmed: no TipTap/Slate/Quill/Lexical in `package.json`). Content blocks are structured JSON (hero, text_rich, image blocks etc.), not freeform WYSIWYG documents — matching Airbone's own approach (block-based, not rich-text-based). Not built this phase; flagged in the architecture doc for a scoped decision before Content Studio work continues.

## Media

No dedicated media library/picker component exists in `app/admin` (StreetPlayR's storefront has product-image handling, but no reusable Admin-side picker). Out of scope for this pass — flagged for Phase 9 follow-up.

## Audit logging

`lib/orchestration/events.ts::recordEvent()` + `operational_events` table — real, working, already used by order/payment orchestration (`domain: 'order'|'payment'|...`, `action`, `actorId`, `resourceType/Id`, `metadata`). This is the audit architecture to extend, not replace — no second audit table should be created. Not yet wired into any Admin CRUD mutation this pass (no commerce/content mutation UI was built this phase to wire it into — see implementation report).

## Multi-site

`sites`/`site_configs`/`site_access` tables + `stores/ops2/platform-store.ts` (Zustand) + `PlatformSwitcher` component — real, working, one live row (`streetplayr`). `PlatformId` union in `types/ops2/ops.ts` is stale relative to the live `platforms` table naming (see `PLATFORM_ID_CONTRACT.md` from the NECTAR phase) — not fixed this pass, flagged in the architecture doc.
