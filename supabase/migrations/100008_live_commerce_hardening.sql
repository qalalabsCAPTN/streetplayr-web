-- Live commerce hardening. Additive only — does not recreate orders.
-- Verified live (2026-08-27 probe):
--   orders: customer_id, grand_total, shipping_total, tax_total (also shipping_cost, tax_amount)
--   order_items: unit_price, total_price (no price)
--   inventory.quantity is stock SoT (product_variants.stock_quantity does NOT exist)
--   reserve_inventory on live used empty search_path / missing tables check

CREATE OR REPLACE FUNCTION public.reserve_inventory(
  p_variant_id UUID,
  p_product_id UUID,
  p_quantity INTEGER,
  p_owner UUID,
  p_expires_at TIMESTAMPTZ DEFAULT (now() + interval '15 minutes')
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_on_hand INTEGER;
  v_held INTEGER;
  v_available INTEGER;
  v_reservation_id UUID;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive';
  END IF;

  SELECT i.quantity
    INTO v_on_hand
    FROM public.inventory i
    WHERE i.variant_id = p_variant_id
    FOR UPDATE;

  IF v_on_hand IS NULL THEN
    RAISE EXCEPTION 'Insufficient stock: available=0, requested=%', p_quantity;
  END IF;

  SELECT COALESCE(SUM(r.reserved_quantity), 0)
    INTO v_held
    FROM public.inventory_reservations r
    WHERE r.variant_id = p_variant_id
      AND r.reservation_state IN ('pending', 'held');

  v_available := v_on_hand - v_held;
  IF v_available < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock: available=%, requested=%', v_available, p_quantity;
  END IF;

  INSERT INTO public.inventory_reservations (
    variant_id, product_id, reserved_quantity, reservation_owner, expires_at, reservation_state
  ) VALUES (
    p_variant_id, p_product_id, p_quantity, p_owner, p_expires_at, 'pending'
  ) RETURNING id INTO v_reservation_id;

  UPDATE public.inventory
     SET reserved_quantity = COALESCE(reserved_quantity, 0) + p_quantity,
         updated_at = now()
   WHERE variant_id = p_variant_id;

  RETURN v_reservation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_expired_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, variant_id, reserved_quantity
      FROM public.inventory_reservations
     WHERE reservation_state IN ('pending', 'held')
       AND expires_at < now()
     FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.inventory_reservations
       SET reservation_state = 'expired',
           released_at = now()
     WHERE id = r.id;

    UPDATE public.inventory
       SET reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - r.reserved_quantity),
           updated_at = now()
     WHERE variant_id = r.variant_id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.convert_inventory_reservation(p_reservation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  SELECT id, variant_id, reserved_quantity, reservation_state
    INTO r
    FROM public.inventory_reservations
   WHERE id = p_reservation_id
   FOR UPDATE;

  IF r.id IS NULL THEN
    RAISE EXCEPTION 'Reservation not found';
  END IF;

  IF r.reservation_state = 'converted' THEN
    RETURN;
  END IF;

  IF r.reservation_state NOT IN ('pending', 'held') THEN
    RAISE EXCEPTION 'Cannot convert reservation in state %', r.reservation_state;
  END IF;

  UPDATE public.inventory_reservations
     SET reservation_state = 'converted',
         converted_at = now()
   WHERE id = p_reservation_id;

  UPDATE public.inventory
     SET quantity = GREATEST(0, quantity - r.reserved_quantity),
         reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - r.reserved_quantity),
         updated_at = now()
   WHERE variant_id = r.variant_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_inventory_reservation(p_reservation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  SELECT id, variant_id, reserved_quantity, reservation_state
    INTO r
    FROM public.inventory_reservations
   WHERE id = p_reservation_id
   FOR UPDATE;

  IF r.id IS NULL THEN
    RETURN;
  END IF;

  IF r.reservation_state IN ('released', 'expired') THEN
    RETURN;
  END IF;

  IF r.reservation_state = 'converted' THEN
    UPDATE public.inventory
       SET quantity = quantity + r.reserved_quantity,
           updated_at = now()
     WHERE variant_id = r.variant_id;
  ELSE
    UPDATE public.inventory
       SET reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - r.reserved_quantity),
           updated_at = now()
     WHERE variant_id = r.variant_id;
  END IF;

  UPDATE public.inventory_reservations
     SET reservation_state = 'released',
         released_at = now()
   WHERE id = p_reservation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_inventory(UUID, UUID, INTEGER, UUID, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_expired_reservations() TO service_role;
GRANT EXECUTE ON FUNCTION public.convert_inventory_reservation(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_inventory_reservation(UUID) TO service_role;

CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('percent', 'fixed')),
  value NUMERIC NOT NULL CHECK (value > 0),
  min_subtotal NUMERIC NOT NULL DEFAULT 0 CHECK (min_subtotal >= 0),
  max_redemptions INTEGER,
  max_per_user INTEGER DEFAULT 1,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON public.coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON public.coupon_redemptions(user_id);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read active coupons" ON public.coupons;
CREATE POLICY "public read active coupons"
  ON public.coupons FOR SELECT
  USING (is_active = true);

CREATE TABLE IF NOT EXISTS public.loyalty_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  steps INTEGER NOT NULL DEFAULT 1,
  sprr_reward INTEGER NOT NULL DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loyalty_quest_progress (
  user_id UUID NOT NULL,
  quest_id UUID NOT NULL REFERENCES public.loyalty_quests(id) ON DELETE CASCADE,
  done INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, quest_id)
);

ALTER TABLE public.loyalty_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_quest_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read active quests" ON public.loyalty_quests;
CREATE POLICY "public read active quests"
  ON public.loyalty_quests FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "users read own quest progress" ON public.loyalty_quest_progress;
CREATE POLICY "users read own quest progress"
  ON public.loyalty_quest_progress FOR SELECT
  USING (user_id = auth.uid());

INSERT INTO public.loyalty_quests (slug, name, description, steps, sprr_reward, xp_reward)
VALUES
  ('first-order', 'First Cop', 'Complete your first paid order.', 1, 200, 100),
  ('three-orders', 'Repeat Player', 'Complete 3 paid orders.', 3, 500, 250)
ON CONFLICT (slug) DO NOTHING;
