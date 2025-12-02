-- =====================================================
-- VERIFICA TRIGGER E FUNZIONI CHE MODIFICANO IL RUOLO
-- =====================================================
-- Questo script verifica se ci sono trigger o funzioni
-- che potrebbero resettare il ruolo a 'sales'
-- =====================================================

-- 1. Verifica tutti i trigger sulla tabella profiles
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- 2. Verifica le funzioni che contengono 'role' o 'sales'
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND (
    prosrc ILIKE '%role%' 
    OR prosrc ILIKE '%sales%'
    OR prosrc ILIKE '%profiles%'
  )
ORDER BY proname;

-- 3. Verifica se ci sono trigger su auth.users che modificano profiles
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND action_statement ILIKE '%profiles%'
ORDER BY trigger_name;

-- 4. Verifica le policy RLS sulla tabella profiles
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;

-- 5. Verifica se ci sono default values sulla colonna role
SELECT 
  column_name,
  column_default,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'role';

-- =====================================================
-- RISULTATO:
-- Cerca trigger o funzioni che:
-- - Modificano 'role' = 'sales'
-- - Si attivano su UPDATE o INSERT
-- - Si attivano su eventi di autenticazione
-- =====================================================

