-- =====================================================
-- SINCRONIZZA: Aggiorna profiles.role per laboratorio
-- =====================================================
-- L'utente laboratorio@farmapindustry.it ha:
-- - auth_role: lab (corretto)
-- - profile_role: sales (sbagliato)
-- 
-- Questo script aggiorna profiles.role a 'lab'
-- =====================================================

-- 1. Aggiorna il ruolo in profiles per sincronizzarlo con auth.users
UPDATE public.profiles
SET 
  role = 'lab'::user_role,
  updated_at = now()
WHERE email = 'laboratorio@farmapindustry.it';

-- 2. Verifica l'aggiornamento
SELECT 
  u.email,
  u.raw_user_meta_data->>'role' as auth_role,
  p.role as profile_role,
  CASE 
    WHEN u.raw_user_meta_data->>'role' = p.role::text THEN '✅ Sincronizzato'
    ELSE '⚠️ Divergente'
  END as status
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'laboratorio@farmapindustry.it';

-- 3. Opzionale: Se vuoi sincronizzare tutti gli utenti con divergenze
UPDATE public.profiles p
SET 
  role = (u.raw_user_meta_data->>'role')::user_role,
  updated_at = now()
FROM auth.users u
WHERE p.id = u.id
  AND u.raw_user_meta_data ? 'role'
  AND (u.raw_user_meta_data->>'role')::text IS DISTINCT FROM p.role::text
  AND (u.raw_user_meta_data->>'role') IN (
    SELECT enumlabel FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  );

-- 4. Verifica finale: mostra tutti gli utenti sincronizzati
SELECT 
  u.email,
  u.raw_user_meta_data->>'role' as auth_role,
  p.role as profile_role,
  CASE 
    WHEN u.raw_user_meta_data->>'role' = p.role::text THEN '✅ OK'
    ELSE '⚠️ DIVERGENZA'
  END as status
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email LIKE '%farmapindustry.it%'
ORDER BY u.email;






