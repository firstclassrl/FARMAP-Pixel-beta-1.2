-- =====================================================
-- VERIFICA E AGGIUNGI RUOLO 'lab'
-- =====================================================

-- 1. VERIFICA: Mostra tutti i ruoli attuali
SELECT 
  enumlabel as "Ruolo",
  enumsortorder as "Ordine"
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

-- 2. VERIFICA: Controlla se 'lab' esiste già
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1
      FROM pg_enum
      WHERE enumlabel = 'lab'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN 'Il ruolo "lab" ESISTE già'
    ELSE 'Il ruolo "lab" NON ESISTE - verrà aggiunto ora'
  END as status;

-- 3. AGGIUNGI: Aggiungi 'lab' se non esiste
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'lab'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    EXECUTE format('ALTER TYPE user_role ADD VALUE %L', 'lab');
    RAISE NOTICE '✅ Ruolo ''lab'' aggiunto con successo!';
  ELSE
    RAISE NOTICE 'ℹ️  Ruolo ''lab'' già presente.';
  END IF;
END $$;

-- 4. VERIFICA FINALE: Mostra di nuovo tutti i ruoli
SELECT 
  enumlabel as "Ruolo",
  enumsortorder as "Ordine"
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;


