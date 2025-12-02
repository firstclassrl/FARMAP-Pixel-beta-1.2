-- =====================================================
-- ENABLE ROW LEVEL SECURITY (RLS) FOR CRITICAL TABLES
-- PIXEL CRM - FARMAP v1.2.1
-- =====================================================
-- Execute this script in Supabase SQL Editor to secure
-- all critical tables with proper RLS policies
-- =====================================================

-- ==================
-- 1. PROFILES TABLE
-- ==================
-- Critical: Contains user roles (admin, commerciale, lettore)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all profiles
CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- ==================
-- 2. CUSTOMER_PRODUCTS TABLE
-- ==================
-- NOTA: La tabella 'roles' è stata rimossa perché i ruoli
-- vengono gestiti dall'enum 'user_role' PostgreSQL nella
-- colonna profiles.role. Non è necessaria una tabella separata.

-- ==========================
-- 2. CUSTOMER_PRODUCTS TABLE
-- ==========================
-- Links customers to their specific products
ALTER TABLE customer_products ENABLE ROW LEVEL SECURITY;

-- Users can view customer products based on their role
CREATE POLICY "Users can view customer products" ON customer_products
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'commerciale', 'lettore')
    )
  );

-- Only admin and commerciale can modify
CREATE POLICY "Admin and commerciale can modify customer products" ON customer_products
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'commerciale')
    )
  );

-- ==========================
-- 3. PRICE_LIST_ITEMS TABLE
-- ==========================
-- Contains pricing information - CRITICAL
ALTER TABLE price_list_items ENABLE ROW LEVEL SECURITY;

-- Admin and commerciale can view all price list items
CREATE POLICY "Admin and commerciale can view price list items" ON price_list_items
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'commerciale')
    )
  );

-- Only admin and commerciale can modify
CREATE POLICY "Admin and commerciale can modify price list items" ON price_list_items
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'commerciale')
    )
  );

-- ============================
-- 4. SAMPLE_REQUESTS TABLE
-- ============================
ALTER TABLE sample_requests ENABLE ROW LEVEL SECURITY;

-- Users can view own sample requests or all if admin/commerciale
CREATE POLICY "Users can view sample requests" ON sample_requests
  FOR SELECT 
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'commerciale')
    )
  );

-- Users can create sample requests
CREATE POLICY "Users can create sample requests" ON sample_requests
  FOR INSERT 
  WITH CHECK (created_by = auth.uid());

-- Admin and commerciale can update all, users can update own
CREATE POLICY "Users can update sample requests" ON sample_requests
  FOR UPDATE 
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'commerciale')
    )
  );

-- Only admin can delete
CREATE POLICY "Only admin can delete sample requests" ON sample_requests
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =================================
-- 5. SAMPLE_REQUEST_ITEMS TABLE
-- =================================
ALTER TABLE sample_request_items ENABLE ROW LEVEL SECURITY;

-- Users can view items for their sample requests
CREATE POLICY "Users can view sample request items" ON sample_request_items
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM sample_requests sr
      WHERE sr.id = sample_request_items.sample_request_id
      AND (
        sr.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'commerciale')
        )
      )
    )
  );

-- Users can add items to their own sample requests
CREATE POLICY "Users can insert sample request items" ON sample_request_items
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sample_requests sr
      WHERE sr.id = sample_request_items.sample_request_id
      AND sr.created_by = auth.uid()
    )
  );

-- Admin and commerciale can modify all
CREATE POLICY "Admin and commerciale can modify sample request items" ON sample_request_items
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'commerciale')
    )
  );

-- ========================================
-- 6. VIEWS - Products by Role
-- ========================================
-- Note: Views inherit RLS from underlying tables, 
-- but we ensure they're protected

ALTER VIEW view_products_commercial SET (security_invoker = on);
ALTER VIEW view_products_customer SET (security_invoker = on);
ALTER VIEW view_products_production SET (security_invoker = on);

-- ===========================================
-- VERIFICATION QUERIES (run these to check)
-- ===========================================

-- Check which tables have RLS enabled:
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;

-- View all policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- Test as different users (use Supabase Dashboard > SQL Editor):
-- SET LOCAL role = 'authenticated';
-- SET LOCAL request.jwt.claims = '{"sub": "user-id-here", "role": "authenticated"}';
-- SELECT * FROM profiles;

-- =====================================================
-- IMPORTANT NOTES:
-- =====================================================
-- 1. This script assumes tables: customers, products, orders, 
--    price_lists already have RLS enabled. Check them!
-- 2. After running this, test thoroughly with users of each role
-- 3. Storage buckets also need RLS policies (product-photos, etc.)
-- 4. Consider additional policies for specific business logic
-- =====================================================

