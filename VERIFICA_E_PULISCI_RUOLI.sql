-- =====================================================
-- VERIFICA E PULISCI: UNIFICA FONTE RUOLI
-- PIXEL CRM - FARMAP
-- =====================================================
-- Questo script:
-- 1. Verifica se esiste una tabella 'roles' (ridondante)
-- 2. Mostra da dove vengono realmente letti i ruoli
-- 3. Rimuove la tabella 'roles' se non serve
-- =====================================================

-- =====================================================
-- 1. VERIFICA: Mostra struttura attuale
-- =====================================================

-- Verifica se esiste la tabella 'roles'
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'roles'
    ) THEN 'La tabella "roles" ESISTE nel database'
    ELSE 'La tabella "roles" NON ESISTE nel database'
  END as status_tabella_roles;

-- Verifica se esiste l'enum 'user_role' (QUESTO È QUELLO GIUSTO!)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_type WHERE typname = 'user_role'
    ) THEN 'L''enum "user_role" ESISTE nel database ✅'
    ELSE 'L''enum "user_role" NON ESISTE nel database ❌'
  END as status_enum_user_role;

-- =====================================================
-- 2. MOSTRA: Valori dell'enum user_role (FONTE CORRETTA)
-- =====================================================

SELECT 
  'ENUM user_role (QUESTO È QUELLO USATO DALL''APPLICAZIONE)' as fonte,
  enumlabel as "Ruolo",
  enumsortorder as "Ordine"
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

-- =====================================================
-- 3. MOSTRA: Contenuto della tabella roles (se esiste)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'roles'
  ) THEN
    RAISE NOTICE 'La tabella "roles" esiste. Controlla manualmente se contiene dati importanti.';
    RAISE NOTICE 'Esegui: SELECT * FROM roles; per vedere il contenuto.';
  ELSE
    RAISE NOTICE 'La tabella "roles" non esiste. Nulla da rimuovere.';
  END IF;
END $$;

-- =====================================================
-- 4. VERIFICA: Come vengono usati i ruoli nell'applicazione
-- =====================================================

-- I ruoli vengono letti dalla colonna 'role' della tabella 'profiles'
-- che è di tipo 'user_role' enum
SELECT 
  'I ruoli vengono letti dalla tabella profiles.role (tipo: user_role enum)' as informazione,
  COUNT(*) as "Numero utenti con profilo"
FROM profiles;

-- =====================================================
-- 5. RIMUOVI: Tabella 'roles' se esiste e non serve
-- =====================================================
-- ATTENZIONE: Rimuovi i commenti dalle righe seguenti solo se sei sicuro
-- che la tabella 'roles' non venga usata da nessuna parte.

/*
-- Rimuovi le policy RLS sulla tabella roles (se esistono)
DROP POLICY IF EXISTS "Authenticated users can view roles" ON roles;
DROP POLICY IF EXISTS "Only admins can modify roles" ON roles;

-- Rimuovi la tabella roles (se esiste e non serve)
DROP TABLE IF EXISTS roles CASCADE;

RAISE NOTICE 'Tabella "roles" rimossa con successo (se esisteva).';
*/

-- =====================================================
-- NOTA FINALE
-- =====================================================
-- L'applicazione legge i ruoli dall'enum 'user_role' tramite:
-- - La colonna profiles.role (tipo: user_role enum)
-- - I valori sono definiti nell'enum PostgreSQL
-- - La tabella 'roles' (se esiste) è RIDONDANTE e può essere rimossa
-- =====================================================





