-- ============================================================================
-- StreetPlayR — Final Production Hardening (Idempotent)
-- ============================================================================
-- This migration is FULLY IDEMPOTENT and works on any DB state:
-- - Legacy schema (00001 only)
-- - Partially migrated (any subset of 00001-00007)
-- - Clean / fully migrated
--
-- It NEVER drops or destructively alters existing objects.
-- ============================================================================

-- ─── 1. Extensions (idempotent) ─────────────────────────────────────────────

-- ─── 2. Enums (idempotent via exception handling) ───────────────────────────

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

-- ─── 3. Tables ──────────────────────────────────────────────────────────────

-- Profiles: role column
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

-- Products: status column
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Payment events: event taxonomy columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'payment_events'
  ) THEN

    ALTER TABLE payment_events
      ADD COLUMN IF NOT EXISTS event_type payment_event_type,
      ADD COLUMN IF NOT EXISTS stripe_event_id TEXT,
      ADD COLUMN IF NOT EXISTS raw_payload JSONB;

  END IF;
END $$;

-- Orders: financial breakdown + billing columns
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS subtotal INTEGER NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  ADD COLUMN IF NOT EXISTS shipping_cost INTEGER NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  ADD COLUMN IF NOT EXISTS tax_amount INTEGER NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS billing_address JSONB;

-- Collections (merchandise grouping)
CREATE TABLE IF NOT EXISTS collections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url   TEXT,
  is_active   BOOLEAN DEFAULT true,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Collection-Product junction
CREATE TABLE IF NOT EXISTS collection_products (
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (collection_id, product_id)
);

ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;

-- Inventory reservations (orchestration)
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

-- Operational events (immutable audit timeline)
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

-- Idempotency keys (webhook/action dedup)
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key        TEXT PRIMARY KEY,
  status     TEXT NOT NULL DEFAULT 'processing',
  data       JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Role grants (RBAC tracking)
CREATE TABLE IF NOT EXISTS role_grants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE role_grants ENABLE ROW LEVEL SECURITY;

-- User addresses (customer shipping addresses, persisted)
CREATE TABLE IF NOT EXISTS user_addresses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label       TEXT NOT NULL DEFAULT 'Home',
  name        TEXT NOT NULL,
  line1       TEXT NOT NULL,
  line2       TEXT DEFAULT '',
  city        TEXT NOT NULL,
  state       TEXT NOT NULL,
  pincode     TEXT NOT NULL,
  phone       TEXT NOT NULL,
  is_primary  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

-- ─── 4. RLS Policies ────────────────────────────────────────────────────────

-- Collections
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Collections publicly readable' AND tablename = 'collections') THEN
    CREATE POLICY "Collections publicly readable" ON collections FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ops roles can manage collections' AND tablename = 'collections') THEN
    CREATE POLICY "Ops roles can manage collections" ON collections FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin', 'editorial')));
  END IF;
END $$;

-- Collection products
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Collection products publicly readable' AND tablename = 'collection_products') THEN
    CREATE POLICY "Collection products publicly readable" ON collection_products FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ops roles can manage collection products' AND tablename = 'collection_products') THEN
    CREATE POLICY "Ops roles can manage collection products" ON collection_products FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin', 'editorial')));
  END IF;
END $$;

-- Inventory reservations
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own reservations' AND tablename = 'inventory_reservations') THEN
    CREATE POLICY "Users can read own reservations" ON inventory_reservations FOR SELECT
      USING (reservation_owner = auth.uid());
  END IF;
END $$;

-- User INSERT on inventory_reservations removed — reservations only via
-- service_role / SECURITY DEFINER RPCs (reserve_inventory). See 100000_*.sql

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ops roles can read all reservations' AND tablename = 'inventory_reservations') THEN
    CREATE POLICY "Ops roles can read all reservations" ON inventory_reservations FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin', 'fulfillment', 'viewer')));
  END IF;
END $$;

-- Operational events — INSERT service_role only (never WITH CHECK (true))
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow insert operational events' AND tablename = 'operational_events') THEN
    DROP POLICY "Allow insert operational events" ON operational_events;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role inserts operational events' AND tablename = 'operational_events') THEN
    CREATE POLICY "Service role inserts operational events" ON operational_events FOR INSERT
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ops roles can read operational events' AND tablename = 'operational_events') THEN
    CREATE POLICY "Ops roles can read operational events" ON operational_events FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin', 'fulfillment', 'editorial', 'support', 'viewer')));
  END IF;
END $$;

-- Idempotency keys
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manages idempotency keys' AND tablename = 'idempotency_keys') THEN
    CREATE POLICY "Service role manages idempotency keys" ON idempotency_keys FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Role grants
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read role grants' AND tablename = 'role_grants') THEN
    CREATE POLICY "Admins can read role grants" ON role_grants FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin')));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert role grants' AND tablename = 'role_grants') THEN
    CREATE POLICY "Admins can insert role grants" ON role_grants FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'));
  END IF;
END $$;

