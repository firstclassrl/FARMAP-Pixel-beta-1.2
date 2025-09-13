```sql
-- Rebuild Complete Schema
-- This script completely rebuilds the public schema of your Supabase database.
-- USE WITH CAUTION: This will drop and recreate tables and enums, potentially leading to data loss if not handled correctly.
-- It is recommended to run this on a development environment or after backing up your data.

-- IMPORTANT: Enable the uuid-ossp extension first!
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set search_path to public for simplicity
SET search_path TO public;

-- Drop existing functions that might depend on types or tables
DROP FUNCTION IF EXISTS public.set_first_user_as_admin() CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Drop existing tables (order matters due to foreign keys)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.price_list_items CASCADE;
DROP TABLE IF EXISTS public.price_lists CASCADE;
DROP TABLE IF EXISTS public.sample_request_items CASCADE;
DROP TABLE IF EXISTS public.sample_requests CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.quotes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE; -- This is a placeholder, actual auth.users cannot be dropped

-- Drop existing enum types if they exist
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.quote_status CASCADE;
DROP TYPE IF EXISTS public.sample_request_status CASCADE;

-- Create Enum Types
CREATE TYPE public.user_role AS ENUM ('admin', 'commerciale', 'label_user', 'lettore');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE public.quote_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired');
CREATE TYPE public.sample_request_status AS ENUM ('pending', 'sent', 'delivered', 'cancelled');

-- Create Tables

-- profiles table (linked to auth.users)
CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text UNIQUE NOT NULL,
    full_name text,
    avatar_url text,
    role user_role DEFAULT 'lettore'::public.user_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy for profiles
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- customers table
CREATE TABLE public.customers (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_name text NOT NULL,
    contact_person text,
    email text,
    phone text,
    address text,
    city text,
    postal_code text,
    province text,
    country text DEFAULT 'Italia'::text NOT NULL,
    vat_number text,
    tax_code text,
    payment_terms integer DEFAULT 30 NOT NULL,
    discount_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    price_list_id uuid, -- Foreign key to price_lists, added later
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Policy for customers
CREATE POLICY "Commerciale can manage customers" ON public.customers
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'commerciale')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'commerciale')));
CREATE POLICY "Lettore can read customers" ON public.customers FOR SELECT USING (true);


-- products table
CREATE TABLE public.products (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    code text UNIQUE NOT NULL,
    name text NOT NULL,
    description text,
    category text,
    unit text DEFAULT 'pz'::text NOT NULL,
    base_price numeric(10,2) DEFAULT 0 NOT NULL,
    cost numeric(10,2) DEFAULT 0 NOT NULL,
    weight numeric(8,3),
    dimensions text,
    stock_quantity integer DEFAULT 0 NOT NULL,
    min_stock_level integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    image_url text,
    photo_url text,
    sds_url text,
    st_url text,
    brand_name text,
    client_product_code text,
    supplier_product_code text,
    barcode text,
    packaging_type text,
    regulation text,
    product_notes text,
    customer_id uuid REFERENCES public.customers(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy for products
CREATE POLICY "Commerciale can manage products" ON public.products
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'commerciale')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'commerciale')));
CREATE POLICY "Lettore can read products" ON public.products FOR SELECT USING (true);


-- price_lists table
CREATE TABLE public.price_lists (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    description text,
    is_default boolean DEFAULT false NOT NULL,
    valid_from date DEFAULT CURRENT_DATE NOT NULL,
    valid_until date,
    currency text DEFAULT 'EUR'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;

-- Policy for price_lists
CREATE POLICY "Commerciale can manage price_lists" ON public.price_lists
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'commerciale')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'commerciale')));
CREATE POLICY "Lettore can read price_lists" ON public.price_lists FOR SELECT USING (true);


-- price_list_items table
CREATE TABLE public.price_list_items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    price_list_id uuid REFERENCES public.price_lists(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    price numeric(10,2) NOT NULL,
    discount_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    min_quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (price_list_id, product_id)
);
ALTER TABLE public.price_list_items ENABLE ROW LEVEL SECURITY;

-- Policy for price_list_items
CREATE POLICY "Commerciale can manage price_list_items" ON public.price_list_items
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'commerciale')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'commerciale')));
CREATE POLICY "Lettore can read price_list_items" ON public.price_list_items FOR SELECT USING (true);


-- quotes table
CREATE TABLE public.quotes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    quote_number text UNIQUE NOT NULL,
    customer_id uuid REFERENCES public.customers(id) ON DELETE RESTRICT NOT NULL,
    status quote_status DEFAULT 'draft'::public.quote_status NOT NULL,
    total_amount numeric(12,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(12,2) DEFAULT 0 NOT NULL,
    notes text,
    valid_until date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Policy for quotes
CREATE POLICY "Commerciale can manage quotes" ON public.quotes
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'commerciale')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'commerciale')));
CREATE POLICY "Lettore can read quotes" ON public.quotes FOR SELECT USING (true);


-- orders table
CREATE TABLE public.orders (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number text UNIQUE NOT NULL,
    customer_id uuid REFERENCES public.customers(id) ON DELETE RESTRICT NOT NULL,
    quote_id uuid REFERENCES public.quotes(id),
    status order_status DEFAULT 'pending'::public.order_status NOT NULL,
    order_date date DEFAULT CURRENT_DATE NOT NULL,
    delivery_date date,
    total_amount numeric(12,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(12,2) DEFAULT 0 NOT NULL,
    shipping_cost numeric(10,2) DEFAULT 0 NOT NULL,
    notes text,
    shipping_address text,
    tracking_number text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy for orders
CREATE POLICY "Commerciale can manage orders" ON public.orders
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'commerciale')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'commerciale')));
CREATE POLICY "Lettore can read orders" ON public.orders FOR SELECT USING (true);


-- order_items table
CREATE TABLE public.order_items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    unit_price numeric(10,2) NOT NULL,
    discount_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    total_price numeric(12,2) NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policy for order_items
CREATE POLICY "Commerciale can manage order_items" ON public.order_items
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'commerciale')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'commerciale')));
CREATE POLICY "Lettore can read order_items" ON public.order_items FOR SELECT USING (true);


-- sample_requests table
CREATE TABLE public.sample_requests (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id uuid REFERENCES public.customers(id) ON DELETE RESTRICT NOT NULL,
    request_date date DEFAULT CURRENT_DATE NOT NULL,
    status sample_request_status DEFAULT 'pending'::public.sample_request_status NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id) DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);
ALTER TABLE public.sample_requests ENABLE ROW LEVEL SECURITY;

-- Policy for sample_requests
CREATE POLICY "Commerciale can manage sample_requests" ON public.sample_requests
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'commerciale')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'commerciale')));
CREATE POLICY "Lettore can read sample_requests" ON public.sample_requests FOR SELECT USING (true);


-- sample_request_items table
CREATE TABLE public.sample_request_items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    sample_request_id uuid REFERENCES public.sample_requests(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    sent_date date,
    tracking_number text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.sample_request_items ENABLE ROW LEVEL SECURITY;

-- Policy for sample_request_items
CREATE POLICY "Commerciale can manage sample_request_items" ON public.sample_request_items
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'commerciale')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'commerciale')));
CREATE POLICY "Lettore can read sample_request_items" ON public.sample_request_items FOR SELECT USING (true);


-- activities table (for logging user actions)
CREATE TABLE public.activities (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id text NOT NULL,
    details jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Policy for activities
CREATE POLICY "Users can read own activities" ON public.activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can manage all activities" ON public.activities
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));


-- Create Functions

-- Function to set updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set the first user as admin
CREATE OR REPLACE FUNCTION public.set_first_user_as_admin()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM public.profiles) = 0 THEN
        NEW.role = 'admin';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers

-- Trigger for profiles table to set updated_at
CREATE TRIGGER trg_set_updated_at_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger for profiles table to set first user as admin
CREATE TRIGGER set_first_user_admin_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_first_user_as_admin();

-- Trigger for customers table to set updated_at
CREATE TRIGGER trg_set_updated_at_customers
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger for products table to set updated_at
CREATE TRIGGER trg_set_updated_at_products
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger for price_lists table to set updated_at
CREATE TRIGGER trg_set_updated_at_price_lists
BEFORE UPDATE ON public.price_lists
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger for price_list_items table to set updated_at
CREATE TRIGGER trg_set_updated_at_price_list_items
BEFORE UPDATE ON public.price_list_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger for quotes table to set updated_at
CREATE TRIGGER trg_set_updated_at_quotes
BEFORE UPDATE ON public.quotes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger for orders table to set updated_at
CREATE TRIGGER trg_set_updated_at_orders
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger for sample_requests table to set updated_at
CREATE TRIGGER trg_set_updated_at_sample_requests
BEFORE UPDATE ON public.sample_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger on auth.users to create a corresponding profile
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Final check and success message
DO $$
DECLARE
    enum_count integer;
    table_count integer;
    function_count integer;
    extension_enabled boolean;
BEGIN
    SELECT COUNT(*) INTO enum_count FROM pg_type WHERE typname IN ('user_role', 'order_status', 'quote_status', 'sample_request_status');
    SELECT COUNT(*) INTO table_count FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
        'profiles', 'customers', 'products', 'price_lists', 'price_list_items', 'quotes', 'orders',
        'order_items', 'sample_requests', 'sample_request_items', 'activities'
    );
    SELECT COUNT(*) INTO function_count FROM pg_proc WHERE proname IN (
        'set_updated_at', 'handle_new_user', 'set_first_user_as_admin'
    );
    SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') INTO extension_enabled;

    RAISE NOTICE 'Schema rebuild completed!';
    RAISE NOTICE 'Enum types created: %', enum_count;
    RAISE NOTICE 'Tables created: %', table_count;
    RAISE NOTICE 'Functions created: %', function_count;
    RAISE NOTICE 'uuid-ossp extension enabled: %', extension_enabled;

    IF enum_count = 4 AND table_count = 11 AND function_count = 3 AND extension_enabled THEN
        RAISE NOTICE 'SUCCESS: All database objects created successfully!';
    ELSE
        RAISE WARNING 'WARNING: Some database objects might be missing or incorrect. Please review the logs.';
    END IF;
END $$;
```