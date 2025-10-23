-- Script per disabilitare completamente RLS per le tabelle listini
-- Eseguire questo script in Supabase SQL Editor

-- 1. Disabilita RLS per price_lists
ALTER TABLE public.price_lists DISABLE ROW LEVEL SECURITY;

-- 2. Disabilita RLS per price_list_items  
ALTER TABLE public.price_list_items DISABLE ROW LEVEL SECURITY;

-- 3. Verifica che RLS sia disabilitato
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('price_lists', 'price_list_items')
AND schemaname = 'public';

-- 4. Test di lettura (dovrebbe funzionare ora)
SELECT 
    'Test lettura price_lists' as test_name,
    COUNT(*) as count
FROM public.price_lists;

-- 5. Test di inserimento (opzionale - rimuovi il commento per testare)
/*
INSERT INTO public.price_lists (name, description, created_by) 
VALUES ('Test Listino RLS Disabled', 'Test con RLS disabilitato', gen_random_uuid())
RETURNING *;
*/

-- 6. Verifica se ci sono prodotti disponibili per i listini
SELECT 
    'Products available' as test_name,
    COUNT(*) as count
FROM public.products 
WHERE is_active = true;

-- 7. Mostra alcuni prodotti di esempio
SELECT 
    'Sample products' as test_name,
    id,
    code,
    name,
    base_price
FROM public.products 
WHERE is_active = true
LIMIT 5;
