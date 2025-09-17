/*
  # Remove inventory management columns from products table

  1. Changes
    - Remove `stock_quantity` column from products table
    - Remove `min_stock_level` column from products table
  
  2. Security
    - No RLS changes needed as we're only removing columns
  
  Note: This migration removes inventory management functionality completely.
  Make sure to backup your data before running this migration if you need
  to preserve stock quantity information.
*/

-- Remove inventory management columns from products table
ALTER TABLE public.products 
DROP COLUMN IF EXISTS stock_quantity,
DROP COLUMN IF EXISTS min_stock_level;