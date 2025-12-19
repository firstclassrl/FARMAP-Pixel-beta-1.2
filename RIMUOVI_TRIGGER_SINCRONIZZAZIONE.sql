-- =====================================================
-- RIMUOVI: Trigger che causa problemi di sincronizzazione
-- =====================================================
-- Questo script rimuove il trigger on_auth_user_updated
-- che sovrascrive il ruolo in profiles quando auth.users viene aggiornato
-- =====================================================

-- 1. Verifica se il trigger esiste
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_updated';

-- 2. Rimuovi il trigger se esiste
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- 3. Verifica che sia stato rimosso
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE event_object_schema = 'auth'
        AND event_object_table = 'users'
        AND trigger_name = 'on_auth_user_updated'
    ) THEN '⚠️ Il trigger esiste ancora'
    ELSE '✅ Il trigger è stato rimosso'
  END as status;

-- =====================================================
-- DOPO LA RIMOZIONE:
-- =====================================================
-- 1. Il ruolo in profiles.role NON verrà più sovrascritto
-- 2. Quando cambi il ruolo, aggiorna SOLO profiles.role
-- 3. Non è più necessario sincronizzare auth.users.raw_user_meta_data
-- =====================================================






