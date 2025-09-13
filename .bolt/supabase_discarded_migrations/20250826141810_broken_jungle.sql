/*
  # Fix products table RLS policies

  1. Security Policies
    - Add INSERT policy for authenticated users to create products
    - Add UPDATE policy for users to update their own products  
    - Add DELETE policy for users to delete their own products
    - Keep existing SELECT policy unchanged

  2. Changes
    - Allow authenticated users to insert products where created_by matches their user ID
    - Allow users to update products they created
    - Allow users to delete products they created
*/

-- Add INSERT policy for products table
CREATE POLICY "Users can create products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Add UPDATE policy for products table  
CREATE POLICY "Users can update own products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Add DELETE policy for products table
CREATE POLICY "Users can delete own products"
  ON products
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);