/*
  # Complete Fix for User Management Issues

  This migration fixes the following problems:
  1. RLS policies preventing admins from reading all profiles
  2. Missing profile creation in user creation process
  3. Proper admin permissions for user management

  Run this migration to fix the user management functionality.
*/

-- ==============================================
-- 1. FIX RLS POLICIES FOR PROFILES TABLE
-- ==============================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public read access for lettore" ON profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON profiles;

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

-- ==============================================
-- 2. CREATE TRIGGER FOR AUTOMATIC PROFILE CREATION
-- ==============================================

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Check if created_at and updated_at columns exist
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
    -- Insert with timestamp columns
    INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', new.email),
      COALESCE(new.raw_user_meta_data->>'role', 'lettore')::user_role,
      now(),
      now()
    );
  ELSE
    -- Insert without timestamp columns
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', new.email),
      COALESCE(new.raw_user_meta_data->>'role', 'lettore')::user_role
    );
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================
-- 3. ENSURE PROFILES TABLE HAS REQUIRED COLUMNS
-- ==============================================

-- Add created_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
    END IF;
END $$;

-- ==============================================
-- 4. VERIFY EXISTING USERS HAVE PROFILES
-- ==============================================

-- Create profiles for any existing auth users that don't have profiles
DO $$ 
BEGIN
    -- Check if created_at column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
        -- Insert with timestamp columns
        INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
        SELECT 
          au.id,
          au.email,
          COALESCE(au.raw_user_meta_data->>'full_name', au.email),
          COALESCE(au.raw_user_meta_data->>'role', 'lettore')::user_role,
          COALESCE(au.created_at, now()),
          COALESCE(au.updated_at, now())
        FROM auth.users au
        LEFT JOIN public.profiles p ON au.id = p.id
        WHERE p.id IS NULL;
    ELSE
        -- Insert without timestamp columns
        INSERT INTO public.profiles (id, email, full_name, role)
        SELECT 
          au.id,
          au.email,
          COALESCE(au.raw_user_meta_data->>'full_name', au.email),
          COALESCE(au.raw_user_meta_data->>'role', 'lettore')::user_role
        FROM auth.users au
        LEFT JOIN public.profiles p ON au.id = p.id
        WHERE p.id IS NULL;
    END IF;
END $$;

-- ==============================================
-- 4. GRANT NECESSARY PERMISSIONS
-- ==============================================

-- Ensure the service role can manage profiles (for Edge Functions)
GRANT ALL ON public.profiles TO service_role;

-- ==============================================
-- 5. VERIFICATION QUERIES
-- ==============================================

-- These queries can be run to verify the fix:
-- SELECT 'Profiles count:' as info, count(*) as count FROM public.profiles;
-- SELECT 'Auth users count:' as info, count(*) as count FROM auth.users;
-- SELECT 'Admin users:' as info, count(*) as count FROM public.profiles WHERE role = 'admin';
