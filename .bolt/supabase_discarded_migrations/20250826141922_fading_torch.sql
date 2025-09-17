/*
  # Fix price_lists table RLS policies

  1. New Policies
    - Add INSERT policy for authenticated users to create price lists
    - Add UPDATE policy for users to update their own price lists  
    - Add DELETE policy for users to delete their own price lists

  2. Security
    - All policies check that auth.uid() matches created_by field
    - Only authenticated users can perform these operations
    - Users can only modify price lists they created
*/

-- Add INSERT policy for price_lists
CREATE POLICY "Users can create price lists"
  ON price_lists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Add UPDATE policy for price_lists
CREATE POLICY "Users can update own price lists"
  ON price_lists
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Add DELETE policy for price_lists
CREATE POLICY "Users can delete own price lists"
  ON price_lists
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);