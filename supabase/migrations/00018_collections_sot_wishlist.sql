-- ============================================================================
-- StreetPlayR — Collection Source of Truth + Wishlist adapter table
-- ============================================================================
-- 1. Seed canonical storefront collections (slug = URL ?category=)
-- 2. Ensure collection_products is the membership SoT
-- 3. Optional wishlists table for multi-device sync (frontend adapter ready)
-- ============================================================================

-- Canonical collections (name column from 00006; title from 00016 if present)
INSERT INTO public.collections (id, name, slug, description, is_active, sort_order)
VALUES
  ('a1000000-0000-4000-8000-000000000001', 'Latest Drop', 'latest-drop', 'Current drop curation', true, 0),
  ('a1000000-0000-4000-8000-000000000002', 'Short Sleeve T-Shirts', 'tees', 'Short sleeve tees', true, 1),
  ('a1000000-0000-4000-8000-000000000003', 'Long Sleeve T-Shirts', 'long-sleeve', 'Long sleeve tees', true, 2),
  ('a1000000-0000-4000-8000-000000000004', 'Tanks', 'tanks', 'Tank tops', true, 3),
  ('a1000000-0000-4000-8000-000000000005', 'Sweatpants', 'pants', 'Bottoms / sweatpants', true, 4),
  ('a1000000-0000-4000-8000-000000000006', 'Hoodies', 'hoodies', 'Hoodies (coming soon)', true, 5)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- If schema uses title instead of name (00016 variant), keep title in sync when column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collections' AND column_name = 'title'
  ) THEN
    UPDATE public.collections SET title = name WHERE title IS DISTINCT FROM name;
  END IF;
END $$;

-- Link products by slug → collection when products already exist in DB.
-- Safe no-op when product slug missing. Ops can edit membership in admin later.
INSERT INTO public.collection_products (collection_id, product_id, sort_order)
SELECT c.id, p.id, 0
FROM public.products p
JOIN public.collections c ON c.slug = 'tees'
WHERE p.slug IN ('ctt-waffle', 'black-warrior', 'inspired', 'warrior-bob')
  AND p.status = 'active'
ON CONFLICT DO NOTHING;

INSERT INTO public.collection_products (collection_id, product_id, sort_order)
SELECT c.id, p.id, 0
FROM public.products p
JOIN public.collections c ON c.slug = 'long-sleeve'
WHERE p.slug IN ('stick-no-bills')
  AND p.status = 'active'
ON CONFLICT DO NOTHING;

INSERT INTO public.collection_products (collection_id, product_id, sort_order)
SELECT c.id, p.id, 0
FROM public.products p
JOIN public.collections c ON c.slug = 'tanks'
WHERE p.slug IN ('star-tank-dark')
  AND p.status = 'active'
ON CONFLICT DO NOTHING;

INSERT INTO public.collection_products (collection_id, product_id, sort_order)
SELECT c.id, p.id, 0
FROM public.products p
JOIN public.collections c ON c.slug = 'pants'
WHERE p.slug IN ('carpenter-grey')
  AND p.status = 'active'
ON CONFLICT DO NOTHING;

INSERT INTO public.collection_products (collection_id, product_id, sort_order)
SELECT c.id, p.id, 0
FROM public.products p
JOIN public.collections c ON c.slug = 'latest-drop'
WHERE p.slug IN ('ctt-waffle', 'black-warrior', 'inspired', 'stick-no-bills')
  AND p.status = 'active'
ON CONFLICT DO NOTHING;

-- Wishlist table (backend sync). Frontend uses adapter; localStorage offline fallback.
CREATE TABLE IF NOT EXISTS public.wishlists (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own wishlist" ON public.wishlists;
CREATE POLICY "Users read own wishlist"
  ON public.wishlists FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own wishlist" ON public.wishlists;
CREATE POLICY "Users insert own wishlist"
  ON public.wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own wishlist" ON public.wishlists;
CREATE POLICY "Users delete own wishlist"
  ON public.wishlists FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product ON public.wishlists(product_id);
