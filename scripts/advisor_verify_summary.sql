-- Advisor verify — condensed pass/fail (run AFTER 100000 + hotfix)
-- Returns one row of counts; investigate non-zero FAIL buckets.

SELECT
  (SELECT count(*) FROM pg_class c
   JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
  ) AS rls_off_tables,
  (SELECT count(*) FROM pg_class c
   JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies p
       WHERE p.schemaname = 'public' AND p.tablename = c.relname
     )
  ) AS rls_on_zero_policies,
  (SELECT count(*) FROM pg_policies
   WHERE schemaname = 'public' AND cmd = 'INSERT'
     AND (with_check ILIKE '%true%' OR with_check = 'true')
  ) AS open_insert_true_policies,
  (SELECT count(*) FROM pg_proc p
   JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.prosecdef = true
     AND (
       p.proconfig IS NULL
       OR NOT EXISTS (
         SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'search_path=%'
       )
     )
  ) AS definer_missing_search_path,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public') AS total_policies,
  (SELECT count(*) FROM pg_proc p
   JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'publish_page_blocks'
  ) AS publish_page_blocks_exists,
  (SELECT has_function_privilege('anon', 'public.protect_profile_privileged_columns()', 'EXECUTE')
  ) AS anon_can_exec_protect_profile,
  (SELECT has_function_privilege('authenticated', 'public.protect_profile_privileged_columns()', 'EXECUTE')
  ) AS auth_can_exec_protect_profile;
