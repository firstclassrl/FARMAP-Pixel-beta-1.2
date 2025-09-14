-- Create product views for different user roles

-- View for commercial users (admin, commerciale)
CREATE OR REPLACE VIEW view_products_commercial AS
SELECT 
    id,
    name,
    code,
    description,
    category,
    base_price,
    unit,
    image_url,
    created_at,
    updated_at,
    brand_name
FROM products
WHERE is_active = true;

-- View for production users
CREATE OR REPLACE VIEW view_products_production AS
SELECT 
    id,
    name,
    code,
    description,
    category,
    base_price,
    unit,
    image_url,
    created_at,
    updated_at,
    brand_name
FROM products
WHERE is_active = true;

-- View for customer users
CREATE OR REPLACE VIEW view_products_customer AS
SELECT 
    id,
    name,
    code,
    description,
    category,
    base_price,
    unit,
    image_url,
    created_at,
    updated_at,
    brand_name
FROM products
WHERE is_active = true;

-- Grant permissions to authenticated users
GRANT SELECT ON view_products_commercial TO authenticated;
GRANT SELECT ON view_products_production TO authenticated;
GRANT SELECT ON view_products_customer TO authenticated;
