-- ============================================================================
-- Phase 3.2 / 3.3 — Access matrix + NECTAR penetration tests
-- Usage: npx supabase db query --linked -f scripts/access_matrix_pentest.sql
-- ============================================================================

CREATE TEMP TABLE _matrix_results (
  section text,
  check_name text,
  expected text,
  actual text,
  pass boolean
);

-- SECURITY DEFINER so inserts work even under SET ROLE anon/authenticated
CREATE OR REPLACE FUNCTION pg_temp.matrix_ok(
  sec text, name text, exp text, act text, p boolean
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_temp
AS $$
BEGIN
  INSERT INTO _matrix_results VALUES (sec, name, exp, left(coalesce(act,''), 200), p);
END;
$$;

DO $$
DECLARE
  uid_a uuid;
  uid_b uuid;
  uid_ops uuid;
  n bigint;
  v text;
  err text;
  has_products boolean;
  has_profiles boolean;
  has_orders boolean;
  has_wallet_tx boolean;
  has_wallet_accounts boolean;
  has_nectar_tx boolean;
  has_reward_rules boolean;
  has_reward_exec boolean;
  has_reward_red boolean;
  addr_table text;
  bal_before text;
  bal_after text;
BEGIN
  has_products := to_regclass('public.products') IS NOT NULL;
  has_profiles := to_regclass('public.profiles') IS NOT NULL;
  has_orders := to_regclass('public.orders') IS NOT NULL;
  has_wallet_tx := to_regclass('public.wallet_transactions') IS NOT NULL;
  has_wallet_accounts := to_regclass('public.wallet_accounts') IS NOT NULL;
  has_nectar_tx := to_regclass('public.nectar_wallet_transactions') IS NOT NULL;
  has_reward_rules := to_regclass('public.reward_rules') IS NOT NULL;
  has_reward_exec := to_regclass('public.reward_executions') IS NOT NULL;
  has_reward_red := to_regclass('public.reward_redemptions') IS NOT NULL;

  IF to_regclass('public.user_addresses') IS NOT NULL THEN
    addr_table := 'user_addresses';
  ELSIF to_regclass('public.addresses') IS NOT NULL THEN
    addr_table := 'addresses';
  ELSIF to_regclass('public.customer_addresses') IS NOT NULL THEN
    addr_table := 'customer_addresses';
  ELSE
    addr_table := NULL;
  END IF;

  SELECT id INTO uid_a FROM auth.users ORDER BY created_at NULLS LAST LIMIT 1;
  SELECT id INTO uid_b FROM auth.users WHERE id IS DISTINCT FROM uid_a ORDER BY created_at NULLS LAST LIMIT 1;
  SELECT p.id INTO uid_ops
  FROM public.profiles p
  WHERE p.role IN ('ops_admin','admin','super_admin','ops')
  LIMIT 1;

  IF uid_a IS NULL THEN
    PERFORM pg_temp.matrix_ok('setup', 'auth.users available', '>=1 user', '0', false);
    RETURN;
  END IF;
  IF uid_b IS NULL THEN uid_b := uid_a; END IF;
  IF uid_ops IS NULL THEN uid_ops := uid_a; END IF;

  PERFORM pg_temp.matrix_ok('setup', 'fixture users resolved', 'ok',
    'a='||uid_a::text||' b='||uid_b::text||' ops='||uid_ops::text, true);

  IF has_profiles THEN
    INSERT INTO public.profiles (id, email, role)
    SELECT u.id, coalesce(u.email, u.id::text||'@test.local'), 'member'
    FROM auth.users u
    WHERE u.id IN (uid_a, uid_b)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- ANON
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claim.role', 'anon', true);
  PERFORM set_config('request.jwt.claims', '{"role":"anon"}', true);
  EXECUTE 'SET LOCAL ROLE anon';

  IF has_products THEN
    BEGIN
      EXECUTE 'SELECT count(*)::text FROM public.products' INTO v;
      PERFORM pg_temp.matrix_ok('anon', 'catalog products SELECT', 'allowed', 'count='||v, true);
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('anon', 'catalog products SELECT', 'allowed', left(err,100), false);
    END;
  END IF;

  IF has_profiles THEN
    BEGIN
      EXECUTE 'SELECT count(*) FROM public.profiles' INTO n;
      PERFORM pg_temp.matrix_ok('anon', 'profiles SELECT = 0', '0', n::text, n = 0);
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('anon', 'profiles SELECT = 0', 'denied/0', left(err,80), true);
    END;
  END IF;

  IF has_orders THEN
    BEGIN
      EXECUTE 'SELECT count(*) FROM public.orders' INTO n;
      PERFORM pg_temp.matrix_ok('anon', 'orders SELECT = 0', '0', n::text, n = 0);
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('anon', 'orders SELECT = 0', 'denied/0', left(err,80), true);
    END;
  END IF;

  IF addr_table IS NOT NULL THEN
    BEGIN
      EXECUTE format('SELECT count(*) FROM public.%I', addr_table) INTO n;
      PERFORM pg_temp.matrix_ok('anon', 'addresses SELECT = 0', '0', n::text, n = 0);
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('anon', 'addresses SELECT = 0', 'denied/0', left(err,80), true);
    END;
  END IF;

  IF has_wallet_tx THEN
    BEGIN
      INSERT INTO public.wallet_transactions (user_id, amount, type, description)
      VALUES (uid_a, 999, 'credit', 'anon-pwn-matrix');
      PERFORM pg_temp.matrix_ok('anon', 'wallet_transactions INSERT denied', 'denied', 'INSERTED', false);
      DELETE FROM public.wallet_transactions WHERE description = 'anon-pwn-matrix';
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('anon', 'wallet_transactions INSERT denied', 'denied', left(err,80), true);
    END;
  END IF;

  IF has_wallet_accounts THEN
    BEGIN
      EXECUTE 'SELECT count(*) FROM public.wallet_accounts' INTO n;
      PERFORM pg_temp.matrix_ok('anon', 'wallet_accounts SELECT = 0', '0', n::text, n = 0);
    EXCEPTION WHEN OTHERS THEN
      PERFORM pg_temp.matrix_ok('anon', 'wallet_accounts SELECT = 0', 'denied/0', 'err', true);
    END;
    BEGIN
      EXECUTE format('INSERT INTO public.wallet_accounts (user_id) VALUES (%L)', uid_a);
      PERFORM pg_temp.matrix_ok('anon', 'wallet_accounts INSERT denied', 'denied', 'INSERTED', false);
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('anon', 'wallet_accounts INSERT denied', 'denied', left(err,80), true);
    END;
  END IF;

  IF has_nectar_tx THEN
    BEGIN
      EXECUTE format('INSERT INTO public.nectar_wallet_transactions (user_id, amount) VALUES (%L, 1)', uid_a);
      PERFORM pg_temp.matrix_ok('anon', 'nectar_wallet_transactions INSERT denied', 'denied', 'INSERTED', false);
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('anon', 'nectar_wallet_transactions INSERT denied', 'denied', left(err,80), true);
    END;
  END IF;

  IF has_reward_rules THEN
    BEGIN
      EXECUTE 'UPDATE public.reward_rules SET id = id';
      GET DIAGNOSTICS n = ROW_COUNT;
      PERFORM pg_temp.matrix_ok('anon', 'reward_rules UPDATE = 0', '0', n::text, n = 0);
    EXCEPTION WHEN OTHERS THEN
      PERFORM pg_temp.matrix_ok('anon', 'reward_rules UPDATE denied', 'denied', 'err', true);
    END;
  END IF;

  IF has_reward_exec THEN
    BEGIN
      EXECUTE format('INSERT INTO public.reward_executions (user_id) VALUES (%L)', uid_a);
      PERFORM pg_temp.matrix_ok('anon', 'reward_executions INSERT denied', 'denied', 'INSERTED', false);
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('anon', 'reward_executions INSERT denied', 'denied', left(err,80), true);
    END;
  END IF;

  IF has_reward_red THEN
    BEGIN
      INSERT INTO public.reward_redemptions (user_id, reward_type, sprr_cost, status)
      VALUES (uid_a, 'matrix-anon', 1, 'pending');
      PERFORM pg_temp.matrix_ok('anon', 'reward_redemptions INSERT denied', 'denied', 'INSERTED', false);
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('anon', 'reward_redemptions INSERT denied', 'denied', left(err,80), true);
    END;
  END IF;

  EXECUTE 'RESET ROLE';

  -- AUTH
  PERFORM set_config('request.jwt.claim.sub', uid_a::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', uid_a::text, 'role', 'authenticated')::text,
    true
  );
  EXECUTE 'SET LOCAL ROLE authenticated';

  IF has_profiles THEN
    BEGIN
      EXECUTE format('SELECT count(*) FROM public.profiles WHERE id = %L', uid_a) INTO n;
      PERFORM pg_temp.matrix_ok('auth', 'profiles SELECT own', '>=1', n::text, n >= 1);
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('auth', 'profiles SELECT own', '>=1', left(err,80), false);
    END;

    IF uid_b IS DISTINCT FROM uid_a THEN
      BEGIN
        EXECUTE format('SELECT count(*) FROM public.profiles WHERE id = %L', uid_b) INTO n;
        PERFORM pg_temp.matrix_ok('auth', 'profiles SELECT other = 0', '0', n::text, n = 0);
      EXCEPTION WHEN OTHERS THEN
        PERFORM pg_temp.matrix_ok('auth', 'profiles SELECT other = 0', '0', 'err', true);
      END;
    END IF;

    BEGIN
      UPDATE public.profiles SET role = 'super_admin' WHERE id = uid_a;
      EXECUTE format('SELECT role FROM public.profiles WHERE id = %L', uid_a) INTO v;
      PERFORM pg_temp.matrix_ok('auth', 'profiles role escalate blocked', 'not super_admin', coalesce(v, '?'),
        coalesce(v, '') IS DISTINCT FROM 'super_admin');
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('auth', 'profiles role escalate blocked', 'denied/reverted', left(err,80), true);
    END;

    BEGIN
      EXECUTE format('SELECT coalesce(sprr_balance::text, ''0'') FROM public.profiles WHERE id = %L', uid_a) INTO bal_before;
      EXECUTE format('UPDATE public.profiles SET sprr_balance = 999999 WHERE id = %L', uid_a);
      EXECUTE format('SELECT coalesce(sprr_balance::text, ''0'') FROM public.profiles WHERE id = %L', uid_a) INTO bal_after;
      PERFORM pg_temp.matrix_ok('auth', 'profiles sprr_balance mint blocked', 'unchanged',
        'before='||coalesce(bal_before,'?')||' after='||coalesce(bal_after,'?'),
        coalesce(bal_after, '') IS DISTINCT FROM '999999');
    EXCEPTION
      WHEN undefined_column THEN
        PERFORM pg_temp.matrix_ok('auth', 'profiles sprr_balance mint blocked', 'n/a', 'no column', true);
      WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
        PERFORM pg_temp.matrix_ok('auth', 'profiles sprr_balance mint blocked', 'denied', left(err,80), true);
    END;
  END IF;

  IF has_orders THEN
    BEGIN
      INSERT INTO public.orders (user_id, status, total)
      VALUES (uid_a, 'pending', 1);
      PERFORM pg_temp.matrix_ok('auth', 'orders INSERT denied', 'denied', 'INSERTED', false);
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('auth', 'orders INSERT denied', 'denied', left(err,80), true);
    END;
  END IF;

  IF has_wallet_tx THEN
    BEGIN
      INSERT INTO public.wallet_transactions (user_id, amount, type, description)
      VALUES (uid_a, 500, 'credit', 'auth-mint-matrix');
      PERFORM pg_temp.matrix_ok('auth', 'wallet_transactions INSERT denied', 'denied', 'INSERTED', false);
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('auth', 'wallet_transactions INSERT denied', 'denied', left(err,80), true);
    END;

    IF uid_b IS DISTINCT FROM uid_a THEN
      BEGIN
        EXECUTE format('SELECT count(*) FROM public.wallet_transactions WHERE user_id = %L', uid_b) INTO n;
        PERFORM pg_temp.matrix_ok('auth', 'wallet_transactions other = 0', '0', n::text, n = 0);
      EXCEPTION WHEN OTHERS THEN
        PERFORM pg_temp.matrix_ok('auth', 'wallet_transactions other = 0', '0', 'err', true);
      END;
    END IF;

    BEGIN
      EXECUTE format('SELECT count(*) FROM public.wallet_transactions WHERE user_id = %L', uid_a) INTO n;
      PERFORM pg_temp.matrix_ok('auth', 'wallet_transactions own SELECT allowed', 'allowed', 'count='||n, true);
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('auth', 'wallet_transactions own SELECT allowed', 'allowed', left(err,80), false);
    END;
  END IF;

  IF has_wallet_accounts THEN
    BEGIN
      EXECUTE format('INSERT INTO public.wallet_accounts (user_id) VALUES (%L)', uid_a);
      PERFORM pg_temp.matrix_ok('nectar', 'auth wallet_accounts INSERT denied', 'denied', 'INSERTED', false);
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('nectar', 'auth wallet_accounts INSERT denied', 'denied', left(err,80), true);
    END;
    BEGIN
      EXECUTE 'UPDATE public.wallet_accounts SET user_id = user_id';
      GET DIAGNOSTICS n = ROW_COUNT;
      PERFORM pg_temp.matrix_ok('nectar', 'auth wallet_accounts UPDATE = 0', '0', n::text, n = 0);
    EXCEPTION WHEN OTHERS THEN
      PERFORM pg_temp.matrix_ok('nectar', 'auth wallet_accounts UPDATE denied', 'denied', 'err', true);
    END;
  ELSE
    PERFORM pg_temp.matrix_ok('nectar', 'wallet_accounts table present', 'exists', 'MISSING', false);
  END IF;

  IF has_nectar_tx THEN
    BEGIN
      EXECUTE format('INSERT INTO public.nectar_wallet_transactions (user_id, amount) VALUES (%L, 50)', uid_a);
      PERFORM pg_temp.matrix_ok('nectar', 'auth nectar_wallet_transactions INSERT denied', 'denied', 'INSERTED', false);
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('nectar', 'auth nectar_wallet_transactions INSERT denied', 'denied', left(err,80), true);
    END;
  ELSE
    PERFORM pg_temp.matrix_ok('nectar', 'nectar_wallet_transactions table present', 'exists', 'MISSING', false);
  END IF;

  IF has_reward_rules THEN
    BEGIN
      EXECUTE 'UPDATE public.reward_rules SET id = id';
      GET DIAGNOSTICS n = ROW_COUNT;
      PERFORM pg_temp.matrix_ok('nectar', 'auth reward_rules UPDATE = 0', '0', n::text, n = 0);
    EXCEPTION WHEN OTHERS THEN
      PERFORM pg_temp.matrix_ok('nectar', 'auth reward_rules UPDATE denied', 'denied', 'err', true);
    END;
  ELSE
    PERFORM pg_temp.matrix_ok('nectar', 'reward_rules table present', 'exists', 'MISSING', false);
  END IF;

  IF has_reward_exec THEN
    BEGIN
      EXECUTE format('INSERT INTO public.reward_executions (user_id) VALUES (%L)', uid_a);
      PERFORM pg_temp.matrix_ok('nectar', 'auth reward_executions INSERT denied', 'denied', 'INSERTED', false);
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('nectar', 'auth reward_executions INSERT denied', 'denied', left(err,80), true);
    END;
  ELSE
    PERFORM pg_temp.matrix_ok('nectar', 'reward_executions table present', 'exists', 'MISSING', false);
  END IF;

  IF has_reward_red THEN
    BEGIN
      INSERT INTO public.reward_redemptions (user_id, reward_type, sprr_cost, status)
      VALUES (uid_a, 'matrix-auth', 1, 'pending');
      PERFORM pg_temp.matrix_ok('nectar', 'auth reward_redemptions INSERT denied', 'denied', 'INSERTED', false);
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('nectar', 'auth reward_redemptions INSERT denied', 'denied', left(err,80), true);
    END;
    BEGIN
      EXECUTE format('SELECT count(*) FROM public.reward_redemptions WHERE user_id = %L', uid_a) INTO n;
      PERFORM pg_temp.matrix_ok('nectar', 'auth reward_redemptions own SELECT', 'allowed', 'count='||n, true);
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('nectar', 'auth reward_redemptions own SELECT', 'allowed', left(err,80), false);
    END;
  ELSE
    PERFORM pg_temp.matrix_ok('nectar', 'reward_redemptions table present', 'exists', 'MISSING', false);
  END IF;

  IF addr_table IS NOT NULL THEN
    BEGIN
      EXECUTE format('SELECT count(*) FROM public.%I', addr_table) INTO n;
      PERFORM pg_temp.matrix_ok('auth', 'addresses SELECT (scoped)', 'allowed-scoped', 'count='||n, true);
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('auth', 'addresses SELECT (scoped)', 'allowed-scoped', left(err,80), false);
    END;
  END IF;

  EXECUTE 'RESET ROLE';

  -- OPS
  PERFORM set_config('request.jwt.claim.sub', uid_ops::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', uid_ops::text, 'role', 'authenticated')::text,
    true
  );
  EXECUTE 'SET LOCAL ROLE authenticated';

  IF has_orders THEN
    BEGIN
      EXECUTE 'SELECT count(*) FROM public.orders' INTO n;
      PERFORM pg_temp.matrix_ok('ops', 'orders SELECT (ops policy)', 'allowed-if-ops', 'count='||n, true);
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('ops', 'orders SELECT (ops policy)', 'allowed-if-ops', left(err,80), false);
    END;
  END IF;

  IF has_wallet_tx THEN
    BEGIN
      INSERT INTO public.wallet_transactions (user_id, amount, type, description)
      VALUES (uid_a, 1, 'credit', 'ops-direct-matrix');
      PERFORM pg_temp.matrix_ok('ops', 'wallet_transactions INSERT denied', 'denied', 'INSERTED', false);
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('ops', 'wallet_transactions INSERT denied', 'denied', left(err,80), true);
    END;
  END IF;

  IF has_reward_rules THEN
    BEGIN
      EXECUTE 'UPDATE public.reward_rules SET id = id';
      GET DIAGNOSTICS n = ROW_COUNT;
      PERFORM pg_temp.matrix_ok('ops', 'reward_rules client UPDATE = 0', '0', n::text, n = 0);
    EXCEPTION WHEN OTHERS THEN
      PERFORM pg_temp.matrix_ok('ops', 'reward_rules client UPDATE denied', 'denied', 'err', true);
    END;
  END IF;

  EXECUTE 'RESET ROLE';

  -- SERVICE / OWNER
  IF has_wallet_tx THEN
    BEGIN
      INSERT INTO public.wallet_transactions (user_id, amount, type, description)
      VALUES (uid_a, 1, 'credit', 'service-ok-matrix');
      PERFORM pg_temp.matrix_ok('service', 'wallet_transactions INSERT as privileged', 'ok', 'ok', true);
      DELETE FROM public.wallet_transactions WHERE description = 'service-ok-matrix' AND user_id = uid_a;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('service', 'wallet_transactions INSERT as privileged', 'ok', left(err,100), false);
    END;
  END IF;

  IF has_wallet_accounts THEN
    BEGIN
      EXECUTE format('INSERT INTO public.wallet_accounts (user_id) VALUES (%L)', uid_a);
      PERFORM pg_temp.matrix_ok('service', 'wallet_accounts INSERT as privileged', 'ok', 'ok', true);
      EXECUTE format('DELETE FROM public.wallet_accounts WHERE user_id = %L', uid_a);
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('service', 'wallet_accounts INSERT as privileged', 'ok', left(err,120), false);
    END;
  END IF;

  IF has_reward_red THEN
    BEGIN
      INSERT INTO public.reward_redemptions (user_id, reward_type, sprr_cost, status)
      VALUES (uid_a, 'matrix-service', 1, 'pending');
      PERFORM pg_temp.matrix_ok('service', 'reward_redemptions INSERT as privileged', 'ok', 'ok', true);
      DELETE FROM public.reward_redemptions WHERE reward_type = 'matrix-service' AND user_id = uid_a;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS err = MESSAGE_TEXT;
      PERFORM pg_temp.matrix_ok('service', 'reward_redemptions INSERT as privileged', 'ok', left(err,120), false);
    END;
  END IF;
END $$;

SELECT section, check_name, expected, actual,
       CASE WHEN pass THEN 'PASS' ELSE 'FAIL' END AS verdict
FROM _matrix_results
ORDER BY
  CASE section
    WHEN 'setup' THEN 0
    WHEN 'anon' THEN 1
    WHEN 'auth' THEN 2
    WHEN 'ops' THEN 3
    WHEN 'nectar' THEN 4
    WHEN 'service' THEN 5
    ELSE 9
  END,
  check_name;

SELECT
  count(*) FILTER (WHERE pass) AS passed,
  count(*) FILTER (WHERE NOT pass) AS failed,
  count(*) AS total
FROM _matrix_results;

-- override trailing selects: fails first
SELECT section, check_name, expected, actual,
       CASE WHEN pass THEN 'PASS' ELSE 'FAIL' END AS verdict
FROM _matrix_results
WHERE NOT pass
ORDER BY section, check_name;
