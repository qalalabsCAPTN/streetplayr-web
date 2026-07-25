SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args, p.prosecdef,
       p.proconfig
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE p.proname ILIKE '%publish%page%' OR p.proname ILIKE '%page_block%'
ORDER BY 1,2;
