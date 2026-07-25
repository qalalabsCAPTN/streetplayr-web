SELECT c.relname, c.relrowsecurity AS rls,
  (SELECT count(*) FROM pg_policies p WHERE p.tablename=c.relname AND p.schemaname='public') AS pols
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='r'
  AND c.relname IN ('cart_items','carts','wishlists','wishlist_items','wishlist');

SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies WHERE schemaname='public'
  AND tablename IN ('cart_items','carts','wishlists','wishlist_items','wishlist');

SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid='public.wallet_accounts'::regclass AND contype='c';
