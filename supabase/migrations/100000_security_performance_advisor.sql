-- ============================================================================
-- 100000_security_performance_advisor.sql
-- Live-DB safe. Idempotent. Closes Security Advisor WARNs.
-- Remote schema differs from early migrations — every object is existence-guarded.
-- ============================================================================

-- ─── 0. Helpers ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_ops_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role::text IN (
        'super_admin', 'ops_admin', 'fulfillment',
        'editorial', 'support', 'viewer'
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role::text = 'super_admin'
  );
$$;

-- ─── 1. Pin search_path on flagged functions ─────────────────────────────────
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'update_user_streak',
        'set_updated_at',
        'get_site_id',
        'touch_page_block_updated_at',
        'reorder_page_blocks',
        'update_updated_at',
        'publish_page_blocks',
        'handle_new_user',
        'reserve_inventory',
        'release_expired_reservations',
        'initiate_checkout',
        'expire_stale_carts',
        'recalculate_cart',
        'rls_auto_enable',
        'protect_profile_privileged_columns'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = %L', r.sig, '');
  END LOOP;
END $$;

-- Harden publish_page_blocks body + authz (always create — may be missing if 00012 never applied)
CREATE OR REPLACE FUNCTION public.publish_page_blocks(p_site_id UUID, p_page_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' AND NOT public.is_ops_role() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.page_blocks
  SET published_content = content
  WHERE site_id = p_site_id AND page_slug = p_page_slug;
END;
$$;

-- set_updated_at rewrite with pinned path (Advisor named this specifically)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─── 2. REVOKE SECURITY DEFINER callable via PostgREST (anon/authenticated) ──
-- App uses service-role admin client for reserve_inventory / release_expired.
-- Triggers still fire for handle_new_user (owner rights).
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', r.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', r.sig);
    BEGIN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
    EXCEPTION WHEN undefined_object THEN
      NULL;
    END;
    BEGIN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO postgres', r.sig);
    EXCEPTION WHEN undefined_object THEN
      NULL;
    END;
  END LOOP;
END $$;

-- Ops helpers are INVOKER — allow authenticated (policy evaluation)
GRANT EXECUTE ON FUNCTION public.is_ops_role() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, anon, service_role;

-- CMS publish RPC: service_role only (app uses server action + admin client)
GRANT EXECUTE ON FUNCTION public.publish_page_blocks(UUID, TEXT) TO service_role;

-- ─── 3. operational_events: kill unrestricted INSERT ─────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='operational_events') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='operational_events' AND policyname='Allow insert operational events') THEN
      DROP POLICY "Allow insert operational events" ON public.operational_events;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='operational_events' AND policyname='Authenticated users can insert events') THEN
      DROP POLICY "Authenticated users can insert events" ON public.operational_events;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='operational_events' AND policyname='Service role inserts operational events') THEN
      CREATE POLICY "Service role inserts operational events"
        ON public.operational_events FOR INSERT
        WITH CHECK ((SELECT auth.role()) = 'service_role');
    END IF;
  END IF;
END $$;

-- ─── 4. Drop dangerous client INSERT policies (if present) ───────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inventory_reservations' AND policyname='Users can insert own reservations') THEN
    DROP POLICY "Users can insert own reservations" ON public.inventory_reservations;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reward_redemptions' AND policyname='Users can insert own reward redemptions') THEN
    DROP POLICY "Users can insert own reward redemptions" ON public.reward_redemptions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='orders' AND policyname='Users can insert own orders') THEN
    DROP POLICY "Users can insert own orders" ON public.orders;
  END IF;
END $$;

-- ─── 5. Deduplicate wallet SELECT policy names (if both exist) ───────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wallet_transactions' AND policyname='Users can view own wallet transactions')
     AND EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wallet_transactions' AND policyname='Users can read own wallet transactions') THEN
    DROP POLICY "Users can view own wallet transactions" ON public.wallet_transactions;
  END IF;
END $$;

-- Ops read wallet_transactions (guarded)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='wallet_transactions') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wallet_transactions' AND policyname='Ops can read all wallet transactions') THEN
      CREATE POLICY "Ops can read all wallet transactions"
        ON public.wallet_transactions FOR SELECT
        USING (public.is_ops_role());
    END IF;
  END IF;
END $$;

