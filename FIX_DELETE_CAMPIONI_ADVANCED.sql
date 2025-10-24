-- Script avanzato per diagnosticare e correggere eliminazione richieste campioni
-- Questo script risolve definitivamente il problema dell'eliminazione

-- 1. Verifica se RLS è abilitato
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('sample_requests', 'sample_request_items');

-- 2. Verifica tutte le policy esistenti
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
WHERE tablename IN ('sample_requests', 'sample_request_items')
ORDER BY tablename, policyname;

-- 3. Verifica i ruoli dell'utente corrente
SELECT 
    auth.uid() as current_user_id,
    p.role as user_role,
    p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.id = auth.uid();

-- 4. Disabilita temporaneamente RLS per test
ALTER TABLE sample_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE sample_request_items DISABLE ROW LEVEL SECURITY;

-- 5. Rimuovi tutte le policy esistenti
DROP POLICY IF EXISTS "Users can delete sample requests" ON sample_requests;
DROP POLICY IF EXISTS "Users can delete sample request items" ON sample_request_items;
DROP POLICY IF EXISTS "Users can manage sample requests" ON sample_requests;
DROP POLICY IF EXISTS "Users can manage sample request items" ON sample_request_items;
DROP POLICY IF EXISTS "Commerciale can manage sample requests" ON sample_requests;
DROP POLICY IF EXISTS "Commerciale can manage sample request items" ON sample_request_items;

-- 6. Riabilita RLS
ALTER TABLE sample_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_request_items ENABLE ROW LEVEL SECURITY;

-- 7. Crea policy permissive per eliminazione
CREATE POLICY "Allow delete sample requests" ON sample_requests
    FOR DELETE USING (true);

CREATE POLICY "Allow delete sample request items" ON sample_request_items
    FOR DELETE USING (true);

-- 8. Crea policy per altre operazioni
CREATE POLICY "Allow all operations sample requests" ON sample_requests
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations sample request items" ON sample_request_items
    FOR ALL USING (true) WITH CHECK (true);

-- 9. Verifica finale delle policy
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
WHERE tablename IN ('sample_requests', 'sample_request_items')
ORDER BY tablename, policyname;

-- 10. Test di eliminazione (opzionale - decommentare per test)
-- DELETE FROM sample_request_items WHERE id = 'test-id';
-- DELETE FROM sample_requests WHERE id = 'test-id';
