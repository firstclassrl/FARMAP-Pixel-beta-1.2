-- =====================================================
-- ADD ONLY 'lab' ROLE TO user_role ENUM
-- PIXEL CRM - FARMAP
-- =====================================================
-- Questo script aggiunge solo il ruolo 'lab' all'enum user_role
-- se non è già presente.
-- =====================================================

-- Aggiungi 'lab' se non esiste già
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'lab'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    EXECUTE format('ALTER TYPE user_role ADD VALUE %L', 'lab');
    RAISE NOTICE 'Ruolo ''lab'' aggiunto all''enum user_role';
  ELSE
    RAISE NOTICE 'Ruolo ''lab'' già presente nell''enum user_role';
  END IF;
END $$;

-- Mostra tutti i ruoli presenti
SELECT 
  enumlabel as role_name,
  enumsortorder as sort_order
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

