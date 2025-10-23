-- Script per verificare se le tabelle esistono
-- Eseguire questo script in Supabase SQL Editor

-- Verifica se le tabelle esistono
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTS'
        ELSE 'NOT EXISTS'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('price_lists', 'price_list_items')
ORDER BY table_name;

-- Se le tabelle esistono, mostra la struttura
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('price_lists', 'price_list_items')
ORDER BY table_name, ordinal_position;

-- Conta i record nelle tabelle (se esistono)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'price_lists' AND table_schema = 'public') THEN
        RAISE NOTICE 'price_lists table exists with % records', (SELECT COUNT(*) FROM public.price_lists);
    ELSE
        RAISE NOTICE 'price_lists table does NOT exist';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'price_list_items' AND table_schema = 'public') THEN
        RAISE NOTICE 'price_list_items table exists with % records', (SELECT COUNT(*) FROM public.price_list_items);
    ELSE
        RAISE NOTICE 'price_list_items table does NOT exist';
    END IF;
END $$;
