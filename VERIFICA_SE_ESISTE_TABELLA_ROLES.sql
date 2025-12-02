-- =====================================================
-- VERIFICA SE ESISTE LA TABELLA 'roles'
-- =====================================================

-- 1. Verifica se la tabella 'roles' esiste
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'roles'
    ) THEN '⚠️ La tabella "roles" ESISTE nel database (RIDONDANTE)'
    ELSE '✅ La tabella "roles" NON ESISTE (perfetto!)'
  END as status;

-- 2. Se esiste, mostra il contenuto
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'roles'
  ) THEN
    RAISE NOTICE 'La tabella "roles" esiste. Contenuto:';
  ELSE
    RAISE NOTICE 'La tabella "roles" non esiste. Tutto OK!';
  END IF;
END $$;

-- 3. Mostra la struttura se esiste
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'roles'
ORDER BY ordinal_position;

-- 4. Mostra il contenuto se esiste (uncomment se vuoi vederlo)
-- SELECT * FROM roles;

-- =====================================================
-- RISULTATO:
-- - Se la tabella esiste → Esegui RIMUOVI_TABELLA_ROLES.sql
-- - Se NON esiste → Tutto OK, nessun problema!
-- =====================================================

