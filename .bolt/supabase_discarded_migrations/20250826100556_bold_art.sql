/*
  # Fix user_role enum type error

  1. Database Types
    - Creates `user_role` enum type with values: admin, commerciale, label_user, lettore
    - Safe creation with IF NOT EXISTS check
    
  2. Security
    - No RLS changes needed for enum types
    
  3. Notes
    - This migration fixes the "type user_role does not exist" error
    - Safe to run multiple times
    - Required for user creation functionality
*/

-- Create user_role enum type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'commerciale', 'label_user', 'lettore');
    END IF;
END $$;

-- Verify the type was created successfully
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        RAISE NOTICE 'user_role enum type created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create user_role enum type';
    END IF;
END $$;