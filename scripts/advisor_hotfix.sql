-- Hotfix after 100000 apply (live)

-- Trigger function must not be RPC-callable
REVOKE ALL ON FUNCTION public.protect_profile_privileged_columns() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_profile_privileged_columns() FROM anon;
REVOKE ALL ON FUNCTION public.protect_profile_privileged_columns() FROM authenticated;

-- Explicit service-only policies for RLS-on / zero-policy tables
DO $$
DECLARE
  t text;
  pol text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'activity_events','brand_memberships','customer_addresses','events','media_assets',
    'nectar_wallet_transactions','order_events','platforms','product_categories',
    'reward_executions','reward_rules','wallet_accounts','memberships'
  ]
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t)
       AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t) THEN
      pol := 'service_role_only_' || t;
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO public USING ((SELECT auth.role()) = %L) WITH CHECK ((SELECT auth.role()) = %L)',
        pol, t, 'service_role', 'service_role'
      );
    END IF;
  END LOOP;
END $$;

-- Drop duplicate indexes if both exist (advisor)
DROP INDEX IF EXISTS public.idx_variants_product;
