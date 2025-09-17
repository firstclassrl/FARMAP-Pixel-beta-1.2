/*
  # Add status column to sample_requests table

  1. New Columns
    - `status` (sample_request_status enum, default 'pending')
      - Tracks the current status of sample requests
      - Uses existing enum: pending, sent, delivered, cancelled

  2. Indexes
    - Add index on status column for better query performance

  3. Security
    - No RLS changes needed (table already has RLS enabled)
*/

-- Add status column to sample_requests table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sample_requests' AND column_name = 'status'
  ) THEN
    ALTER TABLE sample_requests ADD COLUMN status sample_request_status DEFAULT 'pending'::sample_request_status NOT NULL;
  END IF;
END $$;

-- Add index on status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'sample_requests' AND indexname = 'idx_sample_requests_status'
  ) THEN
    CREATE INDEX idx_sample_requests_status ON sample_requests (status);
  END IF;
END $$;