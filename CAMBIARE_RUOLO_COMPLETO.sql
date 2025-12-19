-- =====================================================
-- CAMBIA RUOLO: Aggiorna sia profiles che auth.users
-- =====================================================
-- Quando cambi il ruolo di un utente, devi aggiornare
-- sia profiles.role che auth.users.raw_user_meta_data
-- per evitare che il trigger lo resetti
-- =====================================================

-- IMPORTANTE: Sostituisci queste variabili con i valori corretti
-- email_utente: l'email dell'utente
-- nuovo_ruolo: il nuovo ruolo (admin, commerciale, lettore, production, sales, customer_user, lab)

-- ESEMPIO:
-- SET email_utente = 'utente@example.com';
-- SET nuovo_ruolo = 'lab';

-- 1. Aggiorna il ruolo in profiles
UPDATE public.profiles
SET 
  role = 'lab'::user_role,  -- CAMBIA QUI il ruolo
  updated_at = now()
WHERE email = 'email_utente@farmapindustry.it';  -- CAMBIA QUI l'email

-- 2. Aggiorna anche auth.users.raw_user_meta_data
UPDATE auth.users
SET 
  raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) 
    || jsonb_build_object('role', 'lab')  -- CAMBIA QUI il ruolo
WHERE email = 'email_utente@farmapindustry.it';  -- CAMBIA QUI l'email

-- 3. Verifica che entrambi siano aggiornati
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
WHERE u.email = 'email_utente@farmapindustry.it';  -- CAMBIA QUI l'email

-- =====================================================
-- USO:
-- 1. Cambia l'email dell'utente nelle 3 query
-- 2. Cambia il nuovo ruolo nelle 2 query UPDATE
-- 3. Esegui tutto lo script
-- =====================================================






