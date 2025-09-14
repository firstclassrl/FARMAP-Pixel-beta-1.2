-- ==============================================
-- CREA TABELLE SENZA FOREIGN KEY PRIMA
-- ==============================================

-- 1. Crea tabella sample_requests senza foreign key
CREATE TABLE IF NOT EXISTS public.sample_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid,  -- Senza foreign key per ora
    request_date date NOT NULL DEFAULT CURRENT_DATE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'cancelled')),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid
);

-- 2. Crea tabella sample_request_items senza foreign key
CREATE TABLE IF NOT EXISTS public.sample_request_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sample_request_id uuid,  -- Senza foreign key per ora
    product_id uuid,  -- Senza foreign key per ora
    quantity integer NOT NULL DEFAULT 1,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Crea tabella price_lists senza foreign key
CREATE TABLE IF NOT EXISTS public.price_lists (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    customer_id uuid,  -- Senza foreign key per ora
    valid_from date,
    valid_until date,
    is_active boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid
);

-- 4. Crea tabella price_list_items senza foreign key
CREATE TABLE IF NOT EXISTS public.price_list_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    price_list_id uuid,  -- Senza foreign key per ora
    product_id uuid,  -- Senza foreign key per ora
    price decimal(10,2) NOT NULL,
    min_quantity integer DEFAULT 1,
    discount_percentage decimal(5,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 5. Crea tabella orders senza foreign key
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number text UNIQUE NOT NULL,
    customer_id uuid,  -- Senza foreign key per ora
    order_date date NOT NULL DEFAULT CURRENT_DATE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    total_amount decimal(10,2) DEFAULT 0,
    tax_amount decimal(10,2) DEFAULT 0,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid
);

-- 6. Crea tabella order_items senza foreign key
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid,  -- Senza foreign key per ora
    product_id uuid,  -- Senza foreign key per ora
    quantity integer NOT NULL DEFAULT 1,
    unit_price decimal(10,2) NOT NULL,
    total_price decimal(10,2) NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ==============================================
-- AGGIUNGI INDICI PER PERFORMANCE
-- ==============================================

-- Indici per sample_requests
CREATE INDEX IF NOT EXISTS idx_sample_requests_customer_id ON public.sample_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_sample_requests_status ON public.sample_requests(status);
CREATE INDEX IF NOT EXISTS idx_sample_requests_created_at ON public.sample_requests(created_at);

-- Indici per sample_request_items
CREATE INDEX IF NOT EXISTS idx_sample_request_items_sample_request_id ON public.sample_request_items(sample_request_id);
CREATE INDEX IF NOT EXISTS idx_sample_request_items_product_id ON public.sample_request_items(product_id);

-- Indici per price_lists
CREATE INDEX IF NOT EXISTS idx_price_lists_customer_id ON public.price_lists(customer_id);
CREATE INDEX IF NOT EXISTS idx_price_lists_is_active ON public.price_lists(is_active);
CREATE INDEX IF NOT EXISTS idx_price_lists_created_at ON public.price_lists(created_at);

-- Indici per price_list_items
CREATE INDEX IF NOT EXISTS idx_price_list_items_price_list_id ON public.price_list_items(price_list_id);
CREATE INDEX IF NOT EXISTS idx_price_list_items_product_id ON public.price_list_items(product_id);

-- Indici per orders
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON public.orders(order_date);

-- Indici per order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- ==============================================
-- AGGIUNGI TRIGGER PER UPDATED_AT
-- ==============================================

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per sample_requests
DROP TRIGGER IF EXISTS update_sample_requests_updated_at ON public.sample_requests;
CREATE TRIGGER update_sample_requests_updated_at
    BEFORE UPDATE ON public.sample_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger per sample_request_items
DROP TRIGGER IF EXISTS update_sample_request_items_updated_at ON public.sample_request_items;
CREATE TRIGGER update_sample_request_items_updated_at
    BEFORE UPDATE ON public.sample_request_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger per price_lists
DROP TRIGGER IF EXISTS update_price_lists_updated_at ON public.price_lists;
CREATE TRIGGER update_price_lists_updated_at
    BEFORE UPDATE ON public.price_lists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger per price_list_items
DROP TRIGGER IF EXISTS update_price_list_items_updated_at ON public.price_list_items;
CREATE TRIGGER update_price_list_items_updated_at
    BEFORE UPDATE ON public.price_list_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger per orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger per order_items
DROP TRIGGER IF EXISTS update_order_items_updated_at ON public.order_items;
CREATE TRIGGER update_order_items_updated_at
    BEFORE UPDATE ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- VERIFICA LE TABELLE CREATE
-- ==============================================

-- Mostra le tabelle create
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('sample_requests', 'sample_request_items', 'price_lists', 'price_list_items', 'orders', 'order_items')
ORDER BY tablename;

-- Conta i record nelle tabelle (dovrebbero essere 0)
SELECT 'sample_requests' as table_name, COUNT(*) as record_count FROM public.sample_requests
UNION ALL
SELECT 'sample_request_items' as table_name, COUNT(*) as record_count FROM public.sample_request_items
UNION ALL
SELECT 'price_lists' as table_name, COUNT(*) as record_count FROM public.price_lists
UNION ALL
SELECT 'price_list_items' as table_name, COUNT(*) as record_count FROM public.price_list_items
UNION ALL
SELECT 'orders' as table_name, COUNT(*) as record_count FROM public.orders
UNION ALL
SELECT 'order_items' as table_name, COUNT(*) as record_count FROM public.order_items;

-- ==============================================
-- MESSAGGIO DI CONFERMA
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'TABELLE CREATE SENZA FOREIGN KEY!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Tabelle create:';
    RAISE NOTICE '- sample_requests';
    RAISE NOTICE '- sample_request_items';
    RAISE NOTICE '- price_lists';
    RAISE NOTICE '- price_list_items';
    RAISE NOTICE '- orders';
    RAISE NOTICE '- order_items';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Ora la campionatura dovrebbe funzionare!';
    RAISE NOTICE 'Le foreign key verranno aggiunte dopo aver verificato la struttura.';
    RAISE NOTICE '==============================================';
END $$;
