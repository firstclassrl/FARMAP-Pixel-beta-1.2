-- ==============================================
-- STEP BY STEP FIX - VERIFICA PRIMA LA STRUTTURA
-- ==============================================

-- STEP 1: Verifica se la tabella customers esiste
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'customers' AND schemaname = 'public') 
        THEN 'TABELLA CUSTOMERS ESISTE' 
        ELSE 'TABELLA CUSTOMERS NON ESISTE' 
    END as customers_table_status;

-- STEP 2: Mostra tutte le colonne della tabella customers
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

-- STEP 3: Verifica se la tabella products esiste
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'products' AND schemaname = 'public') 
        THEN 'TABELLA PRODUCTS ESISTE' 
        ELSE 'TABELLA PRODUCTS NON ESISTE' 
    END as products_table_status;

-- STEP 4: Mostra tutte le colonne della tabella products
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

-- STEP 5: Verifica se le tabelle che vogliamo creare esistono già
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

-- STEP 6: Conta i record nelle tabelle esistenti
SELECT 'customers' as table_name, COUNT(*) as record_count FROM public.customers
UNION ALL
SELECT 'products' as table_name, COUNT(*) as record_count FROM public.products;
