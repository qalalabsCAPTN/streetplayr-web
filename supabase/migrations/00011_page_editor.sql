-- ============================================================================
-- StreetPlayR — Page Editor (CMS Block Engine)
-- ============================================================================
-- Stores structured page content per site. Each page = ordered list of blocks.
-- Admin edits blocks → storefront reads and renders them.
-- Fully idempotent. Run AFTER 00010_multi_site.sql.
-- ============================================================================

-- ─── 1. Page blocks ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS page_blocks (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id      UUID    NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  page_slug    TEXT    NOT NULL,   -- 'home' | 'about' | 'collections' | 'shop' | etc.
  block_type   TEXT    NOT NULL,   -- see BLOCK TYPES below
  content      JSONB   NOT NULL DEFAULT '{}',
  block_order  INTEGER NOT NULL DEFAULT 0,
  is_visible   BOOLEAN NOT NULL DEFAULT true,
  created_by   UUID    REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Prevent duplicate order positions on same page
  UNIQUE (site_id, page_slug, block_order)
);

-- BLOCK TYPES and their content JSONB shape:
--
-- 'hero'              : { title, subtitle, cta_label, cta_href, bg_image_url, overlay_opacity }
-- 'announcement_bar'  : { text, bg_color, text_color, link_href, link_label, is_dismissible }
-- 'text_rich'         : { heading, body_html, alignment }  — supports inline HTML
-- 'image_full'        : { image_url, alt_text, link_href, caption }
-- 'image_grid'        : { images: [{ url, alt, href }], columns }
-- 'cta_banner'        : { heading, subtext, cta_label, cta_href, bg_color, accent_color }
-- 'countdown_timer'   : { heading, target_datetime, cta_label, cta_href }
-- 'product_carousel'  : { heading, product_ids: [], or tag: string }  — fetched at render time
-- 'collection_grid'   : { heading, collection_slugs: [] }
-- 'video_embed'       : { url, aspect_ratio, autoplay, muted, loop }
-- 'spacer'            : { height_px }
-- 'divider'           : { style: 'solid'|'dashed'|'dotted', color }

ALTER TABLE page_blocks ENABLE ROW LEVEL SECURITY;

-- Ops roles can read all page blocks
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Ops roles read page_blocks' AND tablename = 'page_blocks'
  ) THEN
    CREATE POLICY "Ops roles read page_blocks" ON page_blocks FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
            AND p.role IN ('super_admin', 'ops_admin', 'growth', 'campaign_manager')
        )
      );
  END IF;
END $$;

-- Ops admins and above can write page blocks
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Ops admins write page_blocks' AND tablename = 'page_blocks'
  ) THEN
    CREATE POLICY "Ops admins write page_blocks" ON page_blocks FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
            AND p.role IN ('super_admin', 'ops_admin')
        )
      );
  END IF;
END $$;

-- Storefront can read visible blocks for any site (public pages)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public read visible page_blocks' AND tablename = 'page_blocks'
  ) THEN
    CREATE POLICY "Public read visible page_blocks" ON page_blocks FOR SELECT
      USING (is_visible = true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_page_blocks_site_slug
  ON page_blocks(site_id, page_slug, block_order);

CREATE INDEX IF NOT EXISTS idx_page_blocks_site_visible
  ON page_blocks(site_id, page_slug) WHERE is_visible = true;

-- ─── 2. Auto-update updated_at ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION touch_page_block_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_page_blocks_updated_at ON page_blocks;
CREATE TRIGGER trg_page_blocks_updated_at
  BEFORE UPDATE ON page_blocks
  FOR EACH ROW EXECUTE FUNCTION touch_page_block_updated_at();

-- ─── 3. Reorder helper function ──────────────────────────────────────────────
-- Call this after drag-and-drop reorder to compact block_order values.

CREATE OR REPLACE FUNCTION reorder_page_blocks(
  p_site_id   UUID,
  p_page_slug TEXT,
  p_block_ids UUID[]   -- ordered array of block IDs in new order
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_id UUID;
  v_pos INTEGER := 0;
BEGIN
  FOREACH v_id IN ARRAY p_block_ids LOOP
    UPDATE page_blocks
    SET block_order = v_pos
    WHERE id = v_id AND site_id = p_site_id AND page_slug = p_page_slug;
    v_pos := v_pos + 1;
  END LOOP;
END;
$$;

-- ─── 4. Seed: default Streetplayr home page blocks ───────────────────────────
-- Gives admin a starting point. All blocks visible by default.

DO $$
DECLARE
  v_site_id UUID;
BEGIN
  SELECT id INTO v_site_id FROM sites WHERE slug = 'streetplayr';

  IF v_site_id IS NOT NULL THEN
    -- Announcement bar
    INSERT INTO page_blocks (site_id, page_slug, block_type, content, block_order)
    VALUES (
      v_site_id, 'home', 'announcement_bar',
      '{"text": "Free shipping on orders above ₹999", "bg_color": "#F5A800", "text_color": "#000000", "is_dismissible": true}',
      0
    ) ON CONFLICT (site_id, page_slug, block_order) DO NOTHING;

    -- Hero
    INSERT INTO page_blocks (site_id, page_slug, block_type, content, block_order)
    VALUES (
      v_site_id, 'home', 'hero',
      '{"title": "Enter The Play", "subtitle": "Streetwear for the ones who move different.", "cta_label": "Shop Now", "cta_href": "/shop", "overlay_opacity": 0.4}',
      1
    ) ON CONFLICT (site_id, page_slug, block_order) DO NOTHING;

    -- Product carousel
    INSERT INTO page_blocks (site_id, page_slug, block_type, content, block_order)
    VALUES (
      v_site_id, 'home', 'product_carousel',
      '{"heading": "New Drops", "tag": "new-drop"}',
      2
    ) ON CONFLICT (site_id, page_slug, block_order) DO NOTHING;

    -- CTA banner
    INSERT INTO page_blocks (site_id, page_slug, block_type, content, block_order)
    VALUES (
      v_site_id, 'home', 'cta_banner',
      '{"heading": "Earn NECTAR Points", "subtext": "Every purchase earns you points. Redeem for discounts.", "cta_label": "Learn More", "cta_href": "/profile/rewards"}',
      3
    ) ON CONFLICT (site_id, page_slug, block_order) DO NOTHING;
  END IF;
END;
$$;
