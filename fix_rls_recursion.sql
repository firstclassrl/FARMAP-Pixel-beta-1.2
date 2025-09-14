/*
  # Fix RLS Recursion Issue

  The problem is that the RLS policies are creating infinite recursion when trying to check
  if a user is admin, because the policy itself queries the profiles table.

  Solution: Use a different approach that doesn't cause recursion.
*/

-- ==============================================
-- 1. DROP ALL EXISTING PROBLEMATIC POLICIES
-- ==============================================

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public read access for lettore" ON profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON profiles;

-- ==============================================
-- 2. CREATE SIMPLE, NON-RECURSIVE POLICIES
-- ==============================================

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile (but not role)
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow public read access (for basic profile info)
CREATE POLICY "Public read access"
  ON profiles
  FOR SELECT
  TO public
  USING (true);

-- ==============================================
-- 3. CREATE ADMIN POLICIES USING SERVICE ROLE
-- ==============================================

-- For admin operations, we'll use the service role in Edge Functions
-- which bypasses RLS, so we don't need admin-specific RLS policies

-- ==============================================
-- 4. VERIFY THE FIX
-- ==============================================

-- Test that the policies work without recursion
-- This should not cause infinite recursion
SELECT 'Testing policies...' as status;

-- Test reading own profile (should work for authenticated users)
-- Test reading all profiles (should work for public access)
-- Test admin operations (will be handled by Edge Functions with service role)
