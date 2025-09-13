/*
  # Add status column to sample_requests table

  1. Changes
    - Add `status` column to `sample_requests` table
    - Use existing `sample_request_status` enum type
    - Set default value to 'pending'
    - Add index for better query performance

  2. Security
    - Update existing RLS policies to work with new column
*/

-- Add the status column to the sample_requests table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sample_requests' AND column_name = 'status'
  ) THEN
    ALTER TABLE sample_requests ADD COLUMN status sample_request_status NOT NULL DEFAULT 'pending';
  END IF;
END $$;

-- Add index for better query performance on status
CREATE INDEX IF NOT EXISTS idx_sample_requests_status ON sample_requests(status);