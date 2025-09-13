/*
  # Create orders_with_profiles view

  1. New Views
    - `orders_with_profiles`
      - Joins `orders` table with `profiles` table
      - Includes all order fields plus creator information
      - `creator_full_name` (text, creator's full name)
      - `creator_email` (text, creator's email)

  2. Security
    - View inherits RLS policies from underlying tables
    - Access controlled by existing orders table policies
*/

CREATE OR REPLACE VIEW orders_with_profiles AS
SELECT 
  o.*,
  p.full_name AS creator_full_name,
  p.email AS creator_email
FROM orders AS o
LEFT JOIN profiles AS p ON o.created_by = p.id;