-- User addresses
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own addresses' AND tablename = 'user_addresses') THEN
    CREATE POLICY "Users can read own addresses" ON user_addresses FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own addresses' AND tablename = 'user_addresses') THEN
    CREATE POLICY "Users can insert own addresses" ON user_addresses FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own addresses' AND tablename = 'user_addresses') THEN
    CREATE POLICY "Users can update own addresses" ON user_addresses FOR UPDATE
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own addresses' AND tablename = 'user_addresses') THEN
    CREATE POLICY "Users can delete own addresses" ON user_addresses FOR DELETE
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Products: ops write policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ops roles can insert products' AND tablename = 'products') THEN
    CREATE POLICY "Ops roles can insert products" ON products FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin', 'editorial')));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ops roles can update products' AND tablename = 'products') THEN
    CREATE POLICY "Ops roles can update products" ON products FOR UPDATE
      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin', 'editorial')));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ops roles can delete products' AND tablename = 'products') THEN
    CREATE POLICY "Ops roles can delete products" ON products FOR DELETE
      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin')));
  END IF;
END $$;

-- Variants: ops write policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ops roles can insert variants' AND tablename = 'product_variants') THEN
    CREATE POLICY "Ops roles can insert variants" ON product_variants FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin', 'editorial')));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ops roles can update variants' AND tablename = 'product_variants') THEN
    CREATE POLICY "Ops roles can update variants" ON product_variants FOR UPDATE
      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin', 'editorial')));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ops roles can delete variants' AND tablename = 'product_variants') THEN
    CREATE POLICY "Ops roles can delete variants" ON product_variants FOR DELETE
      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin')));
  END IF;
END $$;

-- Orders: ops read policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ops roles can read all orders' AND tablename = 'orders') THEN
    CREATE POLICY "Ops roles can read all orders" ON orders FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin', 'fulfillment', 'support', 'viewer')));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ops roles can update orders' AND tablename = 'orders') THEN
    CREATE POLICY "Ops roles can update orders" ON orders FOR UPDATE
      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin', 'fulfillment')));
  END IF;
END $$;

-- ─── 5. Indexes ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'is_active'
  ) THEN

    CREATE INDEX IF NOT EXISTS idx_products_active
      ON products(is_active)
      WHERE is_active = true;

  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'payment_intent_id'
  ) THEN

    CREATE INDEX IF NOT EXISTS idx_orders_payment
      ON orders(payment_intent_id);

  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'payment_intent_id'
  ) THEN

    CREATE INDEX IF NOT EXISTS idx_orders_payment_intent
      ON orders(payment_intent_id)
      WHERE payment_intent_id IS NOT NULL;

  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_events_user ON wallet_events(user_id);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wallet_events'
      AND column_name = 'type'
  ) THEN

    CREATE INDEX IF NOT EXISTS idx_wallet_events_type
      ON wallet_events(type);

  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'payment_events'
  ) THEN

    CREATE INDEX IF NOT EXISTS idx_payment_events_order
      ON payment_events(order_id);

    CREATE INDEX IF NOT EXISTS idx_payment_events_intent
      ON payment_events(stripe_payment_intent_id);

    CREATE INDEX IF NOT EXISTS idx_payment_events_stripe_event
      ON payment_events(stripe_event_id)
      WHERE stripe_event_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_payment_events_order_success
      ON payment_events(order_id, event_type)
      WHERE event_type = 'payment_intent.succeeded';

  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_reservations_owner ON inventory_reservations(reservation_owner);
CREATE INDEX IF NOT EXISTS idx_reservations_variant_state ON inventory_reservations(variant_id, reservation_state);
CREATE INDEX IF NOT EXISTS idx_reservations_expires ON inventory_reservations(expires_at) WHERE reservation_state IN ('pending', 'held');
CREATE INDEX IF NOT EXISTS idx_reservations_owner_state ON inventory_reservations(reservation_owner, reservation_state);
CREATE INDEX IF NOT EXISTS idx_reservations_order_id ON inventory_reservations(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_domain ON operational_events(domain);
CREATE INDEX IF NOT EXISTS idx_events_severity ON operational_events(severity);
CREATE INDEX IF NOT EXISTS idx_events_resource ON operational_events(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON operational_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_actor ON operational_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_events_domain_severity_created ON operational_events(domain, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_brand ON operational_events(brand_id) WHERE brand_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role) WHERE role IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_collections_active ON collections(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_col_prod_product ON collection_products(product_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_primary ON user_addresses(user_id, is_primary) WHERE is_primary = true;

-- ─── 6. Functions ──────────────────────────────────────────────────────────

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

-- Release expired reservations
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

-- Handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ─── 7. Triggers ────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_profiles_updated_at' AND tgrelid = 'profiles'::regclass) THEN
    CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_products_updated_at' AND tgrelid = 'products'::regclass) THEN
    CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_product_variants_updated_at' AND tgrelid = 'product_variants'::regclass) THEN
    CREATE TRIGGER set_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_cart_items_updated_at' AND tgrelid = 'cart_items'::regclass) THEN
    CREATE TRIGGER set_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_orders_updated_at' AND tgrelid = 'orders'::regclass) THEN
    CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_inventory_reservations_updated_at' AND tgrelid = 'inventory_reservations'::regclass) THEN
    CREATE TRIGGER set_inventory_reservations_updated_at BEFORE UPDATE ON inventory_reservations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_user_addresses_updated_at' AND tgrelid = 'user_addresses'::regclass) THEN
    CREATE TRIGGER set_user_addresses_updated_at BEFORE UPDATE ON user_addresses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- Auto-create profile on auth signup
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created' AND tgrelid = 'auth.users'::regclass) THEN
    CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- ─── 8. Realtime Publication ─────────────────────────────────────────────────

DO $$
DECLARE
  tbl TEXT;
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
-- End of final production hardening migration
-- ============================================================================
