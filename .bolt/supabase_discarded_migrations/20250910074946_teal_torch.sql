/*
  # Fix sample_requests table RLS policies

  1. Security
    - Add missing INSERT, UPDATE, DELETE policies for sample_requests table
    - Allow users to manage only their own sample request records
    - Policy checks that auth.uid() matches created_by field

  2. Changes
    - Add INSERT policy for authenticated users
    - Add UPDATE policy for record owners
    - Add DELETE policy for record owners
*/

-- Drop existing policies if they exist to recreate them properly
DROP POLICY IF EXISTS "Users can create sample requests" ON sample_requests;
DROP POLICY IF EXISTS "Users can update own sample requests" ON sample_requests;
DROP POLICY IF EXISTS "Users can delete own sample requests" ON sample_requests;

-- Create INSERT policy for sample_requests table
CREATE POLICY "Users can create sample requests"
  ON sample_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Create UPDATE policy for sample_requests table
CREATE POLICY "Users can update own sample requests"
  ON sample_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Create DELETE policy for sample_requests table
CREATE POLICY "Users can delete own sample requests"
  ON sample_requests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);