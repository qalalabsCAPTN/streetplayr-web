-- Phase 3.2 access matrix lock: orders writes are service/orchestration only.
-- Checkout / Easebuzz / Stripe already use createAdminClient().

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders'
      AND policyname = 'Users can insert orders in their org'
  ) THEN
    DROP POLICY "Users can insert orders in their org" ON public.orders;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders'
      AND policyname = 'Users can update orders in their org'
  ) THEN
    DROP POLICY "Users can update orders in their org" ON public.orders;
  END IF;
END $$;

-- Keep SELECT for org members if present; add own-customer SELECT if missing.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='orders' AND column_name='customer_id')
     AND EXISTS (SELECT 1 FROM information_schema.tables
                 WHERE table_schema='public' AND table_name='customers')
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname='public' AND tablename='orders'
         AND policyname = 'Users can read own customer orders'
     ) THEN
    CREATE POLICY "Users can read own customer orders"
      ON public.orders FOR SELECT
      USING (
        customer_id IN (
          SELECT c.id FROM public.customers c
          WHERE c.user_id = (SELECT auth.uid())
             OR c.email = (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())
        )
      );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- customers.user_id / email shape may differ; org SELECT policy remains
  RAISE NOTICE 'own-customer orders policy skipped: %', SQLERRM;
END $$;
