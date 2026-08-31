-- --- 00017: Harden profiles table --------------------------------------------------------
-- Prevent normal users from escalating their own privileges (role, tier, balance)
-- by calling the profiles UPDATE policy directly via the API.

CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $
BEGIN
  -- Service role bypasses all checks
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Check if any restricted fields are being modified
  IF (OLD.role IS DISTINCT FROM NEW.role) OR
     (OLD.tier IS DISTINCT FROM NEW.tier) OR
     (OLD.sprr_balance IS DISTINCT FROM NEW.sprr_balance) OR
     (OLD.xp IS DISTINCT FROM NEW.xp) OR
     (OLD.lifetime_xp IS DISTINCT FROM NEW.lifetime_xp) OR
     (OLD.welcome_bonus_granted IS DISTINCT FROM NEW.welcome_bonus_granted) THEN
     
     -- Verify if the acting user is an authorized admin
     IF NOT EXISTS (
       SELECT 1 FROM profiles 
       WHERE id = auth.uid() 
         AND role IN ('super_admin', 'ops_admin')
     ) THEN
       RAISE EXCEPTION 'Unauthorized: Cannot modify protected profile fields directly. Please contact support.';
     END IF;
  END IF;

  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_profile_fields_trigger ON profiles;
CREATE TRIGGER protect_profile_fields_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_fields();
