-- Script per verificare e correggere le policy RLS per eliminazione richieste campioni
-- Questo script risolve il problema dell'eliminazione delle richieste campioni

-- Verifica le policy attuali per sample_requests
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
WHERE tablename = 'sample_requests';

-- Verifica le policy per sample_request_items
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
WHERE tablename = 'sample_request_items';

-- Rimuovi policy esistenti se necessario
DROP POLICY IF EXISTS "Users can delete their own sample requests" ON sample_requests;
DROP POLICY IF EXISTS "Users can delete sample request items" ON sample_request_items;

-- Crea policy per eliminazione sample_requests
CREATE POLICY "Users can delete sample requests" ON sample_requests
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'commerciale')
        )
    );

-- Crea policy per eliminazione sample_request_items
CREATE POLICY "Users can delete sample request items" ON sample_request_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'commerciale')
        )
    );

-- Verifica finale delle policy
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
