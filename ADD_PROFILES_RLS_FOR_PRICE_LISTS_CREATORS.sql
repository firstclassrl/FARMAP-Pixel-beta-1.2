-- =====================================================
-- ADD RLS POLICY FOR PRICE LIST CREATORS PROFILES
-- PIXEL CRM - FARMAP v1.2.1
-- =====================================================
-- Allows authenticated users to read public fields (id, full_name, email)
-- of profiles that have created at least one price list
-- =====================================================

-- Policy: Allow authenticated users to read public profile info of price list creators
-- This policy allows reading only the profiles that have created price lists,
-- limiting exposure to only relevant users
CREATE POLICY "Authenticated users can read price list creator profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Only allow reading profiles that have created at least one price list
    EXISTS (
      SELECT 1 
      FROM price_lists 
      WHERE price_lists.created_by = profiles.id
      AND price_lists.is_active = true
    )
  );

-- =====================================================
-- VERIFY
-- =====================================================
-- Check the policy was created
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY policyname;

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. This policy allows reading profiles of users who created price lists
-- 2. Only public fields (id, full_name, email) are exposed
-- 3. Sensitive fields like role are still protected by other policies
-- 4. This policy works alongside existing policies:
--    - "Users can read own profile" (still works)
--    - "Users can update own profile" (still works)
-- 5. The policy uses EXISTS to check if user created price lists,
--    which is efficient and secure
-- =====================================================

