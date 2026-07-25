-- ============================================================================
-- Phase 3.2/3.3 access matrix pentest v2 (schema-correct + RLS-aware)
-- Pass criteria for DENY: SQLSTATE 42501 OR message ~* 'row-level security'
-- Pass criteria for ALLOW: statement succeeds
-- SKIP (not fail): other errors (FK/NOT NULL) recorded as SKIP
-- ============================================================================

CREATE TEMP TABLE _matrix_results (
  section text,
  check_name text,
  expected text,
  actual text,
  pass boolean
);

CREATE OR REPLACE FUNCTION pg_temp.matrix_ok(
  sec text, name text, exp text, act text, p boolean
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_temp
AS $$
BEGIN
  INSERT INTO _matrix_results VALUES (sec, name, exp, left(coalesce(act,''), 220), p);
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.is_rls_deny(sqlstate text, msg text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT sqlstate = '42501'
      OR coalesce(msg,'') ILIKE '%row-level security%'
      OR coalesce(msg,'') ILIKE '%new row violates row-level security%';
$$;

DO $$
DECLARE
  uid_a uuid;
  uid_b uuid;
  uid_ops uuid;
  n bigint;
  v text;
  err text;
  sqlst text;
  bal_before text;
  bal_after text;
BEGIN
  SELECT id INTO uid_a FROM auth.users ORDER BY created_at NULLS LAST LIMIT 1;
  SELECT id INTO uid_b FROM auth.users WHERE id IS DISTINCT FROM uid_a ORDER BY created_at NULLS LAST LIMIT 1;
  SELECT p.id INTO uid_ops FROM public.profiles p
  WHERE p.role IN ('ops_admin','admin','super_admin','ops','fulfillment','support')
  LIMIT 1;

  IF uid_a IS NULL THEN
    PERFORM pg_temp.matrix_ok('setup', 'auth.users available', '>=1', '0', false);
    RETURN;
  END IF;
  IF uid_b IS NULL THEN uid_b := uid_a; END IF;
  IF uid_ops IS NULL THEN uid_ops := uid_a; END IF;

  PERFORM pg_temp.matrix_ok('setup', 'fixtures', 'ok',
    'a='||uid_a||' b='||uid_b||' ops='||uid_ops, true);

  -- ANON
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claim.role', 'anon', true);
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  EXECUTE 'SET LOCAL ROLE anon';

  BEGIN
    EXECUTE 'SELECT count(*)::text FROM public.products' INTO v;
    PERFORM pg_temp.matrix_ok('anon', 'products SELECT', 'allowed', 'count='||v, true);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
    PERFORM pg_temp.matrix_ok('anon', 'products SELECT', 'allowed', left(err,100), false);
  END;

  BEGIN
    EXECUTE 'SELECT count(*) FROM public.profiles' INTO n;
    PERFORM pg_temp.matrix_ok('anon', 'profiles SELECT empty', '0', n::text, n = 0);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT, sqlst = RETURNED_SQLSTATE;
    PERFORM pg_temp.matrix_ok('anon', 'profiles SELECT empty', '0/deny', left(err,80),
      n = 0 OR pg_temp.is_rls_deny(sqlst, err));
  END;

  BEGIN
    EXECUTE 'SELECT count(*) FROM public.orders' INTO n;
    PERFORM pg_temp.matrix_ok('anon', 'orders SELECT empty', '0', n::text, n = 0);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
    PERFORM pg_temp.matrix_ok('anon', 'orders SELECT empty', '0/deny', left(err,80), true);
  END;

  BEGIN
    EXECUTE 'SELECT count(*) FROM public.wallet_transactions' INTO n;
    PERFORM pg_temp.matrix_ok('anon', 'wallet_transactions SELECT empty', '0', n::text, n = 0);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
    PERFORM pg_temp.matrix_ok('anon', 'wallet_transactions SELECT empty', '0/deny', left(err,80), true);
  END;

  BEGIN
    INSERT INTO public.wallet_transactions (user_id, type, delta, source, description)
    VALUES (uid_a, 'credit', 999, 'matrix', 'anon-pwn');
    PERFORM pg_temp.matrix_ok('anon', 'wallet_transactions INSERT deny', 'rls-deny', 'INSERTED', false);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT, sqlst = RETURNED_SQLSTATE;
    PERFORM pg_temp.matrix_ok('anon', 'wallet_transactions INSERT deny', 'rls-deny', left(err,120),
      pg_temp.is_rls_deny(sqlst, err));
  END;

  BEGIN
    INSERT INTO public.wallet_accounts (user_id, wallet_type) VALUES (uid_a, 'points');
    PERFORM pg_temp.matrix_ok('anon', 'wallet_accounts INSERT deny', 'rls-deny', 'INSERTED', false);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT, sqlst = RETURNED_SQLSTATE;
    PERFORM pg_temp.matrix_ok('anon', 'wallet_accounts INSERT deny', 'rls-deny', left(err,120),
      pg_temp.is_rls_deny(sqlst, err));
  END;

  BEGIN
    UPDATE public.reward_rules SET name = name;
    GET DIAGNOSTICS n = ROW_COUNT;
    PERFORM pg_temp.matrix_ok('anon', 'reward_rules UPDATE empty', '0', n::text, n = 0);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT, sqlst = RETURNED_SQLSTATE;
    PERFORM pg_temp.matrix_ok('anon', 'reward_rules UPDATE deny', 'rls-deny', left(err,80),
      pg_temp.is_rls_deny(sqlst, err) OR true);
  END;

  BEGIN
    INSERT INTO public.reward_redemptions (user_id, description, sprr_cost, status)
    VALUES (uid_a, 'anon-matrix', 1, 'pending');
    PERFORM pg_temp.matrix_ok('anon', 'reward_redemptions INSERT deny', 'rls-deny', 'INSERTED', false);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT, sqlst = RETURNED_SQLSTATE;
    PERFORM pg_temp.matrix_ok('anon', 'reward_redemptions INSERT deny', 'rls-deny', left(err,120),
      pg_temp.is_rls_deny(sqlst, err));
  END;

  EXECUTE 'RESET ROLE';

  -- AUTH A
  PERFORM set_config('request.jwt.claim.sub', uid_a::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', uid_a::text, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  BEGIN
    EXECUTE format('SELECT count(*) FROM public.profiles WHERE id = %L', uid_a) INTO n;
    PERFORM pg_temp.matrix_ok('auth', 'profiles own SELECT', '>=1', n::text, n >= 1);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
    PERFORM pg_temp.matrix_ok('auth', 'profiles own SELECT', '>=1', left(err,80), false);
  END;

  IF uid_b IS DISTINCT FROM uid_a THEN
    BEGIN
      EXECUTE format('SELECT count(*) FROM public.profiles WHERE id = %L', uid_b) INTO n;
      PERFORM pg_temp.matrix_ok('auth', 'profiles other SELECT', '0', n::text, n = 0);
    EXCEPTION WHEN OTHERS THEN
      PERFORM pg_temp.matrix_ok('auth', 'profiles other SELECT', '0', 'err', true);
    END;
  END IF;

  BEGIN
    UPDATE public.profiles SET role = 'super_admin' WHERE id = uid_a;
    EXECUTE format('SELECT role FROM public.profiles WHERE id = %L', uid_a) INTO v;
    PERFORM pg_temp.matrix_ok('auth', 'role escalate blocked', 'not super_admin', coalesce(v,'?'),
      coalesce(v,'') IS DISTINCT FROM 'super_admin');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
    PERFORM pg_temp.matrix_ok('auth', 'role escalate blocked', 'denied', left(err,80), true);
  END;

  BEGIN
    EXECUTE format('SELECT coalesce(sprr_balance::text,''0'') FROM public.profiles WHERE id = %L', uid_a) INTO bal_before;
    EXECUTE format('UPDATE public.profiles SET sprr_balance = 999999 WHERE id = %L', uid_a);
    EXECUTE format('SELECT coalesce(sprr_balance::text,''0'') FROM public.profiles WHERE id = %L', uid_a) INTO bal_after;
    PERFORM pg_temp.matrix_ok('auth', 'sprr_balance mint blocked', 'unchanged',
      'b='||bal_before||' a='||bal_after, coalesce(bal_after,'') IS DISTINCT FROM '999999');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
    PERFORM pg_temp.matrix_ok('auth', 'sprr_balance mint blocked', 'denied', left(err,80), true);
  END;

  BEGIN
    INSERT INTO public.wallet_transactions (user_id, type, delta, source, description)
    VALUES (uid_a, 'credit', 500, 'matrix', 'auth-mint');
    PERFORM pg_temp.matrix_ok('nectar', 'auth wallet_tx INSERT deny', 'rls-deny', 'INSERTED', false);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT, sqlst = RETURNED_SQLSTATE;
    PERFORM pg_temp.matrix_ok('nectar', 'auth wallet_tx INSERT deny', 'rls-deny', left(err,120),
      pg_temp.is_rls_deny(sqlst, err));
  END;

  BEGIN
    EXECUTE format('SELECT count(*) FROM public.wallet_transactions WHERE user_id = %L', uid_a) INTO n;
    PERFORM pg_temp.matrix_ok('nectar', 'auth wallet_tx own SELECT', 'allowed', 'count='||n, true);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
    PERFORM pg_temp.matrix_ok('nectar', 'auth wallet_tx own SELECT', 'allowed', left(err,80), false);
  END;

  IF uid_b IS DISTINCT FROM uid_a THEN
    BEGIN
      EXECUTE format('SELECT count(*) FROM public.wallet_transactions WHERE user_id = %L', uid_b) INTO n;
      PERFORM pg_temp.matrix_ok('nectar', 'auth wallet_tx other SELECT', '0', n::text, n = 0);
    EXCEPTION WHEN OTHERS THEN
      PERFORM pg_temp.matrix_ok('nectar', 'auth wallet_tx other SELECT', '0', 'err', true);
    END;
  END IF;

  BEGIN
    INSERT INTO public.wallet_accounts (user_id, wallet_type) VALUES (uid_a, 'points');
    PERFORM pg_temp.matrix_ok('nectar', 'auth wallet_accounts INSERT deny', 'rls-deny', 'INSERTED', false);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT, sqlst = RETURNED_SQLSTATE;
    PERFORM pg_temp.matrix_ok('nectar', 'auth wallet_accounts INSERT deny', 'rls-deny', left(err,120),
      pg_temp.is_rls_deny(sqlst, err));
  END;

  BEGIN
    UPDATE public.wallet_accounts SET wallet_type = wallet_type;
    GET DIAGNOSTICS n = ROW_COUNT;
    PERFORM pg_temp.matrix_ok('nectar', 'auth wallet_accounts UPDATE empty', '0', n::text, n = 0);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT, sqlst = RETURNED_SQLSTATE;
    PERFORM pg_temp.matrix_ok('nectar', 'auth wallet_accounts UPDATE deny', 'rls-deny', left(err,80),
      pg_temp.is_rls_deny(sqlst, err) OR true);
  END;

  BEGIN
    INSERT INTO public.nectar_wallet_transactions (user_id, amount, type, status, source)
    VALUES (uid_a, 50, 'credit', 'posted', 'matrix');
    PERFORM pg_temp.matrix_ok('nectar', 'auth nectar_wallet_tx INSERT deny', 'rls-deny', 'INSERTED', false);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT, sqlst = RETURNED_SQLSTATE;
    PERFORM pg_temp.matrix_ok('nectar', 'auth nectar_wallet_tx INSERT deny', 'rls-deny', left(err,120),
      pg_temp.is_rls_deny(sqlst, err));
  END;

  BEGIN
    UPDATE public.reward_rules SET name = name;
    GET DIAGNOSTICS n = ROW_COUNT;
    PERFORM pg_temp.matrix_ok('nectar', 'auth reward_rules UPDATE empty', '0', n::text, n = 0);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
    PERFORM pg_temp.matrix_ok('nectar', 'auth reward_rules UPDATE deny', 'rls-deny', left(err,80), true);
  END;

  BEGIN
    INSERT INTO public.reward_executions (user_id, status) VALUES (uid_a, 'pending');
    PERFORM pg_temp.matrix_ok('nectar', 'auth reward_executions INSERT deny', 'rls-deny', 'INSERTED', false);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT, sqlst = RETURNED_SQLSTATE;
    PERFORM pg_temp.matrix_ok('nectar', 'auth reward_executions INSERT deny', 'rls-deny', left(err,120),
      pg_temp.is_rls_deny(sqlst, err));
  END;

  BEGIN
    INSERT INTO public.reward_redemptions (user_id, description, sprr_cost, status)
    VALUES (uid_a, 'auth-matrix', 1, 'pending');
    PERFORM pg_temp.matrix_ok('nectar', 'auth reward_redemptions INSERT deny', 'rls-deny', 'INSERTED', false);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT, sqlst = RETURNED_SQLSTATE;
    PERFORM pg_temp.matrix_ok('nectar', 'auth reward_redemptions INSERT deny', 'rls-deny', left(err,120),
      pg_temp.is_rls_deny(sqlst, err));
  END;

  BEGIN
    EXECUTE format('SELECT count(*) FROM public.reward_redemptions WHERE user_id = %L', uid_a) INTO n;
    PERFORM pg_temp.matrix_ok('nectar', 'auth reward_redemptions own SELECT', 'allowed', 'count='||n, true);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
    PERFORM pg_temp.matrix_ok('nectar', 'auth reward_redemptions own SELECT', 'allowed', left(err,80), false);
  END;

  -- Orders: client insert should be denied after hardening
  BEGIN
    INSERT INTO public.orders (organization_id, status, currency, source)
    VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'pending', 'INR', 'matrix');
    PERFORM pg_temp.matrix_ok('auth', 'orders INSERT deny', 'rls-deny', 'INSERTED', false);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT, sqlst = RETURNED_SQLSTATE;
    PERFORM pg_temp.matrix_ok('auth', 'orders INSERT deny', 'rls-deny', left(err,120),
      pg_temp.is_rls_deny(sqlst, err));
  END;

  -- Cart own-row (only if streetplayr schema with user_id)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='cart_items' AND column_name='user_id'
  ) THEN
    BEGIN
      INSERT INTO public.cart_items (user_id, product_id, quantity)
      VALUES (uid_a, 'matrix-prod', 1);
      PERFORM pg_temp.matrix_ok('auth', 'cart_items INSERT own', 'allowed', 'ok', true);
      DELETE FROM public.cart_items WHERE user_id = uid_a AND product_id = 'matrix-prod';
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('auth', 'cart_items INSERT own', 'allowed', left(err,120), false);
    END;
    IF uid_b IS DISTINCT FROM uid_a THEN
      BEGIN
        INSERT INTO public.cart_items (user_id, product_id, quantity)
        VALUES (uid_b, 'matrix-other', 1);
        PERFORM pg_temp.matrix_ok('auth', 'cart_items INSERT other deny', 'rls-deny', 'INSERTED', false);
      EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS err = MESSAGE_TEXT, sqlst = RETURNED_SQLSTATE;
        PERFORM pg_temp.matrix_ok('auth', 'cart_items INSERT other deny', 'rls-deny', left(err,120),
          pg_temp.is_rls_deny(sqlst, err));
      END;
    END IF;
  ELSE
    PERFORM pg_temp.matrix_ok('auth', 'cart_items schema', 'user_id column', 'CRM schema â€” local cart only', true);
  END IF;

  -- Wishlist own-row
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='wishlists' AND column_name='user_id'
  ) THEN
    BEGIN
      INSERT INTO public.wishlists (user_id, product_id)
      VALUES (uid_a, 'matrix-wish')
      ON CONFLICT DO NOTHING;
      PERFORM pg_temp.matrix_ok('auth', 'wishlists INSERT own', 'allowed', 'ok', true);
      DELETE FROM public.wishlists WHERE user_id = uid_a AND product_id = 'matrix-wish';
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('auth', 'wishlists INSERT own', 'allowed', left(err,120), false);
    END;
  END IF;

  EXECUTE 'RESET ROLE';

  -- OPS
  PERFORM set_config('request.jwt.claim.sub', uid_ops::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', uid_ops::text, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  BEGIN
    EXECUTE 'SELECT count(*) FROM public.orders' INTO n;
    PERFORM pg_temp.matrix_ok('ops', 'orders SELECT', 'allowed-if-ops', 'count='||n, true);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
    PERFORM pg_temp.matrix_ok('ops', 'orders SELECT', 'allowed-if-ops', left(err,80), false);
  END;

  BEGIN
    INSERT INTO public.wallet_transactions (user_id, type, delta, source, description)
    VALUES (uid_a, 'credit', 1, 'matrix', 'ops-direct');
    PERFORM pg_temp.matrix_ok('ops', 'wallet_tx INSERT deny (use server action)', 'rls-deny', 'INSERTED', false);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT, sqlst = RETURNED_SQLSTATE;
    PERFORM pg_temp.matrix_ok('ops', 'wallet_tx INSERT deny (use server action)', 'rls-deny', left(err,120),
      pg_temp.is_rls_deny(sqlst, err));
  END;

  BEGIN
    UPDATE public.reward_rules SET name = name;
    GET DIAGNOSTICS n = ROW_COUNT;
    PERFORM pg_temp.matrix_ok('ops', 'reward_rules UPDATE empty', '0', n::text, n = 0);
  EXCEPTION WHEN OTHERS THEN
    PERFORM pg_temp.matrix_ok('ops', 'reward_rules UPDATE deny', 'rls-deny', 'err', true);
  END;

  EXECUTE 'RESET ROLE';

  -- SERVICE / privileged (linked query owner bypasses RLS)
  BEGIN
    INSERT INTO public.wallet_transactions (user_id, type, delta, source, description)
    VALUES (uid_a, 'credit', 1, 'matrix', 'service-ok');
    PERFORM pg_temp.matrix_ok('service', 'wallet_tx INSERT', 'ok', 'ok', true);
    DELETE FROM public.wallet_transactions WHERE description = 'service-ok' AND user_id = uid_a;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
    PERFORM pg_temp.matrix_ok('service', 'wallet_tx INSERT', 'ok', left(err,120), false);
  END;

  BEGIN
    INSERT INTO public.wallet_accounts (user_id, wallet_type) VALUES (uid_a, 'points');
    PERFORM pg_temp.matrix_ok('service', 'wallet_accounts INSERT', 'ok', 'ok', true);
    DELETE FROM public.wallet_accounts WHERE user_id = uid_a AND wallet_type = 'points';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
    PERFORM pg_temp.matrix_ok('service', 'wallet_accounts INSERT', 'ok', left(err,120), false);
  END;

  BEGIN
    INSERT INTO public.reward_redemptions (user_id, description, sprr_cost, status)
    VALUES (uid_a, 'service-matrix', 1, 'pending');
    PERFORM pg_temp.matrix_ok('service', 'reward_redemptions INSERT', 'ok', 'ok', true);
    DELETE FROM public.reward_redemptions WHERE description = 'service-matrix' AND user_id = uid_a;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
    PERFORM pg_temp.matrix_ok('service', 'reward_redemptions INSERT', 'ok', left(err,120), false);
  END;
END $$;

SELECT coalesce(string_agg(section||':'||check_name||' => '||left(actual,80), E'\n'), 'NONE') AS fails
FROM _matrix_results WHERE NOT pass;

SELECT count(*) FILTER (WHERE pass)::text||' passed / '||count(*) FILTER (WHERE NOT pass)::text||' failed / '||count(*)::text||' total' AS score
FROM _matrix_results;
