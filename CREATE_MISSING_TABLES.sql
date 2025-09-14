-- ==============================================
-- CREA TABELLE MANCANTI PER CAMPIONATURA E LISTINI
-- ==============================================

-- 1. Verifica la struttura della tabella customers
DO $$
DECLARE
    customer_id_col text;
BEGIN
    -- Controlla se la colonna si chiama 'id' o 'customer_id'
    SELECT column_name INTO customer_id_col
    FROM information_schema.columns
    WHERE table_name = 'customers' 
    AND table_schema = 'public'
    AND column_name IN ('id', 'customer_id')
    LIMIT 1;
    
    IF customer_id_col IS NULL THEN
        RAISE NOTICE 'Colonna customer_id non trovata nella tabella customers';
        RAISE NOTICE 'Colonne disponibili nella tabella customers:';
        FOR customer_id_col IN 
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'customers' AND table_schema = 'public'
        LOOP
            RAISE NOTICE '- %', customer_id_col;
        END LOOP;
    ELSE
        RAISE NOTICE 'Colonna customer trovata: %', customer_id_col;
    END IF;
END $$;

-- 1. Crea tabella sample_requests se non esiste
CREATE TABLE IF NOT EXISTS public.sample_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    request_date date NOT NULL DEFAULT CURRENT_DATE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'cancelled')),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- 2. Crea tabella sample_request_items se non esiste
CREATE TABLE IF NOT EXISTS public.sample_request_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sample_request_id uuid NOT NULL REFERENCES public.sample_requests(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity integer NOT NULL DEFAULT 1,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Crea tabella price_lists se non esiste
CREATE TABLE IF NOT EXISTS public.price_lists (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
    valid_from date,
    valid_until date,
    is_active boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- 4. Crea tabella price_list_items se non esiste
CREATE TABLE IF NOT EXISTS public.price_list_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    price_list_id uuid NOT NULL REFERENCES public.price_lists(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    price decimal(10,2) NOT NULL,
    min_quantity integer DEFAULT 1,
    discount_percentage decimal(5,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 5. Crea tabella orders se non esiste
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number text UNIQUE NOT NULL,
    customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    order_date date NOT NULL DEFAULT CURRENT_DATE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    total_amount decimal(10,2) DEFAULT 0,
    tax_amount decimal(10,2) DEFAULT 0,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- 6. Crea tabella order_items se non esiste
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
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
-- AGGIUNGI DATI DI TEST
-- ==============================================

-- Inserisci un listino di test se non esiste
INSERT INTO public.price_lists (id, name, customer_id, is_active, created_by)
SELECT 
    gen_random_uuid(),
    'Listino Test 2025',
    (SELECT id FROM public.customers WHERE is_active = true LIMIT 1),
    true,
    (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.price_lists WHERE name = 'Listino Test 2025');

-- Inserisci prodotti nel listino di test
INSERT INTO public.price_list_items (price_list_id, product_id, price, min_quantity, discount_percentage)
SELECT 
    pl.id,
    p.id,
    COALESCE(p.base_price, 10.00),
    1,
    0
FROM public.price_lists pl
CROSS JOIN public.products p
WHERE pl.name = 'Listino Test 2025'
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM public.price_list_items pli 
    WHERE pli.price_list_id = pl.id AND pli.product_id = p.id
);

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

-- Conta i record nelle tabelle
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
    RAISE NOTICE 'TABELLE CAMPIONATURA E LISTINI CREATE CON SUCCESSO!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Tabelle create:';
    RAISE NOTICE '- sample_requests';
    RAISE NOTICE '- sample_request_items';
    RAISE NOTICE '- price_lists';
    RAISE NOTICE '- price_list_items';
    RAISE NOTICE '- orders';
    RAISE NOTICE '- order_items';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Ora la campionatura e i listini dovrebbero funzionare!';
    RAISE NOTICE '==============================================';
END $$;
