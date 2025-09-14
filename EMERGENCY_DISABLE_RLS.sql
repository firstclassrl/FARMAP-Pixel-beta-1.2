-- EMERGENCY FIX: Disabilita completamente RLS per fermare il loop
-- Esegui questo IMMEDIATAMENTE nel SQL Editor di Supabase

-- 1. DISABILITA COMPLETAMENTE RLS SULLA TABELLA PROFILES
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. DROP TUTTE LE POLITICHE ESISTENTI
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public read access for lettore" ON profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Public read access" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON profiles;

-- 3. VERIFICA CHE RLS SIA DISABILITATO
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- 4. MESSAGGIO DI CONFERMA
SELECT 'RLS DISABILITATO - Il loop dovrebbe essere fermato!' as status;
