SELECT tablename||':'||cmd||':'||policyname AS pol
FROM pg_policies
WHERE schemaname='public'
  AND tablename IN ('cart_items','wishlists','wishlist_items','user_addresses','orders')
ORDER BY 1;
