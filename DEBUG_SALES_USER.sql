-- Script di debug approfondito per l'utente sales
-- Eseguire questo script in Supabase SQL Editor

-- 1. Verifica se l'utente è autenticato
SELECT 
    'auth.uid()' as check_type,
    auth.uid() as value,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'AUTENTICATO'
        ELSE 'NON AUTENTICATO'
    END as status;

-- 2. Verifica se l'utente esiste in auth.users
SELECT 
    'auth.users' as table_name,
    id,
    email,
    created_at
FROM auth.users 
WHERE email = 'pierluigi.pasetti@farmapindustry.it';

-- 3. Verifica se l'utente esiste in public.profiles
SELECT 
    'public.profiles' as table_name,
    id,
    email,
    role,
    full_name,
    created_at
FROM public.profiles 
WHERE email = 'pierluigi.pasetti@farmapindustry.it';

-- 4. Verifica se l'utente corrente (auth.uid()) esiste in profiles
SELECT 
    'current user in profiles' as check_type,
    p.id,
    p.email,
    p.role,
    p.full_name
FROM public.profiles p
WHERE p.id = auth.uid();

-- 5. Verifica le RLS policies della tabella profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 6. Test di accesso diretto alla tabella profiles (bypass RLS)
SET row_security = off;
SELECT 
    'profiles without RLS' as check_type,
    id,
    email,
    role,
    full_name
FROM public.profiles 
WHERE email = 'pierluigi.pasetti@farmapindustry.it';
SET row_security = on;

-- 7. Verifica se ci sono utenti con ruolo sales
SELECT 
    'all sales users' as check_type,
    id,
    email,
    role,
    full_name
FROM public.profiles 
WHERE role = 'sales';

-- 8. Test di inserimento/aggiornamento ruolo (se necessario)
-- ATTENZIONE: Rimuovi il commento solo se necessario
/*
UPDATE public.profiles 
SET role = 'sales' 
WHERE email = 'pierluigi.pasetti@farmapindustry.it'
RETURNING *;
*/

-- 9. Verifica finale dei permessi
SELECT 
    'Final permission check' as test_name,
    CASE 
        WHEN auth.uid() IS NULL THEN 'NON AUTENTICATO'
        WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()) THEN 'PROFILO MANCANTE'
        WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'commerciale', 'sales')) THEN 'RUOLO NON AUTORIZZATO'
        ELSE 'PERMESSI OK'
    END as result;
