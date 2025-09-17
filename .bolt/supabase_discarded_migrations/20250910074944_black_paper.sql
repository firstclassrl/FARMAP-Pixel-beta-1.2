/*
  # Fix price_lists table DELETE RLS policy

  1. Security
    - Ensure DELETE policy exists for price_lists table
    - Allow users to delete only their own price list records
    - Policy checks that auth.uid() matches created_by field
*/

-- Drop existing DELETE policy if it exists to recreate it properly
DROP POLICY IF EXISTS "Users can delete own price lists" ON price_lists;

-- Create DELETE policy for price_lists table
CREATE POLICY "Users can delete own price lists"
  ON price_lists
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);