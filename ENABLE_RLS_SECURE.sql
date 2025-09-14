-- Riabilita RLS con politiche sicure che non causano ricorsione
-- Esegui questo nel SQL Editor di Supabase

-- ==============================================
-- 1. RIABILITA RLS SULLA TABELLA PROFILES
-- ==============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 2. DROP TUTTE LE POLITICHE ESISTENTI
-- ==============================================

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public read access for lettore" ON profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Public read access" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON profiles;

-- ==============================================
-- 3. CREA POLITICHE SICURE SENZA RICORSIONE
-- ==============================================

-- Politica 1: Tutti gli utenti autenticati possono leggere tutti i profili
-- (Necessario per la gestione utenti)
CREATE POLICY "Authenticated users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Politica 2: Gli utenti possono aggiornare solo il proprio profilo
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politica 3: Gli utenti possono inserire solo il proprio profilo
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Politica 4: Solo gli admin possono eliminare profili
-- (Questa politica usa una funzione per evitare ricorsione)
CREATE POLICY "Admin can delete profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ==============================================
-- 4. CREA FUNZIONE PER VERIFICARE RUOLO ADMIN
-- ==============================================

-- Funzione per verificare se l'utente corrente è admin
-- senza causare ricorsione
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 5. AGGIORNA POLITICA DI ELIMINAZIONE
-- ==============================================

-- Drop e ricrea la politica di eliminazione usando la funzione
DROP POLICY IF EXISTS "Admin can delete profiles" ON profiles;

CREATE POLICY "Admin can delete profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ==============================================
-- 6. VERIFICA LE POLITICHE
-- ==============================================

-- Mostra tutte le politiche create
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
WHERE tablename = 'profiles';

-- Verifica che RLS sia abilitato
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- ==============================================
-- 7. MESSAGGIO DI CONFERMA
-- ==============================================

SELECT 'RLS RIABILITATO CON POLITICHE SICURE!' as status;
