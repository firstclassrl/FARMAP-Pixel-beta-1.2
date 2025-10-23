-- Script per aggiungere permessi SALES alle tabelle price_lists
-- Eseguire questo script in Supabase SQL Editor

-- 1. Verifica il ruolo dell'utente pierluigi.pasetti@farmapindustry.it
SELECT 
    p.id,
    p.email,
    p.role,
    p.full_name
FROM public.profiles p
WHERE p.email = 'pierluigi.pasetti@farmapindustry.it';

-- 2. Verifica le policy attuali per price_lists
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
WHERE tablename = 'price_lists'
ORDER BY policyname;

-- 3. Rimuovi le policy esistenti per price_lists
DROP POLICY IF EXISTS "Commerciale can manage price_lists" ON public.price_lists;
DROP POLICY IF EXISTS "Lettore can read price_lists" ON public.price_lists;
DROP POLICY IF EXISTS "Admin and Commerciale can manage price_lists" ON public.price_lists;
DROP POLICY IF EXISTS "Everyone can read price_lists" ON public.price_lists;
DROP POLICY IF EXISTS "price_lists_policy" ON public.price_lists;
DROP POLICY IF EXISTS "Allow all operations on price_lists" ON public.price_lists;

-- 4. Crea nuova policy che include SALES
CREATE POLICY "Admin, Commerciale, and Sales can manage price_lists" ON public.price_lists
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'commerciale', 'sales')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'commerciale', 'sales')
        )
    );

-- 5. Verifica le policy attuali per price_list_items
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
WHERE tablename = 'price_list_items'
ORDER BY policyname;

-- 6. Rimuovi le policy esistenti per price_list_items
DROP POLICY IF EXISTS "Commerciale can manage price_list_items" ON public.price_list_items;
DROP POLICY IF EXISTS "Lettore can read price_list_items" ON public.price_list_items;
DROP POLICY IF EXISTS "Admin and Commerciale can manage price_list_items" ON public.price_list_items;
DROP POLICY IF EXISTS "Everyone can read price_list_items" ON public.price_list_items;
DROP POLICY IF EXISTS "price_list_items_policy" ON public.price_list_items;
DROP POLICY IF EXISTS "Allow all operations on price_list_items" ON public.price_list_items;

-- 7. Crea nuova policy che include SALES per price_list_items
CREATE POLICY "Admin, Commerciale, and Sales can manage price_list_items" ON public.price_list_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'commerciale', 'sales')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'commerciale', 'sales')
        )
    );

-- 8. Verifica che le nuove policy siano attive
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

-- 9. Test di verifica per l'utente sales
-- (Questo test dovrebbe funzionare se l'utente è autenticato)
SELECT 
    'Test per utente sales' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'commerciale', 'sales')
        ) THEN 'PERMESSI OK'
        ELSE 'PERMESSI NEGATI'
    END as result;
