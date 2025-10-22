-- Fix ruolo utente grafica per limitare accesso solo a Garden
-- Eseguire questo script in Supabase SQL Editor

-- 1) Verifica utenti grafica attuali
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data,
  p.role as current_role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email ILIKE '%grafica%';

-- 2) Aggiorna ruolo in auth.users per utenti grafica
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "production"}'::jsonb
WHERE email ILIKE '%grafica%';

-- 3) Aggiorna ruolo in public.profiles per utenti grafica
UPDATE public.profiles 
SET role = 'production'::user_role
WHERE email ILIKE '%grafica%';

-- 4) Se gli utenti grafica non esistono in profiles, creali
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) AS full_name,
  'production'::user_role,
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email ILIKE '%grafica%'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- 5) Verifica risultato finale
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'role' as auth_role,
  p.role as profile_role,
  p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email ILIKE '%grafica%';
