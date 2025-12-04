-- Configurazione Policy RLS per il bucket order-pdfs
-- IMPORTANTE: Il bucket 'order-pdfs' deve essere creato manualmente dalla dashboard Supabase prima di eseguire questo script
-- Storage > New bucket > Nome: order-pdfs > Public: SÌ

-- Rimuovi policy esistenti se presenti (evita duplicati)
DROP POLICY IF EXISTS "Allow authenticated users to upload order pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to order pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update order pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete order pdfs" ON storage.objects;

-- Policy per permettere upload dei PDF
CREATE POLICY "Allow authenticated users to upload order pdfs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'order-pdfs' 
  AND auth.role() = 'authenticated'
);

-- Policy per permettere lettura pubblica dei PDF
CREATE POLICY "Allow public read access to order pdfs" ON storage.objects
FOR SELECT USING (bucket_id = 'order-pdfs');

-- Policy per permettere aggiornamento dei PDF
CREATE POLICY "Allow authenticated users to update order pdfs" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'order-pdfs' 
  AND auth.role() = 'authenticated'
);

-- Policy per permettere eliminazione dei PDF
CREATE POLICY "Allow authenticated users to delete order pdfs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'order-pdfs' 
  AND auth.role() = 'authenticated'
);

-- Verifica che le policy siano state create
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%order pdfs%'
ORDER BY policyname;

