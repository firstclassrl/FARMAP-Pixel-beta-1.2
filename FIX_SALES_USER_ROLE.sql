-- Script per correggere il ruolo dell'utente sales
-- Eseguire questo script in Supabase SQL Editor

-- 1. Verifica lo stato attuale dell'utente
SELECT 
    'Current state' as check_type,
    p.id,
    p.email,
    p.role,
    p.full_name,
    p.created_at
FROM public.profiles p
WHERE p.email = 'pierluigi.pasetti@farmapindustry.it';

-- 2. Aggiorna il ruolo a 'sales' se necessario
UPDATE public.profiles 
SET 
    role = 'sales',
    updated_at = now()
WHERE email = 'pierluigi.pasetti@farmapindustry.it'
RETURNING *;

-- 3. Verifica l'aggiornamento
SELECT 
    'After update' as check_type,
    p.id,
    p.email,
    p.role,
    p.full_name,
    p.updated_at
FROM public.profiles p
WHERE p.email = 'pierluigi.pasetti@farmapindustry.it';

-- 4. Se l'utente non esiste in profiles, crealo
INSERT INTO public.profiles (id, email, role, full_name, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    'sales'::user_role,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Pierluigi Pasetti'),
    now(),
    now()
FROM auth.users u
WHERE u.email = 'pierluigi.pasetti@farmapindustry.it'
AND NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.email = 'pierluigi.pasetti@farmapindustry.it'
)
RETURNING *;

-- 5. Verifica finale
SELECT 
    'Final verification' as check_type,
    p.id,
    p.email,
    p.role,
    p.full_name
FROM public.profiles p
WHERE p.email = 'pierluigi.pasetti@farmapindustry.it';

-- 6. Test dei permessi dopo la correzione
SELECT 
    'Permission test after fix' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE email = 'pierluigi.pasetti@farmapindustry.it'
            AND role IN ('admin', 'commerciale', 'sales')
        ) THEN 'PERMESSI OK'
        ELSE 'PERMESSI NEGATI'
    END as result;
