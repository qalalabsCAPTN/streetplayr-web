-- ============================================================================
-- StreetPlayR — Role-Based Access Control
-- ============================================================================
-- Adds operator/admin role infrastructure for OpsOS route protection.
-- ============================================================================

CREATE TYPE user_role AS ENUM ('member', 'operator', 'admin');

ALTER TABLE profiles
  ADD COLUMN role user_role DEFAULT 'member';

-- Operators and admins can read all profiles (for OpsOS user management)
CREATE POLICY "Operators can read all profiles"
  ON profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('operator', 'admin')
  ));

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Seed initial admin (replace with actual UUID after first user signup)
-- UPDATE profiles SET role = 'admin' WHERE id = '<your-admin-uuid>';
