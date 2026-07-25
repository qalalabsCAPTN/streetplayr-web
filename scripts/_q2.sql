SELECT tablename||':'||cmd||':'||policyname AS pol FROM pg_policies WHERE schemaname='public' AND tablename IN ('cart_items','carts','wishlists','wishlist_items','wishlist') ORDER BY 1;
