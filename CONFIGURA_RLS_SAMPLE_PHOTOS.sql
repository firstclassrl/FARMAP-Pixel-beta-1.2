-- Configurazione Policy RLS per il bucket sample-photos
-- IMPORTANTE: Il bucket 'sample-photos' deve essere creato manualmente dalla dashboard Supabase prima di eseguire questo script
-- Storage > New bucket > Nome: sample-photos > Public: SÌ

-- Rimuovi policy esistenti se presenti (evita duplicati)
DROP POLICY IF EXISTS "Allow authenticated users to upload sample photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to sample photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update sample photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete sample photos" ON storage.objects;

-- Policy per permettere upload delle foto
CREATE POLICY "Allow authenticated users to upload sample photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'sample-photos' 
  AND auth.role() = 'authenticated'
);

-- Policy per permettere lettura pubblica delle foto
CREATE POLICY "Allow public read access to sample photos" ON storage.objects
FOR SELECT USING (bucket_id = 'sample-photos');

-- Policy per permettere aggiornamento delle foto
CREATE POLICY "Allow authenticated users to update sample photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'sample-photos' 
  AND auth.role() = 'authenticated'
);

-- Policy per permettere eliminazione delle foto
CREATE POLICY "Allow authenticated users to delete sample photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'sample-photos' 
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
  AND policyname LIKE '%sample photos%'
ORDER BY policyname;



