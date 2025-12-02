-- =====================================================
-- ADD ALL MISSING ROLES TO user_role ENUM
-- PIXEL CRM - FARMAP
-- =====================================================
-- Questo script aggiunge tutti i ruoli mancanti all'enum user_role.
-- Ruoli che verranno aggiunti (se non già presenti):
--   - 'lab' (Laboratorio)
--   - 'production' (Produzione)
--   - 'sales' (Vendite)
--   - 'customer_user' (Cliente)
-- =====================================================
-- Lo script è idempotente: può essere eseguito più volte senza problemi.
-- Verifica se ogni ruolo esiste prima di aggiungerlo.
-- =====================================================

DO $$
DECLARE
  enum_oid oid;
  role_value text;
  roles_to_add text[] := ARRAY['lab', 'production', 'sales', 'customer_user'];
BEGIN
  -- Verifica che l'enum user_role esista
  SELECT oid INTO enum_oid
  FROM pg_type
  WHERE typname = 'user_role';
  
  IF enum_oid IS NULL THEN
    RAISE EXCEPTION 'L''enum user_role non esiste nel database. Verifica che lo schema sia stato inizializzato correttamente.';
  END IF;
  
  RAISE NOTICE 'Enum user_role trovato. Aggiunta dei ruoli mancanti...';
  
  -- Aggiungi ogni ruolo se non esiste già
  FOREACH role_value IN ARRAY roles_to_add LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum
      WHERE enumlabel = role_value
        AND enumtypid = enum_oid
    ) THEN
      EXECUTE format('ALTER TYPE user_role ADD VALUE %L', role_value);
      RAISE NOTICE 'Ruolo ''%'' aggiunto all''enum user_role', role_value;
    ELSE
      RAISE NOTICE 'Ruolo ''%'' già presente nell''enum user_role, saltato', role_value;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Script completato con successo!';
END $$;

-- Verifica finale: mostra tutti i ruoli presenti nell'enum
DO $$
DECLARE
  roles_list text;
BEGIN
  SELECT string_agg(enumlabel::text, ', ' ORDER BY enumsortorder)
  INTO roles_list
  FROM pg_enum
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');
  
  RAISE NOTICE 'Ruoli attualmente presenti nell''enum user_role: %', roles_list;
END $$;

-- =====================================================
-- END OF SCRIPT
-- =====================================================

