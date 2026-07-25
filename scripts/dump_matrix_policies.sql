-- Policy dump for access-matrix tables
SELECT tablename, policyname, cmd, roles::text, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = ANY(ARRAY[
    'products','product_variants','variants','collections','collection_products',
    'profiles','orders','order_items','addresses','customer_addresses','carts','cart_items',
    'wishlist','wishlists','wishlist_items',
    'wallet_accounts','nectar_wallet_transactions','wallet_transactions',
    'reward_rules','reward_executions','reward_redemptions',
    'inventory_reservations','operational_events','page_blocks'
  ])
ORDER BY tablename, cmd, policyname;
