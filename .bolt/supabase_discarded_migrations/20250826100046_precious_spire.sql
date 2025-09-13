/*
  # Create user_role enum type

  1. New Types
    - `user_role` enum with values: admin, commerciale, label_user, lettore
  
  2. Purpose
    - Defines the available user roles for the profiles table
    - Ensures data consistency for user permissions
    
  3. Notes
    - Safe to run multiple times (checks if type already exists)
    - Required for proper functioning of the profiles table and user management
*/

-- Create user_role enum type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'commerciale', 'label_user', 'lettore');
  END IF;
END $$;