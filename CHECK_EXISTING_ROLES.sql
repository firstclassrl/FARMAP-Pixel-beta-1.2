-- Controlla i ruoli esistenti nel database
-- Esegui questo nel SQL Editor di Supabase

-- ==============================================
-- 1. VERIFICA I RUOLI DISPONIBILI
-- ==============================================

-- Mostra tutti i valori dell'enum user_role
SELECT unnest(enum_range(NULL::user_role)) as available_roles;

-- ==============================================
-- 2. VERIFICA I RUOLI USATI NEI PROFILI
-- ==============================================

-- Mostra i ruoli effettivamente usati nella tabella profiles
SELECT DISTINCT role, COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY role;

-- ==============================================
-- 3. INFORMAZIONI SULL'ENUM
-- ==============================================

-- Mostra informazioni dettagliate sull'enum
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- ==============================================
-- 4. MESSAGGIO DI CONFERMA
-- ==============================================

SELECT 'Controllo ruoli completato!' as status;
