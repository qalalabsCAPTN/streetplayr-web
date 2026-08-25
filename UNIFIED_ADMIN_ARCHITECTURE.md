# Unified Admin Architecture

> Phase 2+ deliverable. Target architecture for the StreetPlayR Unified Admin, its service-boundary rules, the target folder taxonomy, and the concrete migration path from the current 23-route flat structure to it.

## The rule this whole document exists to enforce

```
                    Admin UI
                       ↓
              Admin service layer
                       ↓
        ┌──────────────┼──────────────┐
        ↓               ↓               ↓
   StreetPlayR       NECTAR          Content
   Services          (service)       Services
        ↓               ↓               ↓
    Supabase        NECTAR DB          CMS
```
No Admin page or component ever calls `createAdminClient()` (or any Supabase client) directly for a table that belongs to another domain's service. Every domain gets exactly one seam:

- **StreetPlayR commerce**: existing `lib/orchestration/*`, `app/actions/*` (orders, products, customers) — already follows this pattern, unchanged.
- **NECTAR**: `lib/nectar/service.ts` (new, this phase) — the only file in the entire Admin codebase allowed to query `nectar_wallet_transactions`, `wallet_accounts`, `wallet_balances`, `reward_executions`, `events`, `reward_rules`. Everything else calls it through `app/actions/admin/nectar.ts`.
- **Content**: existing `app/actions/cms.ts` + `lib/page-editor/*` — already follows this pattern, unchanged.

## NECTAR service boundary — the one deliberate interim compromise, and why

`lib/nectar/service.ts` reads NECTAR's tables via the shared Supabase project's service-role client, **not** an HTTP call to NECTAR's `apps/api`. This is a conscious, documented trade-off, not an oversight:

- NECTAR's `apps/api` (the real HTTP service) is not deployed anywhere reachable from this app in the current environment — it only runs locally, and only when someone starts it manually alongside Redis/Docker (neither is running in this sandbox — see `NECTAR_FOUNDATION_GREEN_REPORT.md`'s "what could not be verified").
- StreetPlayR and NECTAR share **the same Supabase project** (`sayxtpglwjiinnrftifq` — established across `ECOSYSTEM_CONTRACTS.md` and every NECTAR-phase document). Reading it server-side, with the service-role key, from StreetPlayR's own server is not a trust escalation — it's the same trust level NECTAR's own `apps/api` would have reading it.
- The rule that actually matters — **"never let browser code directly mutate/read sensitive NECTAR tables"** — is fully satisfied: `lib/nectar/service.ts` is imported only by `app/actions/admin/nectar.ts` (`'use server'`), which is imported only by `'use client'` page components that call it through Next's server-action RPC boundary, never a direct client-side Supabase call.
- **The moment NECTAR's HTTP API is deployed somewhere reachable, only `lib/nectar/service.ts` needs to change** — swap its Supabase queries for `fetch()` calls to NECTAR's `/v1/*` endpoints (the same client shape already exists: `lib/nectar/client.ts`, built in the Phase 2 event-bridge work, already knows how to authenticate to NECTAR's API). Nothing above that seam (`app/actions/admin/nectar.ts`, every page) needs to change at all. This is the entire point of the layering — it's what makes the swap a one-file change instead of a UI rewrite.

**Hard rule, enforced by omission, not just convention:** `lib/nectar/service.ts` has no write functions. There is no `writeLedgerEntry()`/`adjustNectarWallet()` in it, and none should be added until NECTAR itself exposes a real write API — Admin-side direct `INSERT INTO nectar_wallet_transactions` is exactly the anti-pattern the brief prohibits, and the easiest way to prevent it is for the function to not exist to call.

## Target folder taxonomy

```
app/admin/
├── dashboard/                  (= current overview/, renamed)
├── commerce/
│   ├── products/                (= current products/)
│   ├── orders/                  (= current orders/)
│   ├── customers/                (= current customers/)
│   └── inventory/                (= current inventory/)
├── nectar/
│   ├── wallets/                  ✅ fixed this phase (nectar_wallet_transactions)
│   ├── transactions/             (alias/rename of wallets — see note below)
│   ├── executions/               ✅ new this phase
│   ├── rewards/                  (= current nectar/rewards, rules-only — read-side)
│   └── events/                   (= current nectar/events — flagged for browser→server-action fix)
├── content/
│   ├── pages/                    (= current pages/)
│   ├── editor/                   (block editor lives inside pages/ currently — see note)
│   └── media/                    (new — Phase 9, not built yet)
├── ecosystem/
│   ├── sites/                    (new — surfaces the real `sites`/`site_configs` tables)
│   └── configuration/            (new)
└── system/
    ├── users/                    (= current users/)
    ├── roles/                    (= current settings/access, renamed)
    └── audit/                    (new — surfaces `operational_events`)
```

**Note on `nectar/wallets` vs `nectar/transactions`:** the brief's target tree lists both. In practice one page already does both jobs (balance summary + ledger detail, see the rebuilt `nectar/wallets/page.tsx`) — splitting them into two routes is cosmetic, not architectural, and is left as a trivial follow-up rather than done speculatively this pass.

## Migration path — why the existing 23 routes were NOT physically moved this pass

Physically moving `app/admin/overview` → `app/admin/dashboard`, `app/admin/products` → `app/admin/commerce/products`, etc. touches every internal `<Link href>`, every `usePathname()` active-route check in the sidebar, every `redirect()` call, and every bookmark/deep-link into the admin — a wide, mechanical, high-blast-radius change with real regression risk to 20+ currently-working pages, for a filesystem-organization benefit that doesn't change behavior. Per this project's own repeatedly-stated preference ("prefer small, auditable changes over rewrites" — the same principle that shaped every NECTAR-phase migration decision), that rename is deferred as a **documented, mechanical, low-risk follow-up** rather than bundled into a phase that also touches live data-correctness bugs (the wrong-table wallet fix) and a project-wide CSS fix. Doing all three at once would make it much harder to bisect a regression back to its cause.

**The new work this phase adds already lands in the target shape** (`nectar/executions` is new, placed correctly; `lib/nectar/service.ts` and `app/actions/admin/nectar.ts` are the new service-layer files, placed correctly) — so the taxonomy is being grown into, not retrofitted after the fact. The mechanical rename of the other ~20 routes is a single, scriptable, reviewable follow-up (move directory, `grep -r` every `href="/admin/<old-path>"`, update sidebar config) that should be its own change, not silently folded into this one.

## RBAC extension

`lib/auth/permissions.ts` gained one new permission, `nectar:view`, granted to `super_admin`, `ops_admin`, `support`, `viewer` — matching the read-only scope of what NECTAR read-service exposes today. **No `nectar:manage`/write permission was added** — per the "no write path exists yet" rule above, adding a permission for a mutation nothing can perform yet would be exactly the kind of unfinished-contract pretense the brief warns against. Add it alongside the first real write endpoint, not before.

The brief's target role list (Super Admin, Admin, Manager, Content Manager, Support, Analyst) does **not** replace the existing DB-backed enum (`super_admin, ops_admin, fulfillment, editorial, support, viewer, member`) this phase — the existing enum is real, deployed, and has a live `CHECK` constraint (`ECOSYSTEM_CONTRACTS.md` §9's enum-drift finding already documents that widening this enum needs care). Renaming/restructuring roles is a schema migration with real blast radius on every existing `role`-gated check across the codebase; not undertaken speculatively here. If the target role names are wanted, the concrete next step is a mapping table (`fulfillment`→ some future "Support-ops" split, etc.) proposed and reviewed on its own, not decided inside this architecture pass.

