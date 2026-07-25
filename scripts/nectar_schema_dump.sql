SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'wallet_transactions','wallet_accounts','nectar_wallet_transactions',
    'reward_rules','reward_executions','reward_redemptions','orders','profiles',
    'wishlist_items','user_addresses','addresses','carts','cart_items'
  )
ORDER BY table_name, ordinal_position;

SELECT c.relname AS table_name, c.relrowsecurity AS rls,
       (SELECT count(*) FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=c.relname) AS policies
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname='public'
  AND c.relkind='r'
  AND c.relname IN (
    'wallet_transactions','wallet_accounts','nectar_wallet_transactions',
    'reward_rules','reward_executions','reward_redemptions','orders','profiles',
    'products','wishlist_items','user_addresses','inventory_reservations','operational_events'
  )
ORDER BY 1;

SELECT tablename, policyname, cmd, roles::text, qual, with_check
FROM pg_policies
WHERE schemaname='public'
  AND tablename IN (
    'wallet_transactions','wallet_accounts','nectar_wallet_transactions',
    'reward_rules','reward_executions','reward_redemptions','orders','profiles'
  )
ORDER BY tablename, cmd, policyname;
