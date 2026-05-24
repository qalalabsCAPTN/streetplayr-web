-- ============================================================================
-- StreetPlayR — Multi-Site Foundation
-- ============================================================================
-- Creates the sites registry, per-site config, and wires existing tables
-- (wallet_transactions, events) with a site_id origin column.
-- Fully idempotent. Run AFTER 00009_nectar_merge.sql.
-- ============================================================================

-- ─── 1. Sites registry ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sites (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT    UNIQUE NOT NULL,      -- 'streetplayr' | 'playr' | etc.
  name        TEXT    NOT NULL,
  domain      TEXT,                         -- 'streetplayr.com'
  color       TEXT    DEFAULT '#6366F1',    -- brand accent hex
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- Only super_admin can manage sites
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Super admin manages sites' AND tablename = 'sites'
  ) THEN
    CREATE POLICY "Super admin manages sites" ON sites FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.role IN ('super_admin')
        )
      );
  END IF;
END $$;

-- All ops roles can read sites
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Ops roles read sites' AND tablename = 'sites'
  ) THEN
    CREATE POLICY "Ops roles read sites" ON sites FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
            AND p.role IN ('super_admin', 'ops_admin', 'support', 'growth', 'finance', 'campaign_manager')
        )
      );
  END IF;
END $$;

-- ─── 2. Per-site configuration ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS site_configs (
  site_id           UUID    PRIMARY KEY REFERENCES sites(id) ON DELETE CASCADE,
  -- Points economy
  earn_rate         NUMERIC NOT NULL DEFAULT 1.0,    -- points per ₹ spent
  redeem_rate       NUMERIC NOT NULL DEFAULT 0.01,   -- ₹ per point redeemed
  min_redeem_points INTEGER NOT NULL DEFAULT 100,
  max_redeem_pct    NUMERIC NOT NULL DEFAULT 0.20,   -- max 20% of order value
  -- Tier multipliers (jsonb: { "bloom": 1.5, "nectar": 2.0, "apex": 3.0 })
  tier_multipliers  JSONB   NOT NULL DEFAULT '{}',
  -- Branding overrides for page editor
  branding          JSONB   NOT NULL DEFAULT '{}',
  -- Cross-site redemption: can points earned here be spent elsewhere?
  allow_cross_site_redeem BOOLEAN NOT NULL DEFAULT true,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE site_configs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Ops roles read site_configs' AND tablename = 'site_configs'
  ) THEN
    CREATE POLICY "Ops roles read site_configs" ON site_configs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
            AND p.role IN ('super_admin', 'ops_admin', 'growth', 'finance', 'campaign_manager')
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Super admin manages site_configs' AND tablename = 'site_configs'
  ) THEN
    CREATE POLICY "Super admin manages site_configs" ON site_configs FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.role = 'super_admin'
        )
      );
  END IF;
END $$;

-- ─── 3. site_id origin column on wallet_transactions ─────────────────────────
-- Records WHICH site originated the earn/spend event.
-- NULL = legacy transactions before multi-site (treated as streetplayr).

ALTER TABLE wallet_transactions
  ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_wallet_txn_site ON wallet_transactions(site_id);

-- ─── 4. site_id origin column on events ──────────────────────────────────────

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_site ON events(site_id);

-- ─── 5. Admin context: active site per ops user ──────────────────────────────
-- Persists which site the admin last selected across sessions.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS active_site_id UUID REFERENCES sites(id) ON DELETE SET NULL;

-- ─── 6. Site access grants (which ops users can manage which sites) ──────────

CREATE TABLE IF NOT EXISTS site_access (
  site_id     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  granted_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (site_id, user_id)
);

ALTER TABLE site_access ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Super admin manages site_access' AND tablename = 'site_access'
  ) THEN
    CREATE POLICY "Super admin manages site_access" ON site_access FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.role = 'super_admin'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users read own site_access' AND tablename = 'site_access'
  ) THEN
    CREATE POLICY "Users read own site_access" ON site_access FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ─── 7. Seed: StreetPlayR as first site ──────────────────────────────────────

INSERT INTO sites (slug, name, domain, color)
VALUES ('streetplayr', 'StreetPlayR', 'streetplayr.com', '#F5A800')
ON CONFLICT (slug) DO NOTHING;

-- Insert default config for streetplayr
INSERT INTO site_configs (site_id, earn_rate, redeem_rate, min_redeem_points, tier_multipliers)
SELECT
  id,
  1.0,
  0.01,
  100,
  '{"sprout": 1.25, "bloom": 1.5, "nectar": 2.0, "apex": 3.0}'::jsonb
FROM sites WHERE slug = 'streetplayr'
ON CONFLICT (site_id) DO NOTHING;

-- Backfill: tag all existing wallet_transactions as streetplayr origin
UPDATE wallet_transactions
SET site_id = (SELECT id FROM sites WHERE slug = 'streetplayr')
WHERE site_id IS NULL;

-- Backfill: tag all existing events as streetplayr origin
UPDATE events
SET site_id = (SELECT id FROM sites WHERE slug = 'streetplayr')
WHERE site_id IS NULL;

-- ─── 8. Helper function: get site_id by slug ─────────────────────────────────

CREATE OR REPLACE FUNCTION get_site_id(p_slug TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT id FROM sites WHERE slug = p_slug LIMIT 1;
$$;
