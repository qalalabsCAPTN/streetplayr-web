-- ============================================================================
-- StreetPlayR — Production Readiness: RBAC + Inventory Orchestration
-- ============================================================================
-- Expands the role system from simple admin/member to full multi-tier OpsOS
-- RBAC. Updates inventory_reservations to be Stripe-independent with proper
-- lifecycle state machine.
-- ============================================================================

-- ─── 1. Expand Role Enum ────────────────────────────────────────────────────

-- Create new role type with full OpsOS role segmentation
CREATE TYPE user_role_new AS ENUM (
  'super_admin',
  'ops_admin',
  'fulfillment',
  'editorial',
  'support',
  'viewer',
  'member'
);

-- Migrate existing roles to new enum
ALTER TABLE profiles
  ALTER COLUMN role TYPE user_role_new
  USING CASE
    WHEN role::text = 'admin' THEN 'super_admin'::user_role_new
    WHEN role::text = 'operator' THEN 'ops_admin'::user_role_new
    ELSE 'member'::user_role_new
  END;

-- Drop old enum
DROP TYPE user_role;

-- Rename new enum to original name
ALTER TYPE user_role_new RENAME TO user_role;

-- ─── 2. Grant table for role-based access control ──────────────────────────

CREATE TABLE role_grants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE role_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read role grants"
  ON role_grants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
  ));

CREATE POLICY "Admins can insert role grants"
  ON role_grants FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  ));

-- ─── 3. Drop old inventory_reservations, create Stripe-independent version ──

DROP TABLE IF EXISTS inventory_reservations CASCADE;

CREATE TYPE reservation_state AS ENUM (
  'pending',     -- User entered checkout. Reserved. Timer starts.
  'held',        -- PaymentIntent created. Waiting for confirmation.
  'converted',   -- Payment confirmed. Stock permanently deducted.
  'released',    -- Released back to pool (failure, cancel, refund).
  'expired'      -- TTL reached without conversion. Auto-released.
);

CREATE TABLE inventory_reservations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id           UUID,
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id        UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  reserved_quantity INTEGER NOT NULL CHECK (reserved_quantity > 0),
  reservation_state reservation_state NOT NULL DEFAULT 'pending',
  reservation_owner UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at        TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  converted_at      TIMESTAMPTZ,
  released_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reservations"
  ON inventory_reservations FOR SELECT
  USING (reservation_owner = auth.uid());

CREATE POLICY "Users can insert own reservations"
  ON inventory_reservations FOR INSERT
  WITH CHECK (reservation_owner = auth.uid());

CREATE INDEX idx_reservations_owner ON inventory_reservations(reservation_owner);
CREATE INDEX idx_reservations_variant_state ON inventory_reservations(variant_id, reservation_state);
CREATE INDEX idx_reservations_expires ON inventory_reservations(expires_at)
  WHERE reservation_state IN ('pending', 'held');

-- ─── 4. Updated-at trigger for reservation state changes ───────────────────

CREATE TRIGGER set_inventory_reservations_updated_at
  BEFORE UPDATE ON inventory_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── 5. Atomic reservation RPC (race-condition-safe) ──────────────────────

CREATE OR REPLACE FUNCTION reserve_inventory(
  p_variant_id UUID,
  p_product_id UUID,
  p_quantity INTEGER,
  p_owner UUID,
  p_expires_at TIMESTAMPTZ DEFAULT (now() + interval '15 minutes')
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_available INTEGER;
  v_reservation_id UUID;
BEGIN
  -- Atomic availability check
  SELECT pv.stock_quantity - COALESCE(SUM(r.reserved_quantity), 0)
  INTO v_available
  FROM product_variants pv
  LEFT JOIN inventory_reservations r
    ON r.variant_id = pv.id
    AND r.reservation_state IN ('pending', 'held')
  WHERE pv.id = p_variant_id
  GROUP BY pv.stock_quantity;

  IF v_available IS NULL OR v_available < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock: available=%, requested=%',
      COALESCE(v_available, 0), p_quantity
      USING HINT = 'release_existing_reservation_or_increase_stock';
  END IF;

  INSERT INTO inventory_reservations (
    variant_id, product_id, reserved_quantity, reservation_owner, expires_at
  ) VALUES (
    p_variant_id, p_product_id, p_quantity, p_owner, p_expires_at
  ) RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;
END;
$$;

-- ─── 6. Expired reservation cleanup RPC ───────────────────────────────────

CREATE OR REPLACE FUNCTION release_expired_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE inventory_reservations
  SET reservation_state = 'expired',
      released_at = now()
  WHERE reservation_state IN ('pending', 'held')
    AND expires_at < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ─── 7. Payment event type expansion ──────────────────────────────────────

CREATE TYPE payment_event_type_new AS ENUM (
  'payment_intent.created',
  'payment_intent.processing',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.canceled',
  'payment_intent.expired',
  'charge.refunded',
  'charge.disputed',
  'charge.refund.updated'
);

ALTER TABLE payment_events
  ADD COLUMN IF NOT EXISTS event_type payment_event_type_new,
  ADD COLUMN IF NOT EXISTS stripe_event_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS raw_payload JSONB;

-- ─── 8. RLS policy updates for expanded roles ─────────────────────────────

-- Drop old admin/operator policies that reference the old role values
DROP POLICY IF EXISTS "Operators can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- New role-aware policies
CREATE POLICY "Ops roles can read all profiles"
  ON profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN (
      'super_admin', 'ops_admin', 'fulfillment', 'editorial', 'support', 'viewer'
    )
  ));

CREATE POLICY "Super admins can update any profile"
  ON profiles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  ));

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin')
  ));

-- ─── 9. Drop old unused payment event columns ─────────────────────────────

ALTER TABLE payment_events DROP COLUMN IF EXISTS status;
