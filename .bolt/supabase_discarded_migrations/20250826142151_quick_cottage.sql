/*
  # Add missing columns to orders table

  1. Changes
    - Add `status` column with enum type and default value
    - Add `shipping_cost` column with numeric type and default value
  
  2. Security
    - No RLS changes needed as the table already has RLS enabled
    - Existing policies will apply to the new columns
*/

-- Add status column with enum type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'status'
  ) THEN
    ALTER TABLE orders ADD COLUMN status order_status DEFAULT 'pending' NOT NULL;
  END IF;
END $$;

-- Add shipping_cost column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipping_cost'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipping_cost numeric(10,2) DEFAULT 0 NOT NULL;
  END IF;
END $$;