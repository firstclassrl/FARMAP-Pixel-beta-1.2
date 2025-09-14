-- ==============================================
-- VERIFICA STRUTTURA DATABASE ESISTENTE
-- ==============================================

-- 1. Mostra tutte le tabelle esistenti
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. Mostra struttura tabella customers
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Mostra struttura tabella products
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verifica se le tabelle mancanti esistono
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

-- 5. Conta record nelle tabelle esistenti
SELECT 'customers' as table_name, COUNT(*) as record_count FROM public.customers
UNION ALL
SELECT 'products' as table_name, COUNT(*) as record_count FROM public.products;

-- 6. Verifica colonne is_active
SELECT 
    'customers' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'is_active') 
        THEN 'ESISTE' 
        ELSE 'MANCANTE' 
    END as is_active_column
UNION ALL
SELECT 
    'products' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_active') 
        THEN 'ESISTE' 
        ELSE 'MANCANTE' 
    END as is_active_column;