-- Ops read wallet_events only if table exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='wallet_events') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wallet_events' AND policyname='Ops can read all wallet events') THEN
      CREATE POLICY "Ops can read all wallet events"
        ON public.wallet_events FOR SELECT
        USING (public.is_ops_role());
    END IF;
  END IF;
END $$;

-- ─── 6. Drop duplicate product_variants indexes ──────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_variants_product')
     AND EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_product_variants_product') THEN
    DROP INDEX IF EXISTS public.idx_variants_product;
  END IF;
END $$;

-- ─── 7. Ensure RLS enabled on all public tables ──────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- ─── 8. FK / query indexes (guarded by column existence) ─────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='order_items' AND column_name='product_id') THEN
    CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='order_items' AND column_name='variant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_order_items_variant ON public.order_items(variant_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inventory_reservations' AND column_name='product_id') THEN
    CREATE INDEX IF NOT EXISTS idx_reservations_product ON public.inventory_reservations(product_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='role_grants' AND column_name='granted_by') THEN
    CREATE INDEX IF NOT EXISTS idx_role_grants_granted_by ON public.role_grants(granted_by);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='referral_claims' AND column_name='referrer_id') THEN
    CREATE INDEX IF NOT EXISTS idx_referral_claims_referrer ON public.referral_claims(referrer_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='referral_claims' AND column_name='referred_id') THEN
    CREATE INDEX IF NOT EXISTS idx_referral_claims_referred ON public.referral_claims(referred_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='referral_edges' AND column_name='referral_id') THEN
    CREATE INDEX IF NOT EXISTS idx_referral_edges_referral ON public.referral_edges(referral_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='manual_wallet_adjustments' AND column_name='ops_user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_manual_adj_ops_user ON public.manual_wallet_adjustments(ops_user_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='page_blocks' AND column_name='created_by') THEN
    CREATE INDEX IF NOT EXISTS idx_page_blocks_created_by ON public.page_blocks(created_by);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='site_access' AND column_name='user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_site_access_user ON public.site_access(user_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='active_site_id') THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_active_site ON public.profiles(active_site_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inventory' AND column_name='variant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_inventory_variant ON public.inventory(variant_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers' AND column_name='email') THEN
    CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='wallet_accounts' AND column_name='user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_wallet_accounts_user ON public.wallet_accounts(user_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='nectar_wallet_transactions' AND column_name='user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_nectar_wallet_tx_user ON public.nectar_wallet_transactions(user_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reward_executions' AND column_name='user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_reward_executions_user ON public.reward_executions(user_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='carts' AND column_name='customer_id') THEN
    CREATE INDEX IF NOT EXISTS idx_carts_customer ON public.carts(customer_id);
  END IF;
END $$;

-- ─── 9. Profile privilege lock trigger (if missing) ──────────────────────────
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF coalesce(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role := OLD.role;
  END IF;
  BEGIN
    IF NEW.sprr_balance IS DISTINCT FROM OLD.sprr_balance THEN
      NEW.sprr_balance := OLD.sprr_balance;
    END IF;
  EXCEPTION WHEN undefined_column THEN
    NULL;
  END;
  BEGIN
    IF NEW.xp IS DISTINCT FROM OLD.xp THEN
      NEW.xp := OLD.xp;
    END IF;
  EXCEPTION WHEN undefined_column THEN
    NULL;
  END;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') THEN
    DROP TRIGGER IF EXISTS trg_protect_profile_privileged ON public.profiles;
    CREATE TRIGGER trg_protect_profile_privileged
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.protect_profile_privileged_columns();
  END IF;
END $$;

-- Trigger function must not be RPC-callable
REVOKE ALL ON FUNCTION public.protect_profile_privileged_columns() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_profile_privileged_columns() FROM anon;
REVOKE ALL ON FUNCTION public.protect_profile_privileged_columns() FROM authenticated;

-- Explicit service-only policies for RLS-on / zero-policy tables (advisor rls_enabled_no_policy)
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

-- Drop duplicate indexes if both exist (advisor duplicate_index)
DROP INDEX IF EXISTS public.idx_variants_product;
DROP INDEX IF EXISTS public.idx_nwt_user_id;
DROP INDEX IF EXISTS public.idx_re_user_id;
DROP INDEX IF EXISTS public.idx_wallet_accounts_user_id;

-- Migration history recorded by supabase db push / manual insert after success.
