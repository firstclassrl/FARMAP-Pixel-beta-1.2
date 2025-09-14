/*
  # Fix RLS Policies for Profiles Table - User Management

  Problem: The current RLS policies only allow users to read their own profile,
  but admins need to be able to read all profiles for user management.

  Solution: Add admin policies that allow admins to read, update, and manage all profiles.

  1. Add admin read policy for all profiles
  2. Add admin update policy for all profiles  
  3. Add admin insert policy for profile creation
  4. Keep existing user policies for self-management
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public read access for lettore" ON profiles;

-- Create comprehensive RLS policies for profiles table

-- 1. Admin can read all profiles (for user management)
CREATE POLICY "Admin can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 2. Admin can update all profiles (for user management)
CREATE POLICY "Admin can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 3. Admin can insert profiles (for user creation)
CREATE POLICY "Admin can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 4. Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 5. Users can update their own profile (but not role)
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- 6. Users can insert their own profile (for self-registration)
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 7. Public read access for lettore role (if needed for public features)
CREATE POLICY "Public read access for lettore"
  ON profiles
  FOR SELECT
  TO public
  USING (true);
