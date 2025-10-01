-- =====================================================
-- ADD MISSING RLS POLICIES - Orders, Price Lists
-- PIXEL CRM - FARMAP v1.2.1
-- =====================================================
-- Fixes 400 errors in search bar and data loading
-- =====================================================

-- ==================
-- 1. ORDERS TABLE
-- ==================
-- Allow authenticated users to view and manage orders

-- Enable RLS if not already enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can view all orders (authenticated)
CREATE POLICY "Authenticated users can view orders" ON orders
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Users can create orders
CREATE POLICY "Authenticated users can create orders" ON orders
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update orders
CREATE POLICY "Authenticated users can update orders" ON orders
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- ==================
-- 2. ORDER_ITEMS TABLE
-- ==================
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Users can view order items
CREATE POLICY "Authenticated users can view order items" ON order_items
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Users can create order items
CREATE POLICY "Authenticated users can create order items" ON order_items
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update order items
CREATE POLICY "Authenticated users can update order items" ON order_items
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Users can delete order items
CREATE POLICY "Authenticated users can delete order items" ON order_items
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- ==================
-- 3. PRICE_LISTS TABLE
-- ==================
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;

-- Users can view price lists
CREATE POLICY "Authenticated users can view price lists" ON price_lists
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Users can create price lists
CREATE POLICY "Authenticated users can create price lists" ON price_lists
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update price lists
CREATE POLICY "Authenticated users can update price lists" ON price_lists
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- ==================
-- 4. CUSTOMERS TABLE
-- ==================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Users can view customers
CREATE POLICY "Authenticated users can view customers" ON customers
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Users can create customers
CREATE POLICY "Authenticated users can create customers" ON customers
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update customers
CREATE POLICY "Authenticated users can update customers" ON customers
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- ==================
-- 5. PRODUCTS TABLE
-- ==================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Users can view products
CREATE POLICY "Authenticated users can view products" ON products
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Users can create products
CREATE POLICY "Authenticated users can create products" ON products
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update products
CREATE POLICY "Authenticated users can update products" ON products
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- ==================
-- 6. CATEGORIES TABLE
-- ==================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Users can view categories
CREATE POLICY "Authenticated users can view categories" ON categories
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Users can create categories
CREATE POLICY "Authenticated users can create categories" ON categories
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update categories
CREATE POLICY "Authenticated users can update categories" ON categories
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Users can delete categories
CREATE POLICY "Authenticated users can delete categories" ON categories
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- =====================================================
-- VERIFY
-- =====================================================
-- Check all policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('orders', 'order_items', 'price_lists', 'customers', 'products', 'categories')
ORDER BY tablename, policyname;

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. These policies allow all authenticated users full access
-- 2. Fine-grained control should be implemented in application logic
-- 3. For production, consider restricting based on user roles
-- 4. Sample requests policies are already covered in ENABLE_RLS_SECURITY.sql
-- =====================================================

