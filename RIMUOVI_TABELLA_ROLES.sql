-- =====================================================
-- RIMUOVI TABELLA 'roles' RIDONDANTE
-- PIXEL CRM - FARMAP
-- =====================================================
-- Questo script rimuove la tabella 'roles' se esiste.
-- La tabella 'roles' è RIDONDANTE perché i ruoli vengono
-- gestiti dall'enum 'user_role' PostgreSQL nella colonna
-- profiles.role.
-- =====================================================
-- ATTENZIONE: Esegui prima VERIFICA_E_PULISCI_RUOLI.sql
-- per verificare che la tabella non sia necessaria.
-- =====================================================

DO $$
BEGIN
  -- Verifica se la tabella esiste
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'roles'
  ) THEN
    RAISE NOTICE 'Trovata tabella "roles". Procedo con la rimozione...';
    
    -- Rimuovi prima le policy RLS (se esistono)
    DROP POLICY IF EXISTS "Authenticated users can view roles" ON roles;
    DROP POLICY IF EXISTS "Only admins can modify roles" ON roles;
    RAISE NOTICE 'Policy RLS rimosse.';
    
    -- Rimuovi la tabella
    DROP TABLE IF EXISTS roles CASCADE;
    RAISE NOTICE '✅ Tabella "roles" rimossa con successo!';
    RAISE NOTICE '';
    RAISE NOTICE 'I ruoli continuano a funzionare correttamente perché';
    RAISE NOTICE 'vengono letti dall''enum "user_role" nella colonna profiles.role.';
    
  ELSE
    RAISE NOTICE 'La tabella "roles" non esiste. Nulla da rimuovere.';
  END IF;
END $$;

-- Verifica finale: mostra che l'enum user_role è ancora presente
SELECT 
  'Verifica: Enum user_role ancora presente ✅' as verifica,
  COUNT(*) as "Numero di ruoli nell'enum"
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');

-- =====================================================
-- END OF SCRIPT
-- =====================================================






