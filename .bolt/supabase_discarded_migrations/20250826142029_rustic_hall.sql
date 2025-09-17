/*
  # Fix price_list_items RLS policies

  1. Security Updates
    - Add INSERT policy for authenticated users to create price list items for their own price lists
    - Add UPDATE policy for authenticated users to update price list items for their own price lists  
    - Add DELETE policy for authenticated users to delete price list items for their own price lists

  2. Policy Logic
    - Users can only manage price list items that belong to price lists they created
    - This is enforced by checking the created_by field in the related price_lists table
*/

-- Add INSERT policy for price_list_items
CREATE POLICY "Users can create price list items for own price lists"
  ON price_list_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM price_lists 
      WHERE price_lists.id = price_list_items.price_list_id 
      AND price_lists.created_by = auth.uid()
    )
  );

-- Add UPDATE policy for price_list_items
CREATE POLICY "Users can update price list items for own price lists"
  ON price_list_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM price_lists 
      WHERE price_lists.id = price_list_items.price_list_id 
      AND price_lists.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM price_lists 
      WHERE price_lists.id = price_list_items.price_list_id 
      AND price_lists.created_by = auth.uid()
    )
  );

-- Add DELETE policy for price_list_items
CREATE POLICY "Users can delete price list items for own price lists"
  ON price_list_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM price_lists 
      WHERE price_lists.id = price_list_items.price_list_id 
      AND price_lists.created_by = auth.uid()
    )
  );