-- Phase 3.2/3.4 — restore wishlist RLS; cart_items only if user_id column exists.
-- NOTE: staging cart_items is CRM-shaped (cart_id/variant_id), NOT the
-- streetplayr user_id schema from 00001. Do not invent user_id policies there.

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='cart_items' AND column_name='user_id'
  ) THEN
    ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cart_items'
        AND policyname='Users can read own cart'
    ) THEN
      CREATE POLICY "Users can read own cart"
        ON public.cart_items FOR SELECT
        USING ((SELECT auth.uid()) = user_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cart_items'
        AND policyname='Users can insert own cart'
    ) THEN
      CREATE POLICY "Users can insert own cart"
        ON public.cart_items FOR INSERT
        WITH CHECK ((SELECT auth.uid()) = user_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cart_items'
        AND policyname='Users can update own cart'
    ) THEN
      CREATE POLICY "Users can update own cart"
        ON public.cart_items FOR UPDATE
        USING ((SELECT auth.uid()) = user_id)
        WITH CHECK ((SELECT auth.uid()) = user_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cart_items'
        AND policyname='Users can delete own cart'
    ) THEN
      CREATE POLICY "Users can delete own cart"
        ON public.cart_items FOR DELETE
        USING ((SELECT auth.uid()) = user_id);
    END IF;
  ELSE
    RAISE NOTICE 'cart_items has no user_id (CRM schema) — skip own-row cart policies';
  END IF;
END $$;

-- wishlists (streetplayr multi-device sync)
CREATE TABLE IF NOT EXISTS public.wishlists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wishlists'
      AND policyname='Users read own wishlist'
  ) THEN
    CREATE POLICY "Users read own wishlist"
      ON public.wishlists FOR SELECT
      USING ((SELECT auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wishlists'
      AND policyname='Users insert own wishlist'
  ) THEN
    CREATE POLICY "Users insert own wishlist"
      ON public.wishlists FOR INSERT
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wishlists'
      AND policyname='Users delete own wishlist'
  ) THEN
    CREATE POLICY "Users delete own wishlist"
      ON public.wishlists FOR DELETE
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);
