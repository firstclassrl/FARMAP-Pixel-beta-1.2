-- Script di debug completo per i listini
-- Eseguire questo script in Supabase SQL Editor

-- 1. Verifica che le tabelle esistano e abbiano la struttura corretta
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

-- 2. Verifica RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('price_lists', 'price_list_items')
AND schemaname = 'public';

-- 3. Verifica tutte le policy attive
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('price_lists', 'price_list_items')
ORDER BY tablename, policyname;

-- 4. Verifica il tuo utente e ruolo
SELECT 
    p.id,
    p.email,
    p.role,
    p.full_name,
    p.created_at
FROM public.profiles p
WHERE p.id = auth.uid();

-- 5. Verifica se ci sono record esistenti
SELECT 'price_lists' as table_name, COUNT(*) as count FROM public.price_lists
UNION ALL
SELECT 'price_list_items' as table_name, COUNT(*) as count FROM public.price_list_items;

-- 6. Test di lettura (dovrebbe funzionare)
SELECT * FROM public.price_lists LIMIT 5;

-- 7. Test di inserimento (rimuovi il commento per testare)
/*
INSERT INTO public.price_lists (name, description, created_by) 
VALUES ('Test Debug Listino', 'Test per debug', auth.uid())
RETURNING *;
*/

-- 8. Verifica se la tabella products esiste (necessaria per price_list_items)
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'products'
ORDER BY ordinal_position
LIMIT 10;

-- 9. Verifica se ci sono prodotti disponibili
SELECT COUNT(*) as products_count FROM public.products WHERE is_active = true;
