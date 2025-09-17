/*
  # Fix Order Deletion Issues

  1. Database Constraints
    - Ensure proper CASCADE deletion for order_items
    - Fix foreign key constraints

  2. Security Policies
    - Update RLS policies to allow proper deletion
    - Ensure consistent permissions for SELECT and DELETE operations

  3. View Dependencies
    - Ensure orders_with_profiles view exists and is accessible
*/

-- First, ensure the orders_with_profiles view exists
CREATE OR REPLACE VIEW orders_with_profiles AS
SELECT 
  o.*,
  p.full_name as creator_full_name,
  p.email as creator_email
FROM orders o
LEFT JOIN profiles p ON o.created_by = p.id;

-- Fix foreign key constraints for proper cascade deletion
ALTER TABLE order_items 
DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;

ALTER TABLE order_items 
ADD CONSTRAINT order_items_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Update RLS policies for orders table to ensure consistent permissions
DROP POLICY IF EXISTS "Users can delete own orders" ON orders;
DROP POLICY IF EXISTS "Allow users to delete own orders" ON orders;

CREATE POLICY "Users can delete own orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Ensure order_items can be deleted when parent order is deleted
DROP POLICY IF EXISTS "Users can delete order items for own orders" ON order_items;

CREATE POLICY "Users can delete order items for own orders"
  ON order_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.created_by = auth.uid()
    )
  );

-- Grant necessary permissions on the view
GRANT SELECT ON orders_with_profiles TO authenticated;
GRANT SELECT ON orders_with_profiles TO anon;