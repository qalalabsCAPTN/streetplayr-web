-- Launch coupon: STREETplayR20 (stored uppercase). Shoppers type it at checkout.
INSERT INTO public.coupons (
  code,
  kind,
  value,
  min_subtotal,
  max_redemptions,
  max_per_user,
  starts_at,
  ends_at,
  is_active
)
VALUES (
  'STREETPLAYR20',
  'percent',
  20,
  0,
  NULL,
  1,
  NULL,
  NULL,
  true
)
ON CONFLICT (code) DO UPDATE
SET
  kind = EXCLUDED.kind,
  value = EXCLUDED.value,
  min_subtotal = EXCLUDED.min_subtotal,
  max_per_user = EXCLUDED.max_per_user,
  is_active = true;
