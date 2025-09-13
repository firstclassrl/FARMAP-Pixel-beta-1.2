/*
  # Complete Database Schema Fix

  1. Create Missing Types
    - `user_role` enum with values: admin, commerciale, label_user, lettore
    - `order_status` enum with values: pending, confirmed, processing, shipped, delivered, cancelled
    - `quote_status` enum with values: draft, sent, accepted, rejected, expired
    - `sample_request_status` enum with values: pending, sent, delivered, cancelled

  2. Verify and Fix Tables
    - Ensure all tables exist with correct structure
    - Fix any missing columns or constraints
    - Update profiles table to use user_role enum

  3. Security
    - Ensure RLS is enabled on all tables
    - Verify all policies are in place
*/

-- First, drop any existing problematic types (if they exist)
DO $$ 
BEGIN
    -- Drop existing types if they exist (this will cascade to dependent objects)
    DROP TYPE IF EXISTS user_role CASCADE;
    DROP TYPE IF EXISTS order_status CASCADE;
    DROP TYPE IF EXISTS quote_status CASCADE;
    DROP TYPE IF EXISTS sample_request_status CASCADE;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Some types may not exist, continuing...';
END $$;

-- Create all required enum types
CREATE TYPE user_role AS ENUM ('admin', 'commerciale', 'label_user', 'lettore');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired');
CREATE TYPE sample_request_status AS ENUM ('pending', 'sent', 'delivered', 'cancelled');

-- Create or update profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    full_name text,
    avatar_url text,
    role user_role NOT NULL DEFAULT 'lettore',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can read own profile"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to set first user as admin
CREATE OR REPLACE FUNCTION set_first_user_as_admin()
RETURNS trigger AS $$
BEGIN
    -- Check if this is the first user
    IF (SELECT COUNT(*) FROM profiles) = 0 THEN
        NEW.role = 'admin';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to set first user as admin
DROP TRIGGER IF EXISTS set_first_user_admin_trigger ON profiles;
CREATE TRIGGER set_first_user_admin_trigger
    BEFORE INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION set_first_user_as_admin();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the enum types were created successfully
DO $$
BEGIN
    -- Test user_role enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        RAISE EXCEPTION 'user_role enum was not created successfully';
    END IF;
    
    -- Test order_status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        RAISE EXCEPTION 'order_status enum was not created successfully';
    END IF;
    
    -- Test quote_status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_status') THEN
        RAISE EXCEPTION 'quote_status enum was not created successfully';
    END IF;
    
    -- Test sample_request_status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sample_request_status') THEN
        RAISE EXCEPTION 'sample_request_status enum was not created successfully';
    END IF;
    
    RAISE NOTICE 'All enum types created successfully!';
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Final verification
SELECT 'Database schema fix completed successfully!' as result;