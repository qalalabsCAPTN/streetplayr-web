-- ============================================================================
-- StreetPlayR — OpsOS Completion: RLS Hardening, Realtime, Collections
-- ============================================================================
-- Completes the Operations Core infrastructure:
--   1. RLS: ops-role write policies for products/variants
--   2. RLS: ops-role read policies for orders/inventory
--   3. Add status text column to products for ops lifecycle
--   4. Collections table for merchandise grouping
--   5. Enable realtime replication for storefront tables
--   6. Storage bucket definitions
-- ============================================================================

-- ─── 1. Add status column to products for OpsOS lifecycle ──────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- ─── 2. Collections table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url   TEXT,
  is_active   BOOLEAN DEFAULT true,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collections publicly readable"
  ON collections FOR SELECT
  USING (true);

CREATE POLICY "Ops roles can manage collections"
  ON collections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin', 'editorial')
  ));

CREATE INDEX idx_collections_active ON collections(is_active) WHERE is_active = true;

-- Product-to-collection junction table
CREATE TABLE IF NOT EXISTS collection_products (
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (collection_id, product_id)
);

ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collection products publicly readable"
  ON collection_products FOR SELECT
  USING (true);

CREATE POLICY "Ops roles can manage collection products"
  ON collection_products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin', 'editorial')
  ));

CREATE INDEX idx_col_prod_product ON collection_products(product_id);

-- ─── 3. RLS: Ops write policies for products ───────────────────────────────

CREATE POLICY "Ops roles can insert products"
  ON products FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin', 'editorial')
  ));

CREATE POLICY "Ops roles can update products"
  ON products FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin', 'editorial')
  ));

CREATE POLICY "Ops roles can delete products"
  ON products FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin')
  ));

-- ─── 4. RLS: Ops write policies for variants ───────────────────────────────

CREATE POLICY "Ops roles can insert variants"
  ON product_variants FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin', 'editorial')
  ));

CREATE POLICY "Ops roles can update variants"
  ON product_variants FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin', 'editorial')
  ));

CREATE POLICY "Ops roles can delete variants"
  ON product_variants FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin')
  ));

-- ─── 5. RLS: Ops read policies for orders ──────────────────────────────────

CREATE POLICY "Ops roles can read all orders"
  ON orders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN (
      'super_admin', 'ops_admin', 'fulfillment', 'support', 'viewer'
    )
  ));

CREATE POLICY "Ops roles can update orders"
  ON orders FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin', 'fulfillment')
  ));

-- ─── 6. RLS: Ops read policies for inventory_reservations ──────────────────

CREATE POLICY "Ops roles can read all reservations"
  ON inventory_reservations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN (
      'super_admin', 'ops_admin', 'fulfillment', 'viewer'
    )
  ));

-- ─── 7. Enable realtime replication for storefront tables ───────────────────
-- Tables added to the supabase_realtime publication are pushed to all
-- clients subscribed via Supabase JS Realtime library.
-- Uses manual membership check instead of IF NOT EXISTS (PG <15 compat).

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['products', 'product_variants', 'orders', 'inventory_reservations', 'operational_events']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
    END IF;
  END LOOP;
END;
$$;

-- ─── 8. Storage bucket creation instructions ───────────────────────────────
-- Run in Supabase SQL editor:
--
-- INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES
--   ('product-media', 'product-media', true, 5242880),
--   ('collection-media', 'collection-media', true, 5242880),
--   ('editorial-media', 'editorial-media', true, 10485760),
--   ('avatars', 'avatars', true, 2097152);
--
-- CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (true);
-- CREATE POLICY "Ops roles can upload" ON storage.objects FOR INSERT WITH CHECK (
--   EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin', 'editorial'))
-- );
-- CREATE POLICY "Ops roles can update" ON storage.objects FOR UPDATE USING (
--   EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin', 'editorial'))
-- );
