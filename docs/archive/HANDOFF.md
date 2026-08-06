# Streetplayr × Nectar 2.0 — Handoff Doc

## Vision

4 sites (Streetplayr, Playr, + 2 TBD) share:
- 1 Supabase DB
- 1 Nectar rewards engine (earn on any site, redeem on any)
- 1 super-admin panel (`/admin`) with site-switcher dropdown
- Block-based CMS page editor (admin edits storefront without deploys)

---

## DB Migrations (ALREADY RUN — DO NOT RE-RUN)

### `supabase/migrations/00010_multi_site.sql`
Creates:
- `sites` table (id, slug, name, domain, color, is_active)
- `site_configs` (earn_rate, redeem_rate, min_redeem_points, tier_multipliers, allow_cross_site_redeem)
- `site_access` (user_id, site_id, role — for per-site admin access)
- Adds `site_id` column to `wallet_transactions` and `events`
- Adds `active_site_id` to `profiles`
- Seeds Streetplayr as first site with default config
- Backfills all existing wallet_transactions + events with streetplayr site_id
- Helper fn `get_site_id(slug TEXT) RETURNS UUID`
- RLS on all tables

### `supabase/migrations/00011_page_editor.sql`
Creates:
- `page_blocks` (id, site_id, page_slug, block_type TEXT, content JSONB, block_order INT, is_visible BOOL, created_by, created_at, updated_at)
- UNIQUE constraint on (site_id, page_slug, block_order)
- RLS: ops_admin+ can write; public can read visible blocks
- `reorder_page_blocks(site_id, page_slug, block_ids UUID[])` fn
- Seeds 4 default home blocks for streetplayr: announcement_bar, hero, product_carousel, cta_banner

---

## Files Created / Modified

### NEW files
| File | What |
|------|------|
| `stores/ops2/platform-store.ts` | Zustand store — loads sites from DB, persists activePlatformId |
| `components/ops2/platform-hydrator.tsx` | Client component — calls loadSitesFromDB() on admin mount |
| `lib/page-editor/get-page-blocks.ts` | Server fn — resolves slug→UUID, queries page_blocks |
| `components/page-editor/block-renderer.tsx` | Client component — renders PageBlock[] via switch on block_type |
| `app/admin/pages/page.tsx` | Admin page editor UI — 3-panel CRUD for page blocks |
| `app/admin/simulation/page.tsx` | Nectar simulation sandbox — 4 scenarios, inline engine |

### MODIFIED files
| File | What changed |
|------|------|
| `app/admin/layout.tsx` | Added `<PlatformHydrator />` |
| `app/(store)/home/page.tsx` | Added `getPageBlocks()` + `<BlockRenderer>` |
| `app/admin/orders/page.tsx` | Filters by site_id via usePlatform() |
| `app/admin/customers/page.tsx` | Filters by site_id, cross-platform view |
| `app/admin/settings/page.tsx` | 3-tab: Sites / Site Config / Access management |
| `app/admin/nectar/wallets/page.tsx` | Filters by site_id |
| `modules/nectar/events/components/event-stream-monitor.tsx` | Completed truncated component |
| `components/ops2/sidebar.tsx` | Added Page Editor + Simulation nav items |
| `lib/ops2/supabase.ts` | Typed client as `SupabaseClient<any>` to unblock TS |

### TypeScript status
`npx tsc --noEmit` → **zero errors** ✓

---

## 12 Block Types in Page Editor

| type | content fields |
|------|---------------|
| `announcement_bar` | text, bg_color, text_color, link_href, link_label |
| `hero` | title, subtitle, cta_label, cta_href, bg_image_url, overlay_opacity |
| `text_rich` | heading, body_html |
| `image_full` | image_url, alt_text, link_href, caption |
| `image_grid` | images[] (url, alt, href), columns |
| `cta_banner` | heading, subtext, cta_label, cta_href, bg_color, accent_color |
| `countdown_timer` | heading, target_datetime, cta_label, cta_href |
| `product_carousel` | heading, product_ids[], limit |
| `collection_grid` | heading, collection_slugs[], columns |
| `video_embed` | video_url, poster_url, autoplay, loop |
| `spacer` | height_px |
| `divider` | style, color |

---

## What Still Needs Doing

### 1. Add Second Site (Playr) — DB
```sql
INSERT INTO sites (slug, name, domain, color, is_active)
VALUES ('playr', 'Playr', 'playr.store', '#10B981', true);

INSERT INTO site_configs (site_id, earn_rate, redeem_rate, min_redeem_points, allow_cross_site_redeem)
VALUES (get_site_id('playr'), 10, 100, 500, true);
```
Run in Supabase SQL editor.

