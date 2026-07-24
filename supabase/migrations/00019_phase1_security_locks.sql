-- 00019_phase1_security_locks.sql
-- Phase 1 Security: lock privileged profile columns + force member on signup.
-- Safe to re-run.

-- ─── 1. Signup: NEVER trust client metadata for role ─────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.raw_user_meta_data ->> 'avatar_url',
    'member'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url);
    -- role intentionally NOT updated from client metadata
  RETURN NEW;
END;
$$;

-- ─── 2. Trigger: strip privileged column updates from non-service_role ───────
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Only service_role may change privileged columns (nectar engine, ops adjustments).
  IF coalesce(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role := OLD.role;
  END IF;
  IF NEW.sprr_balance IS DISTINCT FROM OLD.sprr_balance THEN
    NEW.sprr_balance := OLD.sprr_balance;
  END IF;
  IF NEW.xp IS DISTINCT FROM OLD.xp THEN
    NEW.xp := OLD.xp;
  END IF;
  IF NEW.welcome_bonus_granted IS DISTINCT FROM OLD.welcome_bonus_granted THEN
    NEW.welcome_bonus_granted := OLD.welcome_bonus_granted;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- ─── 3. Tighten operational_events insert (no anon flood) ────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Allow insert operational events'
      AND tablename = 'operational_events'
  ) THEN
    DROP POLICY "Allow insert operational events" ON operational_events;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Service role inserts operational events'
      AND tablename = 'operational_events'
  ) THEN
    CREATE POLICY "Service role inserts operational events"
      ON operational_events FOR INSERT
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;
