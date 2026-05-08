-- ============================================================================
-- StreetPlayR — Production Hardening: Orchestration Integrity Fixes
-- ============================================================================
-- Fixes migration regressions and adds orchestration infrastructure:
--   1. Add order_id back to inventory_reservations (removed in 00003)
--   2. Fix order_status enum: 'pending' → 'pending_payment'
--   3. Add missing orders columns (subtotal, shipping_cost, tax_amount, currency)
--   4. Add inventory_reservations.updated_at
--   5. Add composite performance indexes
--   6. Create atomic checkout initiation RPC
--   7. Add brand_id to operational_events (future-ready)
-- ============================================================================

-- ─── 1. Restore order_id on inventory_reservations ──────────────────────────
-- Was present in 00001, removed when table was recreated in 00003.
-- Required for webhook → reservation linkage and order dossier assembly.

ALTER TABLE inventory_reservations
  ADD COLUMN order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_order_id
  ON inventory_reservations(order_id)
  WHERE order_id IS NOT NULL;

-- ─── 2. Add updated_at to inventory_reservations ────────────────────────────

ALTER TABLE inventory_reservations
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

CREATE OR REPLACE TRIGGER set_inventory_reservations_updated_at
  BEFORE UPDATE ON inventory_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── 3. Fix order_status enum ──────────────────────────────────────────────
-- JS code uses 'pending_payment' but DB enum has 'pending'.
-- Create corrected enum, migrate data, drop old.

CREATE TYPE order_status_correct AS ENUM (
  'draft', 'pending_payment', 'confirmed', 'on_hold', 'processing',
  'shipped', 'delivered', 'cancelled', 'refunded'
);

ALTER TABLE orders
  ALTER COLUMN status TYPE order_status_correct
  USING CASE status::text
    WHEN 'pending' THEN 'pending_payment'::order_status_correct
    ELSE status::text::order_status_correct
  END;

DROP TYPE order_status;

ALTER TYPE order_status_correct RENAME TO order_status;

-- ─── 4. Add missing columns to orders table ─────────────────────────────────
-- The JS OrderService references subtotal, shipping_cost, tax_amount, currency.
-- These were never added to the initial schema.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS subtotal INTEGER NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  ADD COLUMN IF NOT EXISTS shipping_cost INTEGER NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  ADD COLUMN IF NOT EXISTS tax_amount INTEGER NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'usd',
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add billing_address column for order dossiers
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS billing_address JSONB;

-- ─── 5. Add composite performance indexes ───────────────────────────────────

-- Operational events timeline queries (most common: filter by domain + severity, sorted by time)
CREATE INDEX IF NOT EXISTS idx_events_domain_severity_created
  ON operational_events(domain, severity, created_at DESC);

-- User order lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Order status timeline queries
CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON orders(status, created_at DESC);

-- Payment intent lookups (critical for webhook reconciliation)
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON orders(payment_intent_id)
  WHERE payment_intent_id IS NOT NULL;

-- Prevent duplicate payment successes for the same order
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_order_success
  ON payment_events(order_id, event_type)
  WHERE event_type = 'payment_intent.succeeded';

-- Profile role lookups (every OpsGuard check uses this)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ─── 6. Add brand_id to operational_events (future multi-brand) ─────────────

ALTER TABLE operational_events
  ADD COLUMN IF NOT EXISTS brand_id UUID;

CREATE INDEX IF NOT EXISTS idx_events_brand ON operational_events(brand_id)
  WHERE brand_id IS NOT NULL;

-- ─── 7. Atomic checkout initiation RPC ──────────────────────────────────────
-- Creates order, inserts line items, reserves inventory, and links
-- everything together in a single transaction.

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
  -- Server-authoritative calculation — never trust client prices
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_subtotal := v_subtotal + (v_item->>'quantity')::INTEGER * (v_item->>'price')::INTEGER;
  END LOOP;

  v_shipping := COALESCE((p_shipping_address->>'shipping_cost')::INTEGER, 0);
  v_tax := COALESCE((p_shipping_address->>'tax_amount')::INTEGER, 0);
  v_total := v_subtotal + v_shipping + v_tax;

  -- Determine initial order status
  v_order_status := CASE
    WHEN p_payment_intent_id IS NOT NULL THEN 'pending_payment'
    ELSE 'draft'
  END;

  -- Create order
  INSERT INTO orders (
    user_id, status, total, subtotal, shipping_cost, tax_amount,
    shipping_address, billing_address, payment_intent_id
  ) VALUES (
    p_user_id, v_order_status::order_status, v_total, v_subtotal, v_shipping, v_tax,
    p_shipping_address,
    COALESCE(p_billing_address, p_shipping_address),
    p_payment_intent_id
  )
  RETURNING id INTO v_order_id;

  -- Insert order items and reserve inventory
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

    -- Atomic reservation
    v_reservation_id := reserve_inventory(
      (v_item->>'variant_id')::UUID,
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      p_user_id,
      now() + (p_reservation_ttl_minutes || ' minutes')::INTERVAL
    );

    -- Link reservation to order
    UPDATE inventory_reservations
    SET order_id = v_order_id
    WHERE id = v_reservation_id;

    v_reservation_ids := array_append(v_reservation_ids, v_reservation_id);
  END LOOP;

  -- If payment intent provided, transition reservations to held
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

-- ─── 8. Verify all orders have a valid status after enum migration ─────────

UPDATE orders SET status = 'draft'::order_status
WHERE status IS NULL OR status::text NOT IN (
  'draft', 'pending_payment', 'confirmed', 'on_hold', 'processing',
  'shipped', 'delivered', 'cancelled', 'refunded'
);
