-- ============================================================================
-- StreetPlayR — Nectar Merge: Progression, Referrals, Wallet Audit
-- ============================================================================
-- Adapts Nectar 2.0 patterns (streaks, referral graph, wallet audit) into
-- the existing StreetPlayR schema. Fully idempotent.
-- Must run AFTER 00008_phase1_consolidation.sql.
-- ============================================================================

-- ─── 1. Profiles: progression columns ───────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS current_streak_days INTEGER DEFAULT 0 CHECK (current_streak_days >= 0);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS longest_streak_days INTEGER DEFAULT 0 CHECK (longest_streak_days >= 0);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS lifetime_xp BIGINT DEFAULT 0 CHECK (lifetime_xp >= 0);

-- ─── 2. Referral edges (referral graph) ────────────────────────────────────
-- Adjacency list for network traversal. Maps who brought whom.

CREATE TABLE IF NOT EXISTS referral_edges (
  referrer_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  depth            INTEGER NOT NULL DEFAULT 1,
  referral_id      UUID REFERENCES referral_claims(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (referrer_id, referred_user_id)
);

ALTER TABLE referral_edges ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_referral_edges_referrer ON referral_edges(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_edges_referred ON referral_edges(referred_user_id);

-- RLS: user can read own referral edges (as referrer)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own referral edges' AND tablename = 'referral_edges') THEN
    CREATE POLICY "Users can read own referral edges" ON referral_edges FOR SELECT
      USING (referrer_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ops roles can read referral edges' AND tablename = 'referral_edges') THEN
    CREATE POLICY "Ops roles can read referral edges" ON referral_edges FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin')));
  END IF;
END $$;

-- ─── 3. Manual wallet adjustments (audit trail) ─────────────────────────────

CREATE TABLE IF NOT EXISTS manual_wallet_adjustments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ops_user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  adjustment_type  TEXT NOT NULL CHECK (adjustment_type IN ('credit', 'debit')),
  amount           INTEGER NOT NULL CHECK (amount > 0),
  reason           TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE manual_wallet_adjustments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_manual_adj_user ON manual_wallet_adjustments(user_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ops roles manage manual adjustments' AND tablename = 'manual_wallet_adjustments') THEN
    CREATE POLICY "Ops roles manage manual adjustments" ON manual_wallet_adjustments FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'ops_admin')));
  END IF;
END $$;

-- ─── 4. Streak update function (adapted from Nectar increment_user_xp) ──────

CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_last_active TIMESTAMPTZ;
  v_now         TIMESTAMPTZ := NOW();
  v_today       DATE        := CURRENT_DATE;
  v_last_date   DATE;
BEGIN
  SELECT last_active_at INTO v_last_active
  FROM profiles
  WHERE id = p_user_id;

  v_last_date := v_last_active::DATE;

  UPDATE profiles
  SET
    current_streak_days = CASE
      WHEN v_last_active IS NULL THEN 1
      WHEN v_last_date = v_today THEN current_streak_days
      WHEN v_last_date = v_today - INTERVAL '1 day' THEN current_streak_days + 1
      ELSE 1
    END,
    longest_streak_days = GREATEST(longest_streak_days,
      CASE
        WHEN v_last_active IS NULL THEN 1
        WHEN v_last_date = v_today - INTERVAL '1 day' THEN current_streak_days + 1
        ELSE 1
      END
    ),
    last_active_at = v_now
  WHERE id = p_user_id;
END;
$$;

-- ─── 5. Realtime publication for new tables ─────────────────────────────────

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'referral_edges', 'manual_wallet_adjustments'
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
-- End of Nectar merge migration
-- ============================================================================
