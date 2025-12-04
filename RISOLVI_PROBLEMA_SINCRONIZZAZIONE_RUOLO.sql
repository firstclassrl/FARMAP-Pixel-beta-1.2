-- =====================================================
-- RISOLVI: Trigger che resetta il ruolo a 'sales'
-- =====================================================
-- PROBLEMA: Il trigger on_auth_user_updated sincronizza
-- il ruolo da auth.users.raw_user_meta_data a profiles.role
-- Quando l'utente fa login, il trigger si attiva e 
-- sovrascrive il ruolo con quello in raw_user_meta_data
-- =====================================================

-- 1. VERIFICA: Mostra tutti i trigger su auth.users
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- 2. VERIFICA: Mostra il contenuto di raw_user_meta_data per l'utente
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role_in_metadata,
  raw_user_meta_data->>'full_name' as full_name_in_metadata
FROM auth.users
WHERE email LIKE '%farmapindustry.it%'
ORDER BY email;

-- 3. VERIFICA: Confronta ruolo in auth.users vs profiles
SELECT 
  u.email,
  u.raw_user_meta_data->>'role' as auth_role,
  p.role as profile_role,
  CASE 
    WHEN u.raw_user_meta_data->>'role' != p.role::text THEN '⚠️ DIVERGENZA'
    ELSE '✅ OK'
  END as status
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email LIKE '%farmapindustry.it%'
ORDER BY u.email;

-- 4. SOLUZIONE: Rimuovi il trigger che causa il problema
-- ATTENZIONE: Rimuovi i commenti per eseguire
/*
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
RAISE NOTICE 'Trigger on_auth_user_updated rimosso. Il ruolo non verrà più sovrascritto.';
*/

-- 5. SOLUZIONE ALTERNATIVA: Aggiorna raw_user_meta_data quando cambi il ruolo
-- Quando cambi il ruolo in profiles, aggiorna anche auth.users.raw_user_meta_data
-- Esempio per un utente specifico:
/*
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'lab')
WHERE email = 'email_utente@farmapindustry.it';
*/

-- =====================================================
-- ISTRUZIONI:
-- =====================================================
-- 1. Esegui le query 1-3 per verificare il problema
-- 2. Se il trigger on_auth_user_updated esiste, rimuovilo (query 4)
-- 3. OPPURE aggiorna raw_user_meta_data in auth.users (query 5)
--    per sincronizzarlo con il ruolo corretto
-- =====================================================


