/*
  # Fix customers table DELETE RLS policy

  1. Security
    - Ensure DELETE policy exists for customers table
    - Allow users to delete only their own customer records
    - Policy checks that auth.uid() matches created_by field
*/

-- Drop existing DELETE policy if it exists to recreate it properly
DROP POLICY IF EXISTS "Users can delete own customers" ON customers;

-- Create DELETE policy for customers table
CREATE POLICY "Users can delete own customers"
  ON customers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);