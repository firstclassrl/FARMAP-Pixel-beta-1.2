/*
  # Add missing RLS policies for orders table

  1. Security
    - Add INSERT policy for authenticated users to create orders they own
    - Add UPDATE policy for users to update their own orders
    - Add DELETE policy for users to delete their own orders

  The existing SELECT policy remains unchanged.
*/

-- Add INSERT policy for orders
CREATE POLICY "Users can create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Add UPDATE policy for orders
CREATE POLICY "Users can update own orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Add DELETE policy for orders
CREATE POLICY "Users can delete own orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);