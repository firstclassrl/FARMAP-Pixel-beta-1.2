-- URGENTE: Fix ruolo production per etichette@farmap.it
-- Eseguire IMMEDIATAMENTE in Supabase SQL Editor

-- 1) Verifica stato attuale
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data,
  p.role as current_role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'etichette@farmap.it';

-- 2) Aggiorna ruolo in auth.users (raw_user_meta_data)
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "production"}'::jsonb
WHERE email = 'etichette@farmap.it';

-- 3) Aggiorna ruolo in public.profiles
UPDATE public.profiles 
SET role = 'production'::user_role
WHERE email = 'etichette@farmap.it';

-- 4) Se l'utente non esiste in profiles, crealo
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) AS full_name,
  'production'::user_role,
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'etichette@farmap.it'
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
WHERE u.email = 'etichette@farmap.it';
