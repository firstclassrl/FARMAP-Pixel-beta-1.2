-- Aggiungi più ruoli utili per il sistema CRM
-- Esegui questo nel SQL Editor di Supabase

-- ==============================================
-- 1. AGGIUNGI NUOVI RUOLI ALL'ENUM
-- ==============================================

-- Aggiungi nuovi ruoli all'enum user_role esistente
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'magazziniere';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'contabile';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'responsabile_vendite';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'tecnico';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'supervisore';

-- ==============================================
-- 2. VERIFICA I RUOLI DISPONIBILI
-- ==============================================

-- Mostra tutti i valori dell'enum user_role
SELECT unnest(enum_range(NULL::user_role)) as available_roles;

-- ==============================================
-- 3. AGGIORNA I TIPI TYPESCRIPT (OPZIONALE)
-- ==============================================

-- Nota: Dovrai aggiornare manualmente il file database.types.ts
-- con i nuovi ruoli: 'admin' | 'commerciale' | 'lettore' | 'label_user' | 'magazziniere' | 'contabile' | 'responsabile_vendite' | 'tecnico' | 'supervisore'

-- ==============================================
-- 4. MESSAGGIO DI CONFERMA
-- ==============================================

SELECT 'Ruoli aggiunti con successo!' as status;
SELECT 'Ruoli disponibili:' as info, unnest(enum_range(NULL::user_role)) as roles;
