-- ============================================================================
-- StreetPlayR — Existing DB Compatibility Patch
-- ============================================================================
-- Safely adds missing orchestration infrastructure to a production database
-- that already has legacy commerce schema (products, orders, etc.) but
-- lacks newer tables, enums, columns, functions, and indexes.
--
-- This migration ISOLATES additions to only what's missing — it NEVER drops,
-- recreates, or destructively alters existing commerce tables.
--
-- Target: existing production DB with 00001-style legacy schema
-- ============================================================================

-- ─── 1. Extension: idempotent enum type creation ───────────────────────────
-- PG doesn't support IF NOT EXISTS for CREATE TYPE. Use exception handling.

DO $$ BEGIN
  CREATE TYPE reservation_state AS ENUM (
    'pending', 'held', 'converted', 'released', 'expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_event_type AS ENUM (
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
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin', 'ops_admin', 'fulfillment', 'editorial', 'support', 'viewer', 'member'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 2. Add missing enum values to existing order_status ───────────────────
-- The codebase uses 'pending_payment' but legacy schema has 'pending'.
-- Also adds 'draft' and 'on_hold' for the orchestration state machine.

DO $$ BEGIN
  ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'draft';
EXCEPTION WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'on_hold';
EXCEPTION WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pending_payment';
EXCEPTION WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- ─── 3. Add missing columns to existing tables ─────────────────────────────

-- profiles: role column for OpsOS RBAC
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

-- payment_events: event taxonomy columns (replaces old status column)
ALTER TABLE payment_events
  ADD COLUMN IF NOT EXISTS event_type payment_event_type,
  ADD COLUMN IF NOT EXISTS stripe_event_id TEXT,
  ADD COLUMN IF NOT EXISTS raw_payload JSONB;

-- orders: financial breakdown + billing columns (required by OrderService)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS subtotal INTEGER NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  ADD COLUMN IF NOT EXISTS shipping_cost INTEGER NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  ADD COLUMN IF NOT EXISTS tax_amount INTEGER NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'usd',
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS billing_address JSONB;

-- products: ops lifecycle status column
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- ─── 4. Create inventory_reservations (the core orchestration table) ───────

CREATE TABLE IF NOT EXISTS inventory_reservations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id           UUID,
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id        UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  reserved_quantity INTEGER NOT NULL CHECK (reserved_quantity > 0),
  reservation_state reservation_state NOT NULL DEFAULT 'pending',
  reservation_owner UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id          UUID REFERENCES orders(id) ON DELETE SET NULL,
  expires_at        TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  converted_at      TIMESTAMPTZ,
  released_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ
);

ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;

-- RLS: user can read/insert own reservations
CREATE POLICY "Users can read own reservations"
  ON inventory_reservations FOR SELECT
  USING (reservation_owner = auth.uid());

CREATE POLICY "Users can insert own reservations"
  ON inventory_reservations FOR INSERT
  WITH CHECK (reservation_owner = auth.uid());

-- RLS: ops roles can read all reservations (for OpsOS dashboard)
CREATE POLICY "Ops roles can read all reservations"
  ON inventory_reservations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN (
      'super_admin', 'ops_admin', 'fulfillment', 'viewer'
    )
  ));

-- ─── 5. Create operational_events (immutable audit timeline) ───────────────

CREATE TABLE IF NOT EXISTS operational_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain        TEXT NOT NULL,
  severity      TEXT NOT NULL DEFAULT 'info',
  action        TEXT NOT NULL,
  actor_id      TEXT NOT NULL DEFAULT 'system',
  resource_type TEXT NOT NULL,
  resource_id   TEXT NOT NULL,
  message       TEXT NOT NULL,
  metadata      JSONB DEFAULT '{}'::jsonb,
  brand_id      UUID,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE operational_events ENABLE ROW LEVEL SECURITY;

-- RLS: all authenticated users can insert events
CREATE POLICY "Allow insert operational events"
  ON operational_events FOR INSERT
  WITH CHECK (true);

-- RLS: ops roles can read operational events (ops dashboard, order timeline)
CREATE POLICY "Ops roles can read operational events"
  ON operational_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN (
      'super_admin', 'ops_admin', 'fulfillment', 'editorial', 'support', 'viewer'
    )
  ));

-- ─── 6. Create idempotency_keys (webhook/action deduplication) ─────────────

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key        TEXT PRIMARY KEY,
  status     TEXT NOT NULL DEFAULT 'processing',
  data       JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages idempotency keys"
  ON idempotency_keys FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 7. Create role_grants (RBAC grants tracking) ─────────────────────────

CREATE TABLE IF NOT EXISTS role_grants (
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
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin')
  ));

CREATE POLICY "Admins can insert role grants"
  ON role_grants FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  ));

-- ─── 8. Add performance indexes ────────────────────────────────────────────

-- inventory_reservations: lookup by owner
CREATE INDEX IF NOT EXISTS idx_reservations_owner
  ON inventory_reservations(reservation_owner);

-- inventory_reservations: variant + state queries (stock availability)
CREATE INDEX IF NOT EXISTS idx_reservations_variant_state
  ON inventory_reservations(variant_id, reservation_state);