### 2. Cross-Site Redeem Logic
`wallet_transactions` has `site_id` but earn/redeem fns need to check `allow_cross_site_redeem` in `site_configs` before processing. Currently no enforcement server-side. Add check in whatever fn handles redemption.

### 3. Product Carousel / Collection Grid / Video Embed block renders
`block-renderer.tsx` renders placeholder `[product_carousel — render component goes here]` for async blocks. Need real server components:
- `ProductCarouselBlock` — fetch products by IDs from DB
- `CollectionGridBlock` — fetch products by collection slug
- `VideoEmbedBlock` — render video player

### 4. Countdown Timer — client-side JS
`CountdownBlock` in `block-renderer.tsx` renders `--` placeholders with `data-countdown-target` attrs. Need `useEffect` with `setInterval` to tick. Currently static.

### 5. Drag-and-drop block reorder
Page editor has visual reorder UI but `reorder_page_blocks` RPC not wired. On drop, call:
```ts
const db = getSupabaseClient();
await db.rpc('reorder_page_blocks', {
  p_site_id: siteUUID,
  p_page_slug: 'home',
  p_block_ids: orderedUUIDs
});
```

### 6. Image upload for blocks
`image_url` fields currently expect external URL string. No upload UI. Add Supabase Storage upload → get public URL → fill field.

### 7. Storefront page editor integration for non-home pages
`app/(store)/home/page.tsx` uses BlockRenderer. Other pages (about, collection, etc.) don't. Add `getPageBlocks(slug, 'streetplayr')` + `<BlockRenderer>` to each storefront page that should be CMS-editable.

### 8. `formatDateTime` might be missing
`wallets/page.tsx` imports `formatDateTime` from `@/lib/ops2/format`. Verify that export exists — if not, add:
```ts
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}
```

### 9. Supabase RLS for site_access + ops roles
`site_access` table exists. RLS policies need to gate admin routes — currently admin pages are client-gated only. Add server-side checks or middleware if security matters before launch.

### 10. Generate proper Supabase TS types (nice-to-have)
Currently `getSupabaseClient()` typed as `any`. Run:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
```
Then pass to `createClient<Database>()`.

---

## Testing Checklist

### DB
- [ ] Supabase → Table Editor → `sites` table has streetplayr row
- [ ] `site_configs` has streetplayr config row
- [ ] `page_blocks` has 4 seeded home blocks for streetplayr

### Admin panel (`/admin`)
- [ ] Sidebar loads — Page Editor + Simulation links visible
- [ ] Platform switcher dropdown shows "All" + "Streetplayr" (loaded from DB)
- [ ] `/admin/orders` — table loads, filters change when platform switched
- [ ] `/admin/customers` — table loads, search works
- [ ] `/admin/settings` — Sites tab shows streetplayr; Site Config tab shows earn_rate etc; Access tab loads
- [ ] `/admin/pages` — page list shows "home"; blocks load; add/edit/delete block works; visibility toggle works
- [ ] `/admin/simulation` — run all 4 scenarios, see trace output
- [ ] `/admin/nectar/wallets` — ledger loads; click row shows side panel detail

### Storefront (`/`)
- [ ] Home page loads — BlockRenderer renders before HomeHero
- [ ] Announcement bar block (if visible=true in DB) shows at top of page
- [ ] Add a new block in admin → refresh home → block appears

### Multi-site (after adding Playr)
- [ ] Platform switcher shows Playr option
- [ ] Switch to Playr → orders/customers/wallets filter to Playr data only
- [ ] Switch to All → full cross-platform view

---

## Key Paths Quick Ref

```
app/admin/                        ← all admin routes
app/(store)/                      ← storefront routes
components/ops2/                  ← admin UI components
components/page-editor/           ← storefront block renderer
lib/page-editor/                  ← server-side block fetch
stores/ops2/platform-store.ts     ← site switcher state
hooks/ops2/use-platform.ts        ← hook for apiParam (slug)
types/ops2/ops.ts                 ← shared types
supabase/migrations/              ← DB migrations (00010, 00011 already run)
```

---

## Stack

- Next.js 14 App Router + TypeScript
- Tailwind CSS
- Supabase (Postgres + Auth + RLS + Storage)
- Zustand + persist (admin state)
- TanStack React Query (data fetching)
- Radix UI (tabs, dialogs)
- `@nectar/types` → tsconfig alias to `./packages/types/src` (NOT npm pkg)
