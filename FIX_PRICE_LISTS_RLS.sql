-- Script per correggere le RLS policies delle tabelle price_lists
-- Eseguire questo script in Supabase SQL Editor

-- 1. Verifica le policy attuali
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

-- 2. Verifica il tuo ruolo utente
SELECT 
    p.id,
    p.email,
    p.role,
    p.full_name
FROM public.profiles p
WHERE p.id = auth.uid();

-- 3. Rimuovi tutte le policy esistenti per price_lists
DROP POLICY IF EXISTS "Commerciale can manage price_lists" ON public.price_lists;
DROP POLICY IF EXISTS "Lettore can read price_lists" ON public.price_lists;
DROP POLICY IF EXISTS "Admin and Commerciale can manage price_lists" ON public.price_lists;
DROP POLICY IF EXISTS "Everyone can read price_lists" ON public.price_lists;
DROP POLICY IF EXISTS "price_lists_policy" ON public.price_lists;

-- 4. Rimuovi tutte le policy esistenti per price_list_items
DROP POLICY IF EXISTS "Commerciale can manage price_list_items" ON public.price_list_items;
DROP POLICY IF EXISTS "Lettore can read price_list_items" ON public.price_list_items;
DROP POLICY IF EXISTS "Admin and Commerciale can manage price_list_items" ON public.price_list_items;
DROP POLICY IF EXISTS "Everyone can read price_list_items" ON public.price_list_items;
DROP POLICY IF EXISTS "price_list_items_policy" ON public.price_list_items;

-- 5. Crea nuove policy permissive per price_lists
CREATE POLICY "Allow all operations on price_lists" ON public.price_lists
    FOR ALL USING (true)
    WITH CHECK (true);

-- 6. Crea nuove policy permissive per price_list_items
CREATE POLICY "Allow all operations on price_list_items" ON public.price_list_items
    FOR ALL USING (true)
    WITH CHECK (true);

-- 7. Verifica che le nuove policy siano attive
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('price_lists', 'price_list_items')
ORDER BY tablename, policyname;

-- 8. Test di inserimento (opzionale - rimuovi il commento per testare)
/*
INSERT INTO public.price_lists (name, description, created_by) 
VALUES ('Test Listino', 'Test description', auth.uid())
RETURNING *;
*/
