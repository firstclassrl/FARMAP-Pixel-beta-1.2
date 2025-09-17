/*
  # Fix products table RLS policies

  1. Security Changes
    - Drop problematic RLS policies that reference non-existent role column
    - Create simplified RLS policies using auth.uid() directly
    - Remove dependency on get_user_role() function

  2. Policy Updates
    - SELECT: Allow public read access for users with profiles
    - INSERT: Allow authenticated users to create products (with created_by = auth.uid())
    - UPDATE: Allow users to update their own products
    - DELETE: Allow users to delete their own products
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admin can delete any product, users can delete own" ON products;
DROP POLICY IF EXISTS "Users can update own products" ON products;
DROP POLICY IF EXISTS "Users can create products" ON products;
DROP POLICY IF EXISTS "Commerciale can read products" ON products;

-- Create new simplified policies
CREATE POLICY "Allow public read access to products"
  ON products
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Allow authenticated users to create products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow users to update own products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow users to delete own products"
  ON products
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);