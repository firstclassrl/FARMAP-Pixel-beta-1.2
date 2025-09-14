-- ==============================================
-- VERIFICA COMPLETA DEL DATABASE
-- ==============================================

-- 1. Verifica se la tabella customers esiste
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'customers' AND schemaname = 'public') 
        THEN 'TABELLA CUSTOMERS ESISTE' 
        ELSE 'TABELLA CUSTOMERS NON ESISTE - DEVE ESSERE CREATA!' 
    END as customers_table_status;

-- 2. Se la tabella customers non esiste, creala
CREATE TABLE IF NOT EXISTS public.customers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_name text NOT NULL,
    contact_person text NULL,
    email text NULL,
    phone text NULL,
    address text NULL,
    city text NULL,
    postal_code text NULL,
    province text NULL,
    country text NULL DEFAULT 'Italia'::text,
    vat_number text NULL,
    tax_code text NULL,
    payment_terms integer NULL DEFAULT 30,
    discount_percentage numeric NULL DEFAULT 0,
    notes text NULL,
    created_by uuid NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    is_active boolean NOT NULL DEFAULT true,
    price_list_id uuid NULL,
    CONSTRAINT customers_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 3. Verifica se la tabella products esiste
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'products' AND schemaname = 'public') 
        THEN 'TABELLA PRODUCTS ESISTE' 
        ELSE 'TABELLA PRODUCTS NON ESISTE - DEVE ESSERE CREATA!' 
    END as products_table_status;

-- 4. Se la tabella products non esiste, creala
CREATE TABLE IF NOT EXISTS public.products (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code text NOT NULL,
    name text NOT NULL,
    description text NULL,
    category text NULL,
    unit text NULL DEFAULT 'pz'::text,
    base_price decimal(10,2) NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT products_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 5. Mostra la struttura della tabella customers
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Mostra la struttura della tabella products
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Conta i record nelle tabelle
SELECT 'customers' as table_name, COUNT(*) as record_count FROM public.customers
UNION ALL
SELECT 'products' as table_name, COUNT(*) as record_count FROM public.products;

-- 8. Verifica se le tabelle che vogliamo creare esistono già
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'sample_requests' AND schemaname = 'public') 
        THEN 'ESISTE' 
        ELSE 'MANCANTE' 
    END as sample_requests_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'price_lists' AND schemaname = 'public') 
        THEN 'ESISTE' 
        ELSE 'MANCANTE' 
    END as price_lists_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'orders' AND schemaname = 'public') 
        THEN 'ESISTE' 
        ELSE 'MANCANTE' 
    END as orders_status;

-- 9. Inserisci dati di test se le tabelle sono vuote
INSERT INTO public.customers (id, company_name, contact_person, email, is_active, created_by)
SELECT 
    gen_random_uuid(),
    'Cliente Test 1',
    'Mario Rossi',
    'test1@example.com',
    true,
    (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE company_name = 'Cliente Test 1');

INSERT INTO public.customers (id, company_name, contact_person, email, is_active, created_by)
SELECT 
    gen_random_uuid(),
    'Cliente Test 2',
    'Giulia Bianchi',
    'test2@example.com',
    true,
    (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE company_name = 'Cliente Test 2');

INSERT INTO public.products (id, code, name, description, category, unit, base_price, is_active, created_by)
SELECT 
    gen_random_uuid(),
    'PROD001',
    'Prodotto Test 1',
    'Descrizione prodotto test 1',
    'Categoria A',
    'pz',
    25.50,
    true,
    (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE code = 'PROD001');

INSERT INTO public.products (id, code, name, description, category, unit, base_price, is_active, created_by)
SELECT 
    gen_random_uuid(),
    'PROD002',
    'Prodotto Test 2',
    'Descrizione prodotto test 2',
    'Categoria B',
    'pz',
    15.75,
    true,
    (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE code = 'PROD002');

-- 10. Verifica finale
SELECT 
    'customers' as table_name, COUNT(*) as record_count FROM public.customers
UNION ALL
SELECT 'products' as table_name, COUNT(*) as record_count FROM public.products;

-- ==============================================
-- MESSAGGIO DI CONFERMA
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'VERIFICA COMPLETA DATABASE COMPLETATA!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Tabelle verificate e create se necessario:';
    RAISE NOTICE '- customers (con struttura completa)';
    RAISE NOTICE '- products (con struttura completa)';
    RAISE NOTICE 'Dati di test inseriti se le tabelle erano vuote.';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Ora puoi eseguire CREATE_TABLES_FINAL.sql';
    RAISE NOTICE '==============================================';
END $$;
