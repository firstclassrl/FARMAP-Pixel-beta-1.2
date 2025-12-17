-- =====================================================
-- AGGIORNA: Sincronizza ruolo in auth.users.raw_user_meta_data
-- =====================================================
-- Questo script aggiorna il ruolo in auth.users.raw_user_meta_data
-- per sincronizzarlo con quello in profiles.role
-- =====================================================

-- 1. Mostra gli utenti con ruoli divergenti
SELECT 
  u.email,
  u.raw_user_meta_data->>'role' as auth_role,
  p.role as profile_role
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE (u.raw_user_meta_data->>'role')::text IS DISTINCT FROM p.role::text
ORDER BY u.email;

-- 2. Aggiorna auth.users.raw_user_meta_data per sincronizzarlo con profiles.role
-- Questo previene che il trigger resetti il ruolo
UPDATE auth.users u
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) 
  || jsonb_build_object('role', p.role)
FROM public.profiles p
WHERE u.id = p.id
  AND (u.raw_user_meta_data->>'role')::text IS DISTINCT FROM p.role::text;

-- 3. Verifica l'aggiornamento
SELECT 
  u.email,
  u.raw_user_meta_data->>'role' as auth_role,
  p.role as profile_role,
  CASE 
    WHEN u.raw_user_meta_data->>'role' = p.role::text THEN '✅ Sincronizzato'
    ELSE '⚠️ Ancora divergente'
  END as status
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
ORDER BY u.email;

-- =====================================================
-- NOTA:
-- Dopo questo aggiornamento, quando cambi il ruolo
-- in profiles, ricordati di aggiornare anche
-- auth.users.raw_user_meta_data
-- =====================================================





