/*
  # Fix sample_request_items table RLS policies

  1. Security
    - Add missing INSERT, UPDATE, DELETE policies for sample_request_items table
    - Allow users to manage items only for their own sample requests
    - Policy checks ownership through the related sample_requests table

  2. Changes
    - Add INSERT policy for authenticated users
    - Add UPDATE policy for owners of related sample requests
    - Add DELETE policy for owners of related sample requests
*/

-- Drop existing policies if they exist to recreate them properly
DROP POLICY IF EXISTS "Users can create sample request items" ON sample_request_items;
DROP POLICY IF EXISTS "Users can update sample request items" ON sample_request_items;
DROP POLICY IF EXISTS "Users can delete sample request items" ON sample_request_items;

-- Create INSERT policy for sample_request_items table
CREATE POLICY "Users can create sample request items"
  ON sample_request_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sample_requests
      WHERE sample_requests.id = sample_request_items.sample_request_id
      AND sample_requests.created_by = auth.uid()
    )
  );

-- Create UPDATE policy for sample_request_items table
CREATE POLICY "Users can update sample request items"
  ON sample_request_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sample_requests
      WHERE sample_requests.id = sample_request_items.sample_request_id
      AND sample_requests.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sample_requests
      WHERE sample_requests.id = sample_request_items.sample_request_id
      AND sample_requests.created_by = auth.uid()
    )
  );

-- Create DELETE policy for sample_request_items table
CREATE POLICY "Users can delete sample request items"
  ON sample_request_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sample_requests
      WHERE sample_requests.id = sample_request_items.sample_request_id
      AND sample_requests.created_by = auth.uid()
    )
  );