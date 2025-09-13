/*
  # Fix products table DELETE RLS policy

  1. Security
    - Ensure DELETE policy exists for products table
    - Allow users to delete only their own product records
    - Policy checks that auth.uid() matches created_by field
*/

-- Drop existing DELETE policy if it exists to recreate it properly
DROP POLICY IF EXISTS "Users can delete own products" ON products;

-- Create DELETE policy for products table
CREATE POLICY "Users can delete own products"
  ON products
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);