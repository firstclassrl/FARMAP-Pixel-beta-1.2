/*
  # Add file URL columns to products table

  1. New Columns
    - `photo_url` (text) - URL for product photo
    - `sds_url` (text) - URL for Safety Data Sheet
    - `st_url` (text) - URL for Technical Sheet
    - `brand_name` (text) - Product brand name
    - `client_product_code` (text) - Client's product code
    - `supplier_product_code` (text) - Supplier's product code
    - `barcode` (text) - Product barcode
    - `packaging_type` (text) - Type of packaging
    - `regulation` (text) - Regulatory information
    - `product_notes` (text) - Additional product notes
    - `customer_id` (uuid) - Reference to customer (optional)

  2. Changes
    - Add all missing columns that are referenced in the application
    - Set appropriate defaults and constraints
    - Add foreign key for customer_id if needed

  3. Security
    - No RLS changes needed as products table already has RLS enabled
*/

-- Add file URL columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE products ADD COLUMN photo_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'sds_url'
  ) THEN
    ALTER TABLE products ADD COLUMN sds_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'st_url'
  ) THEN
    ALTER TABLE products ADD COLUMN st_url text;
  END IF;
END $$;

-- Add product metadata columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'brand_name'
  ) THEN
    ALTER TABLE products ADD COLUMN brand_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'client_product_code'
  ) THEN
    ALTER TABLE products ADD COLUMN client_product_code text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'supplier_product_code'
  ) THEN
    ALTER TABLE products ADD COLUMN supplier_product_code text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'barcode'
  ) THEN
    ALTER TABLE products ADD COLUMN barcode text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'packaging_type'
  ) THEN
    ALTER TABLE products ADD COLUMN packaging_type text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'regulation'
  ) THEN
    ALTER TABLE products ADD COLUMN regulation text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'product_notes'
  ) THEN
    ALTER TABLE products ADD COLUMN product_notes text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE products ADD COLUMN customer_id uuid REFERENCES customers(id);
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_customer_id ON products(customer_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_name ON products(brand_name);
CREATE INDEX IF NOT EXISTS idx_products_client_code ON products(client_product_code);
CREATE INDEX IF NOT EXISTS idx_products_supplier_code ON products(supplier_product_code);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);