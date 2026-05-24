-- ─── Migration 00013: Go-Live Enhancements ───────────────────────────────────
-- 1. Welcome bonus idempotency guard on profiles
-- 2. Performance indexes on wallet_transactions
-- 3. site_id column on wallet_transactions (if not exists, for multi-site filtering)

-- 1. Welcome bonus tracking (prevents double grant)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'welcome_bonus_granted'
  ) THEN
    ALTER TABLE profiles ADD COLUMN welcome_bonus_granted BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- 2. wallet_transactions: ensure description column exists (added here for real tx labels)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallet_transactions' AND column_name = 'description'
  ) THEN
    ALTER TABLE wallet_transactions ADD COLUMN description TEXT;
  END IF;
END $$;

-- 3. Index: user_id + created_at for wallet page transaction queries
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_created
  ON wallet_transactions (user_id, created_at DESC);

-- 4. Index: user_id on reward_redemptions for customer rewards page
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user
  ON reward_redemptions (user_id, created_at DESC);

-- 5. Index: status on reward_redemptions for admin fulfillment queue
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status
  ON reward_redemptions (status, created_at ASC);