## Component library location

`components/admin/*` — new, this phase (`data-table.tsx`, `confirm-dialog.tsx`, `toast.tsx`). Distinct from `components/ops2/*` (existing, kept as-is: sidebar, top-bar, badges, command palette, platform switcher) — `ops2` is shell/chrome, `admin` is the new reusable content-level component set. This split is deliberate: it keeps the new foundation work additive and easy to find, rather than intermixed with the existing, working `ops2` layer.

## Content Studio — rich text editor decision (deferred, documented per the brief's instruction)

No rich-text editor exists in this codebase today (`ADMIN_CURRENT_STATE.md`). The existing CMS is block-structured JSON, not freeform documents — closer to Airbone's own approach (`AIRBONE_ADMIN_REFERENCE_AUDIT.md` §12: Airbone also has no WYSIWYG library, uses a schema-driven block form instead) than to a classic blog-post editor. Per the brief's explicit instruction ("If a new rich text editor is genuinely required... document the choice"), the choice made this phase is: **not yet required.** The existing `text_rich` block type already accepts structured content; a full WYSIWYG (Tiptap is the natural pick if/when one is needed — ProseMirror-based, React-friendly, well-maintained, and StreetPlayR's stack has no conflicting rich-text dependency) should be added only when a concrete block/field genuinely needs freeform formatting beyond what the current JSON-block model supports — not spec'd speculatively here.

## What this phase built vs. what remains architecture-only

See `UNIFIED_ADMIN_IMPLEMENTATION_REPORT.md` for the precise built/deferred split. In brief: the service-boundary pattern, the RBAC extension, the 3 foundation components, and one fully-real NECTAR read module (wallets + executions, using real data proven live in `NECTAR_FOUNDATION_GREEN_REPORT.md`) are built. Commerce CRUD forms, Customer 360, a rich-text editor, a media library, a formal audit-log UI, and the physical route-taxonomy rename are architected here but not implemented this pass — each has a clear, scoped next step rather than a partial/fake implementation.
