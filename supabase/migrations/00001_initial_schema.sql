-- ============================================================================
-- StreetPlayR — Initial Schema
-- ============================================================================
-- UUID PKs everywhere, enum-driven states, timestamped orchestration trails,
-- soft lifecycle transitions, RLS enabled on all user-facing tables.
-- ============================================================================

-- ─── Enums ──────────────────────────────────────────────────────────────────

CREATE TYPE order_status AS ENUM (
  'pending', 'allocated', 'confirmed', 'processing',
  'shipped', 'delivered', 'cancelled', 'refunded'
);

CREATE TYPE reservation_status AS ENUM (
  'active', 'held', 'expired', 'converted', 'released'
);

CREATE TYPE payment_status AS ENUM (
  'requires_payment_method', 'requires_confirmation', 'processing',
  'succeeded', 'failed', 'refunded'
);

CREATE TYPE transaction_type AS ENUM (
  'earned', 'spent', 'refund', 'adjustment', 'referral_bonus'
);

CREATE TYPE wallet_event_type AS ENUM (
  'credit', 'debit', 'hold', 'release', 'expiry'
);

-- ─── Profiles ───────────────────────────────────────────────────────────────
-- User profile, auto-created via trigger on auth.users insert.

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  referral_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  wallet_id   TEXT,
  joined_from TEXT DEFAULT 'direct',
  is_onboarded BOOLEAN DEFAULT false,
  sprr_balance INTEGER DEFAULT 0 NOT NULL CHECK (sprr_balance >= 0),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on auth signup
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

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─── Categories ─────────────────────────────────────────────────────────────

CREATE TABLE categories (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL,
  slug  TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  USING (true);

-- ─── Products ───────────────────────────────────────────────────────────────

CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  price       INTEGER NOT NULL CHECK (price >= 0),
  image_url   TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  metadata    JSONB DEFAULT '{}'::jsonb,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are publicly readable"
  ON products FOR SELECT
  USING (true);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;

-- ─── Product Variants ───────────────────────────────────────────────────────

CREATE TABLE product_variants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color          TEXT,
  size           TEXT,
  stock_quantity INTEGER DEFAULT 0 NOT NULL CHECK (stock_quantity >= 0),
  price_override INTEGER CHECK (price_override >= 0),
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (product_id, color, size)
);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variants are publicly readable"
  ON product_variants FOR SELECT
  USING (true);

CREATE INDEX idx_variants_product ON product_variants(product_id);

-- ─── Cart Items ─────────────────────────────────────────────────────────────

CREATE TABLE cart_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  variant_id TEXT DEFAULT 'default',
  quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  metadata   JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own cart"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart"
  ON cart_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_cart_user ON cart_items(user_id);

-- ─── Orders ─────────────────────────────────────────────────────────────────

CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status            order_status DEFAULT 'pending',
  total             INTEGER NOT NULL CHECK (total >= 0),
  shipping_address  JSONB NOT NULL DEFAULT '{}'::jsonb,
  payment_intent_id TEXT,
  metadata          JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment ON orders(payment_intent_id);

-- ─── Order Items ────────────────────────────────────────────────────────────

CREATE TABLE order_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  price      INTEGER NOT NULL CHECK (price >= 0),
  metadata   JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own order items"
  ON order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ─── Wallet Transactions ────────────────────────────────────────────────────

CREATE TABLE wallet_transactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       transaction_type NOT NULL,
  delta      INTEGER NOT NULL,
  source     TEXT NOT NULL DEFAULT '',
  metadata   JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wallet transactions"
  ON wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_wallet_tx_user ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_tx_created ON wallet_transactions(created_at DESC);

-- ─── Inventory Reservations ─────────────────────────────────────────────────
-- Orchestration layer for allocation pressure and scarcity intelligence.

CREATE TABLE inventory_reservations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID REFERENCES orders(id) ON DELETE SET NULL,
  product_variant_id UUID NOT NULL REFERENCES product_variants(id),
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  status            reservation_status DEFAULT 'active',
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  converted_at      TIMESTAMPTZ,
  released_at       TIMESTAMPTZ
);

ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reservations"
  ON inventory_reservations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = inventory_reservations.order_id
    AND orders.user_id = auth.uid()
  ));

CREATE INDEX idx_reservations_variant ON inventory_reservations(product_variant_id);
CREATE INDEX idx_reservations_status ON inventory_reservations(status);
CREATE INDEX idx_reservations_order ON inventory_reservations(order_id);

-- ─── Payment Events ─────────────────────────────────────────────────────────
-- Immutable audit trail for all payment lifecycle transitions.

CREATE TABLE payment_events (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  status                  payment_status NOT NULL DEFAULT 'requires_payment_method',
  amount                  INTEGER NOT NULL CHECK (amount >= 0),
  currency                TEXT DEFAULT 'usd',
  metadata                JSONB DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payment events"
  ON payment_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = payment_events.order_id
    AND orders.user_id = auth.uid()
  ));

CREATE INDEX idx_payment_events_order ON payment_events(order_id);
CREATE INDEX idx_payment_events_intent ON payment_events(stripe_payment_intent_id);

-- ─── Wallet Events ──────────────────────────────────────────────────────────
-- Immutable event log for wallet economic actions. Remains dormant until
-- wallet economy is fully operational.

CREATE TABLE wallet_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type         wallet_event_type NOT NULL,
  amount       INTEGER NOT NULL CHECK (amount >= 0),
  source       TEXT NOT NULL DEFAULT '',
  reference_id UUID,
  metadata     JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE wallet_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wallet events"
  ON wallet_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_wallet_events_user ON wallet_events(user_id);
CREATE INDEX idx_wallet_events_type ON wallet_events(type);

-- ─── Updated-at Trigger Helper ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── Seed ──────────────────────────────────────────────────────────────────

INSERT INTO categories (name, slug) VALUES
  ('Apparel', 'apparel'),
  ('Headwear', 'headwear'),
  ('Accessories', 'accessories');
