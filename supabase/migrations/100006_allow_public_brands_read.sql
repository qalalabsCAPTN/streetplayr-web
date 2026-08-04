-- ============================================================================
-- Enable public read access for the brands table.
-- Resolves storefront startup/catalog failures when dynamic brand lookup
-- is executed under the public anonymous client context.
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'brands'
  ) THEN
    ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'brands'
        AND policyname = 'Brands are publicly readable'
    ) THEN
      CREATE POLICY "Brands are publicly readable"
        ON public.brands FOR SELECT
        USING (true);
    END IF;
  END IF;
END $$;
