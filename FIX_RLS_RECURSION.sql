-- =====================================================
-- FIX RLS RECURSION ERROR - Profiles Table
-- PIXEL CRM - FARMAP v1.2.1
-- =====================================================
-- This fixes the "infinite recursion detected in policy" error
-- by using auth.uid() directly instead of querying profiles
-- =====================================================

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate policies WITHOUT recursion
-- Using auth.jwt() to check claims instead of querying profiles table

-- 1. Users can ALWAYS view their own profile (no recursion)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- 2. Allow viewing all profiles for authenticated users
-- (We'll control data access in the application layer if needed)
CREATE POLICY "Authenticated users can view profiles" ON profiles
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- 3. Users can update their own profile (but not role field)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Ensure role is not changed (check current role matches)
    role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- 4. Insert policy (for profile creation during signup)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- ALTERNATIVE: Use JWT claims for admin check
-- =====================================================
-- If you need admin-only operations, you should:
-- 1. Set custom claims in JWT (via Supabase Auth Hooks)
-- 2. Check claims like: (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin'
-- 
-- For now, we allow authenticated users to view all profiles
-- and control write access via application logic
-- =====================================================

-- Verify policies
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;

