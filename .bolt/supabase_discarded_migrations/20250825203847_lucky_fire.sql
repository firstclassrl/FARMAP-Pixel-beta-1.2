/*
  # Fix product deletion foreign key constraint

  1. Database Changes
    - Drop existing foreign key constraint on sample_request_items.product_id
    - Make product_id column nullable in sample_request_items
    - Re-add foreign key constraint with ON DELETE SET NULL

  2. Purpose
    - Allow products to be deleted even when referenced in sample requests
    - Preserve historical sample request records by setting product_id to NULL
    - Maintain data integrity while enabling product management
*/

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE public.sample_request_items
DROP CONSTRAINT IF EXISTS sample_request_items_product_id_fkey;

-- Step 2: Alter the product_id column to be nullable
ALTER TABLE public.sample_request_items
ALTER COLUMN product_id DROP NOT NULL;

-- Step 3: Re-add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE public.sample_request_items
ADD CONSTRAINT sample_request_items_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;