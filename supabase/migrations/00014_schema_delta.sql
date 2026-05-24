-- ─── Migration 00014: Schema Delta — Add Missing Columns & Tables ────────────
-- This migration only adds what is confirmed missing from the live DB.
-- All statements are guarded with IF NOT EXISTS / DO $$ checks.
-- Safe to run multiple times.

-- ─── 1. profiles: add missing columns ────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='sprr_balance') THEN
    ALTER TABLE profiles ADD COLUMN sprr_balance INTEGER NOT NULL DEFAULT 0 CHECK (sprr_balance >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='welcome_bonus_granted') THEN
    ALTER TABLE profiles ADD COLUMN welcome_bonus_granted BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='referral_code') THEN
    ALTER TABLE profiles ADD COLUMN referral_code TEXT UNIQUE DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='username') THEN
    ALTER TABLE profiles ADD COLUMN username TEXT UNIQUE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='joined_from') THEN
    ALTER TABLE profiles ADD COLUMN joined_from TEXT DEFAULT 'direct';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='is_onboarded') THEN
    ALTER TABLE profiles ADD COLUMN is_onboarded BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='tier') THEN
    ALTER TABLE profiles ADD COLUMN tier TEXT DEFAULT 'STREET';
  END IF;
END $$;

-- ─── 2. wallet_transactions table ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  delta       INTEGER NOT NULL,
  source      TEXT NOT NULL,
  description TEXT,
  site_id     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own wallet transactions' AND tablename = 'wallet_transactions') THEN
    ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can read own wallet transactions" ON wallet_transactions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- ─── 3. referral_claims: ensure all columns exist ────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='referral_claims' AND column_name='referred_id') THEN
    ALTER TABLE referral_claims ADD COLUMN referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='referral_claims' AND column_name='referrer_id') THEN
    ALTER TABLE referral_claims ADD COLUMN referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='referral_claims' AND column_name='bonus_sprr') THEN
    ALTER TABLE referral_claims ADD COLUMN bonus_sprr INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='referral_claims' AND column_name='bonus_xp') THEN
    ALTER TABLE referral_claims ADD COLUMN bonus_xp INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='referral_claims' AND column_name='status') THEN
    ALTER TABLE referral_claims ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- ─── 4. reward_redemptions: ensure description column exists ─────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reward_redemptions' AND column_name='description') THEN
    ALTER TABLE reward_redemptions ADD COLUMN description TEXT;
  END IF;
END $$;

-- ─── 5. Performance indexes ───────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_created
  ON wallet_transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user
  ON reward_redemptions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status
  ON reward_redemptions (status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_profiles_referral_code
  ON profiles (referral_code);

-- ─── 6. handle_new_user trigger: create profile with sprr_balance ─────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, sprr_balance, xp, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    0,
    0,
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
