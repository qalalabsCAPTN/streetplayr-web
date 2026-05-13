-- ============================================================================
-- StreetPlayR — Phase 1 Consolidation (NECTAR + OpsOS additions)
-- ============================================================================
-- Adds NECTAR loyalty engine tables/columns and OpsOS fulfillment columns.
-- FULLY IDEMPOTENT — safe to run on any DB state.
-- Must run BEFORE 99999_final_production_hardening.sql (which creates indexes).
-- ============================================================================

-- ─── 1. Profiles: NECTAR columns ────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0 CHECK (xp >= 0);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- ─── 2. Orders: fulfillment columns ─────────────────────────────────────────

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_number TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS carrier TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- ─── 3. Bonus campaigns (NECTAR) ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bonus_campaigns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  sprr_reward   INTEGER NOT NULL DEFAULT 0 CHECK (sprr_reward >= 0),
  xp_reward     INTEGER NOT NULL DEFAULT 0 CHECK (xp_reward >= 0),
  starts_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at       TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE bonus_campaigns ENABLE ROW LEVEL SECURITY;

-- ─── 4. Referral claims (NECTAR) ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS referral_claims (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bonus_sprr     INTEGER NOT NULL DEFAULT 0 CHECK (bonus_sprr >= 0),
  bonus_xp       INTEGER NOT NULL DEFAULT 0 CHECK (bonus_xp >= 0),
  status         TEXT NOT NULL DEFAULT 'pending',
  claimed_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (referred_id)
);

ALTER TABLE referral_claims ENABLE ROW LEVEL SECURITY;

-- ─── 5. Reward redemptions (NECTAR) ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  description   TEXT NOT NULL,
  sprr_cost     INTEGER NOT NULL CHECK (sprr_cost > 0),
  status        TEXT NOT NULL DEFAULT 'pending',
  redeemed_at   TIMESTAMPTZ DEFAULT now(),
  fulfilled_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

-- ─── 6. RLS Policies ─────────────────────────────────────────────────────────

-- Bonus campaigns: publicly readable, ops manageable
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Bonus campaigns publicly readable' AND tablename = 'bonus_campaigns') THEN
    CREATE POLICY "Bonus campaigns publicly readable" ON bonus_campaigns FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ops roles can manage bonus campaigns' AND tablename = 'bonus_campaigns') THEN
    CREATE POLICY "Ops roles can manage bonus campaigns" ON bonus_campaigns FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin')));
  END IF;
END $$;

-- Referral claims: user can read own (as referrer), ops can read all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own referral claims' AND tablename = 'referral_claims') THEN
    CREATE POLICY "Users can read own referral claims" ON referral_claims FOR SELECT
      USING (referrer_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ops roles can read all referral claims' AND tablename = 'referral_claims') THEN
    CREATE POLICY "Ops roles can read all referral claims" ON referral_claims FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin', 'viewer')));
  END IF;
END $$;

-- Reward redemptions: user can read own, ops can read all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own reward redemptions' AND tablename = 'reward_redemptions') THEN
    CREATE POLICY "Users can read own reward redemptions" ON reward_redemptions FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own reward redemptions' AND tablename = 'reward_redemptions') THEN
    CREATE POLICY "Users can insert own reward redemptions" ON reward_redemptions FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ops roles can read all reward redemptions' AND tablename = 'reward_redemptions') THEN
    CREATE POLICY "Ops roles can read all reward redemptions" ON reward_redemptions FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin', 'fulfillment', 'viewer')));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ops roles can update reward redemptions' AND tablename = 'reward_redemptions') THEN
    CREATE POLICY "Ops roles can update reward redemptions" ON reward_redemptions FOR UPDATE
      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin', 'fulfillment')));
  END IF;
END $$;

-- ─── 7. Realtime publication ─────────────────────────────────────────────────

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'bonus_campaigns', 'referral_claims', 'reward_redemptions'
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
-- End of Phase 1 consolidation migration
-- ============================================================================
