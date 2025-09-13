/*
  # Fix order_items table RLS policies

  1. Security
    - Add INSERT policy for order_items table to allow authenticated users to create items for their own orders
    - Add UPDATE policy for order_items table to allow authenticated users to update items for their own orders  
    - Add DELETE policy for order_items table to allow authenticated users to delete items for their own orders

  2. Changes
    - Creates INSERT policy that checks if the order belongs to the authenticated user
    - Creates UPDATE policy that checks if the order belongs to the authenticated user
    - Creates DELETE policy that checks if the order belongs to the authenticated user
*/

-- Add INSERT policy for order_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_items' 
    AND policyname = 'Users can create order items for own orders'
  ) THEN
    CREATE POLICY "Users can create order items for own orders"
      ON order_items
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM orders 
          WHERE id = order_items.order_id 
          AND created_by = auth.uid()
        )
      );
  END IF;
END $$;

-- Add UPDATE policy for order_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_items' 
    AND policyname = 'Users can update order items for own orders'
  ) THEN
    CREATE POLICY "Users can update order items for own orders"
      ON order_items
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM orders 
          WHERE id = order_items.order_id 
          AND created_by = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM orders 
          WHERE id = order_items.order_id 
          AND created_by = auth.uid()
        )
      );
  END IF;
END $$;

-- Add DELETE policy for order_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_items' 
    AND policyname = 'Users can delete order items for own orders'
  ) THEN
    CREATE POLICY "Users can delete order items for own orders"
      ON order_items
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM orders 
          WHERE id = order_items.order_id 
          AND created_by = auth.uid()
        )
      );
  END IF;
END $$;