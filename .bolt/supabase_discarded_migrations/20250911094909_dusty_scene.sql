/*
  # Fix missing get_current_user_role function

  1. New Functions
    - `get_current_user_role()` - Safely retrieves the role of the current authenticated user
    - Uses SECURITY DEFINER to bypass RLS when checking user roles
  
  2. Security
    - Function is secure and only returns the role of the authenticated user
    - Grants execute permission to authenticated users
    - Returns 'lettore' as default if no profile found
*/

-- Create or replace the get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the role of the current authenticated user
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Return the role or default to 'lettore' if no profile found
  RETURN COALESCE(user_role, 'lettore');
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;

-- Also grant to anon and service_role for completeness
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO service_role;

-- Verify the function was created successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_current_user_role' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    RAISE NOTICE 'Function get_current_user_role() created successfully!';
  ELSE
    RAISE EXCEPTION 'Failed to create get_current_user_role() function';
  END IF;
END $$;