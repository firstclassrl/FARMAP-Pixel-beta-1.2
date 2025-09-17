/*
  # Fix DELETE policies for customers and products

  1. New Functions
    - `get_user_role()` - Securely retrieves the role of the current authenticated user
  
  2. Updated Policies
    - Drop and recreate DELETE policies for customers table
    - Drop and recreate DELETE policies for products table
    - Allow admin users to delete any record
    - Allow regular users to delete only their own created records
  
  3. Security
    - Function uses SECURITY DEFINER to bypass RLS when checking user roles
    - Policies maintain proper access control based on user roles
*/

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role, 'lettore');
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- Drop existing DELETE policies for customers
DROP POLICY IF EXISTS "Users can delete own customers" ON public.customers;

-- Create new DELETE policy for customers
CREATE POLICY "Admin can delete any customer, users can delete own"
  ON public.customers
  FOR DELETE
  TO authenticated
  USING (
    public.get_user_role() = 'admin' OR 
    auth.uid() = created_by
  );

-- Drop existing DELETE policies for products
DROP POLICY IF EXISTS "Users can delete own products" ON public.products;

-- Create new DELETE policy for products
CREATE POLICY "Admin can delete any product, users can delete own"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (
    public.get_user_role() = 'admin' OR 
    auth.uid() = created_by
  );