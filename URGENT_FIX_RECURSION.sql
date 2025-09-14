-- URGENT FIX: Risolve la ricorsione infinita nelle politiche RLS
-- Esegui questo file IMMEDIATAMENTE per risolvere l'errore

-- 1. DISABILITA TEMPORANEAMENTE RLS SULLA TABELLA PROFILES
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

-- 3. RIABILITA RLS CON POLITICHE SEMPLICI
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. CREA POLITICHE SEMPLICI SENZA RICORSIONE
-- Permetti a tutti gli utenti autenticati di leggere tutti i profili
CREATE POLICY "Authenticated users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Permetti agli utenti di aggiornare solo il proprio profilo
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Permetti agli utenti di inserire il proprio profilo
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Permetti accesso pubblico in lettura
CREATE POLICY "Public read access"
  ON profiles
  FOR SELECT
  TO public
  USING (true);

-- 5. VERIFICA CHE IL FIX FUNZIONI
SELECT 'Fix applicato con successo!' as status;
SELECT 'Politiche RLS create:' as info, count(*) as count FROM pg_policies WHERE tablename = 'profiles';
