-- ============================================================================
-- Restore public (anon) catalog reads + ensure collection membership seed.
-- Prevents storefront blank shelves when hardening migrations drop SELECT policies.
-- Safe to re-run (IF NOT EXISTS / ON CONFLICT).
-- ============================================================================

-- Products: public SELECT (storefront + anon key)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products'
  ) THEN
    ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

    -- Drop legacy broad policy, recreate status/active-scoped when possible
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'products'
        AND policyname = 'Products are publicly readable'
    ) THEN
      DROP POLICY "Products are publicly readable" ON public.products;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'status'
    ) THEN
      CREATE POLICY "Products are publicly readable"
        ON public.products FOR SELECT
        USING (status = 'active');
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'is_active'
    ) THEN
      CREATE POLICY "Products are publicly readable"
        ON public.products FOR SELECT
        USING (is_active IS TRUE);
    ELSE
      CREATE POLICY "Products are publicly readable"
        ON public.products FOR SELECT
        USING (true);
    END IF;
  END IF;
END $$;

-- Variants: public SELECT (prices/sizes on cards + PDP)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'product_variants'
  ) THEN
    ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'product_variants'
        AND policyname = 'Variants are publicly readable'
    ) THEN
      CREATE POLICY "Variants are publicly readable"
        ON public.product_variants FOR SELECT
        USING (true);
    END IF;
  END IF;
END $$;

-- Collections + junction: public SELECT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'collections'
  ) THEN
    ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'collections'
        AND policyname = 'Collections publicly readable'
    ) THEN
      CREATE POLICY "Collections publicly readable"
        ON public.collections FOR SELECT
        USING (true);
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'collection_products'
  ) THEN
    ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'collection_products'
        AND policyname = 'Collection products publicly readable'
    ) THEN
      CREATE POLICY "Collection products publicly readable"
        ON public.collection_products FOR SELECT
        USING (true);
    END IF;
  END IF;
END $$;

-- Re-seed canonical collections (no-op if already present)
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

-- Keep title in sync when 00016-style schema uses title instead of / in addition to name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'collections' AND column_name = 'title'
  ) THEN
    UPDATE public.collections SET title = name WHERE title IS DISTINCT FROM name;
  END IF;
END $$;

-- Link known product slugs → collections (safe when products missing)
INSERT INTO public.collection_products (collection_id, product_id, sort_order)
SELECT c.id, p.id, 0
FROM public.products p
JOIN public.collections c ON c.slug = 'tees'
WHERE p.slug IN ('ctt-waffle', 'black-warrior', 'inspired', 'warrior-bob', 'warrior-tee')
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
WHERE p.slug IN ('ctt-waffle', 'black-warrior', 'inspired', 'stick-no-bills', 'warrior-tee')
  AND p.status = 'active'
ON CONFLICT DO NOTHING;