-- inventory_reservations: expiration sweeps
CREATE INDEX IF NOT EXISTS idx_reservations_expires
  ON inventory_reservations(expires_at)
  WHERE reservation_state IN ('pending', 'held');

-- inventory_reservations: owner + state (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_reservations_owner_state
  ON inventory_reservations(reservation_owner, reservation_state);

-- inventory_reservations: order_id lookups (webhook → reservation)
CREATE INDEX IF NOT EXISTS idx_reservations_order_id
  ON inventory_reservations(order_id)
  WHERE order_id IS NOT NULL;

-- operational_events: timeline queries
CREATE INDEX IF NOT EXISTS idx_events_domain ON operational_events(domain);
CREATE INDEX IF NOT EXISTS idx_events_severity ON operational_events(severity);
CREATE INDEX IF NOT EXISTS idx_events_resource ON operational_events(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON operational_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_actor ON operational_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_events_domain_severity_created
  ON operational_events(domain, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_brand
  ON operational_events(brand_id)
  WHERE brand_id IS NOT NULL;

-- idempotency_keys: expiration cleanup
CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expires_at);

-- payment_events: unique stripe event dedup
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_stripe_event
  ON payment_events(stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;

-- payment_events: prevent duplicate success events for same order
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_order_success
  ON payment_events(order_id, event_type)
  WHERE event_type = 'payment_intent.succeeded';

-- orders: payment intent lookups (webhook reconciliation)
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent
  ON orders(payment_intent_id)
  WHERE payment_intent_id IS NOT NULL;

-- orders: composite status timeline queries
CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON orders(status, created_at DESC);

-- profiles: role lookups (every OpsGuard check)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role)
  WHERE role IS NOT NULL;

-- products: ops lifecycle status lookups
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- ─── 9. Create or replace helper functions ─────────────────────────────────

-- set_updated_at trigger function (safe — already exists in 00001)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Reserve inventory: atomic availability check + creation
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

-- Release expired reservations (cron job target)
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

-- Atomic checkout initiation RPC
CREATE OR REPLACE FUNCTION initiate_checkout(
  p_user_id UUID,
  p_items JSONB,
  p_shipping_address JSONB DEFAULT '{}'::jsonb,
  p_billing_address JSONB DEFAULT NULL,
  p_payment_intent_id TEXT DEFAULT NULL,
  p_reservation_ttl_minutes INTEGER DEFAULT 15
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order_id UUID;
  v_subtotal INTEGER := 0;
  v_shipping INTEGER := 0;
  v_tax INTEGER := 0;
  v_total INTEGER := 0;
  v_item JSONB;
  v_reservation_id UUID;
  v_reservation_ids UUID[] := '{}';
  v_order_status TEXT;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_subtotal := v_subtotal + (v_item->>'quantity')::INTEGER * (v_item->>'price')::INTEGER;
  END LOOP;

  v_shipping := COALESCE((p_shipping_address->>'shipping_cost')::INTEGER, 0);
  v_tax := COALESCE((p_shipping_address->>'tax_amount')::INTEGER, 0);
  v_total := v_subtotal + v_shipping + v_tax;

  v_order_status := CASE
    WHEN p_payment_intent_id IS NOT NULL THEN 'pending_payment'
    ELSE 'draft'
  END;

  INSERT INTO orders (
    user_id, status, total, subtotal, shipping_cost, tax_amount,
    shipping_address, billing_address, payment_intent_id
  ) VALUES (
    p_user_id, v_order_status, v_total, v_subtotal, v_shipping, v_tax,
    p_shipping_address,
    COALESCE(p_billing_address, p_shipping_address),
    p_payment_intent_id
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (order_id, product_id, variant_id, quantity, price)
    VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'variant_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price')::INTEGER
    );

    v_reservation_id := reserve_inventory(
      (v_item->>'variant_id')::UUID,
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      p_user_id,
      now() + (p_reservation_ttl_minutes || ' minutes')::INTERVAL
    );

    UPDATE inventory_reservations
    SET order_id = v_order_id
    WHERE id = v_reservation_id;

    v_reservation_ids := array_append(v_reservation_ids, v_reservation_id);
  END LOOP;

  IF p_payment_intent_id IS NOT NULL THEN
    UPDATE inventory_reservations
    SET reservation_state = 'held'
    WHERE id = ANY(v_reservation_ids)
      AND reservation_state = 'pending';
  END IF;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'status', v_order_status,
    'total', v_total,
    'subtotal', v_subtotal,
    'shipping_cost', v_shipping,
    'tax_amount', v_tax,
    'reservation_ids', to_jsonb(v_reservation_ids)
  );
END;
$$;

-- ─── 10. Add updated_at triggers for new tables ────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_inventory_reservations_updated_at'
      AND tgrelid = 'inventory_reservations'::regclass
  ) THEN
    CREATE TRIGGER set_inventory_reservations_updated_at
      BEFORE UPDATE ON inventory_reservations
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ─── 11. Enable realtime replication (PG <15 compatible DO block) ──────────

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'products', 'product_variants',
    'inventory_reservations', 'operational_events'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
    END IF;
  END LOOP;
END;
$$;

-- ============================================================================
-- End of compatibility patch
-- ============================================================================
