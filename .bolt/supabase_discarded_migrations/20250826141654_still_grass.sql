/*
  # Fix customers table RLS policies

  1. Security Updates
    - Add INSERT policy to allow authenticated users to create customers
    - Add UPDATE policy to allow users to update customers they created
    - Add DELETE policy to allow users to delete customers they created
    - Keep existing SELECT policy for reading customers

  2. Policy Details
    - INSERT: Allow authenticated users to create customers with their own user ID as created_by
    - UPDATE: Allow users to update customers they created
    - DELETE: Allow users to delete customers they created
    - SELECT: Keep existing policy for reading customers
*/

-- Add INSERT policy for customers
CREATE POLICY "Users can create customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Add UPDATE policy for customers
CREATE POLICY "Users can update own customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Add DELETE policy for customers
CREATE POLICY "Users can delete own customers"
  ON customers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);