/*
  # Fix profiles table RLS policy for user creation

  1. Security Changes
    - Add INSERT policy for authenticated users to create their own profiles
    - Ensure users can only create profiles with their own auth.uid()
    - Fix the existing policies to work properly with profile creation

  2. Policy Updates
    - Allow authenticated users to insert their own profile
    - Maintain existing read/update restrictions
    - Ensure proper security with auth.uid() checks
*/

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;

-- Create comprehensive RLS policies for profiles table
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow public read access for lettore role (as per existing policies)
CREATE POLICY "Public read access for lettore"
  ON profiles
  FOR SELECT
  TO public
  USING (true);