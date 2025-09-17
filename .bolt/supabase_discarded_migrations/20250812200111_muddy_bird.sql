-- Create orders_with_profiles view for order form integration
-- This view combines orders with profile information for the creator

CREATE OR REPLACE VIEW public.orders_with_profiles AS
SELECT
    o.id,
    o.order_number,
    o.customer_id,
    o.quote_id,
    o.status,
    o.order_date,
    o.delivery_date,
    o.total_amount,
    o.tax_amount,
    o.discount_amount,
    o.shipping_cost,
    o.notes,
    o.shipping_address,
    o.tracking_number,
    o.created_at,
    o.updated_at,
    o.created_by,
    p.full_name AS creator_full_name,
    p.email AS creator_email,
    p.role AS creator_role
FROM
    public.orders o
LEFT JOIN
    public.profiles p ON o.created_by = p.id;

-- Grant appropriate permissions
GRANT SELECT ON public.orders_with_profiles TO authenticated;
GRANT SELECT ON public.orders_with_profiles TO anon;

-- Add comment for documentation
COMMENT ON VIEW public.orders_with_profiles IS 'View that combines orders with creator profile information for order form generation';