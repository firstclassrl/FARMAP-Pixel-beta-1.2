# 🚨 ISTRUZIONI URGENTI - FIX RICORSIONE RLS

## ⚡ AZIONE IMMEDIATA RICHIESTA

L'errore `infinite recursion detected in policy for relation 'profiles'` sta bloccando completamente l'applicazione. Segui questi passi **IMMEDIATAMENTE**:

## 🔥 STEP 1: FIX DATABASE (URGENTE)

**Esegui questo file SQL nel tuo database Supabase:**

```sql
-- File: URGENT_FIX_RECURSION.sql
-- Copia e incolla tutto il contenuto nel SQL Editor di Supabase
```

**Come fare:**
1. Vai al tuo progetto Supabase
2. Apri "SQL Editor"
3. Copia tutto il contenuto di `URGENT_FIX_RECURSION.sql`
4. Incollalo e clicca "Run"

## 🚀 STEP 2: DEPLOY FUNCTIONS

**Esegui questo comando nel terminale:**

```bash
./deploy_functions.sh
```

**Oppure manualmente:**
```bash
npx supabase functions deploy get-users
npx supabase functions deploy update-user
npx supabase functions deploy create-user
npx supabase functions deploy delete-user
```

## 🔄 STEP 3: RIAVVIA L'APP

```bash
# Ferma il server (Ctrl+C)
# Poi riavvia:
npm run dev
```

## ✅ VERIFICA

Dopo aver completato tutti i passi:

1. **Vai a** `localhost:5174/user-management`
2. **Verifica che** non ci siano più errori di ricorsione
3. **Testa** la creazione di un nuovo utente
4. **Controlla** che la lista utenti sia visibile

## 🆘 SE IL PROBLEMA PERSISTE

### Opzione A: Disabilita completamente RLS
```sql
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

### Opzione B: Reset completo delle politiche
```sql
-- Nel SQL Editor di Supabase
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public read access for lettore" ON profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Public read access" ON profiles;

-- Poi riabilita con politiche semplici
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated users to read profiles"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow users to update own profile"
  ON profiles FOR UPDATE TO authenticated 
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to insert own profile"
  ON profiles FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = id);
```

## 🎯 RISULTATO ATTESO

Dopo aver applicato il fix:
- ✅ **Nessun errore di ricorsione**
- ✅ **Pagina Gestione Utenti funzionante**
- ✅ **Admin può gestire utenti**
- ✅ **App stabile e funzionante**

## 📞 SUPPORTO

Se hai problemi con questi passi, il problema principale è nelle politiche RLS che creano ricorsione. La soluzione più semplice è disabilitare temporaneamente RLS sulla tabella profiles fino a quando non possiamo implementare una soluzione più robusta.

**PRIORITÀ: Applica il fix del database PRIMA di tutto il resto!**
