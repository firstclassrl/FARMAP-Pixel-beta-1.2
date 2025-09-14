-- Fix per le colonne mancanti nelle tabelle customers e price_lists
-- Esegui questo nel SQL Editor di Supabase

-- ==============================================
-- 1. AGGIUNGI COLONNA is_active ALLA TABELLA CUSTOMERS
-- ==============================================

-- Aggiungi colonna is_active se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customers' AND column_name = 'is_active') THEN
        ALTER TABLE public.customers ADD COLUMN is_active boolean DEFAULT true NOT NULL;
        RAISE NOTICE 'Colonna is_active aggiunta alla tabella customers';
    ELSE
        RAISE NOTICE 'Colonna is_active già esistente nella tabella customers';
    END IF;
END $$;

-- ==============================================
-- 2. AGGIUNGI COLONNA is_default ALLA TABELLA PRICE_LISTS
-- ==============================================

-- Aggiungi colonna is_default se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'price_lists' AND column_name = 'is_default') THEN
        ALTER TABLE public.price_lists ADD COLUMN is_default boolean DEFAULT false NOT NULL;
        RAISE NOTICE 'Colonna is_default aggiunta alla tabella price_lists';
    ELSE
        RAISE NOTICE 'Colonna is_default già esistente nella tabella price_lists';
    END IF;
END $$;

-- ==============================================
-- 3. AGGIUNGI ALTRE COLONNE MANCANTI SE NECESSARIO
-- ==============================================

-- Aggiungi colonna is_active alla tabella price_lists se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'price_lists' AND column_name = 'is_active') THEN
        ALTER TABLE public.price_lists ADD COLUMN is_active boolean DEFAULT true NOT NULL;
        RAISE NOTICE 'Colonna is_active aggiunta alla tabella price_lists';
    ELSE
        RAISE NOTICE 'Colonna is_active già esistente nella tabella price_lists';
    END IF;
END $$;

-- Aggiungi colonna price_list_id alla tabella customers se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customers' AND column_name = 'price_list_id') THEN
        ALTER TABLE public.customers ADD COLUMN price_list_id uuid;
        RAISE NOTICE 'Colonna price_list_id aggiunta alla tabella customers';
    ELSE
        RAISE NOTICE 'Colonna price_list_id già esistente nella tabella customers';
    END IF;
END $$;

-- Aggiungi colonna created_by alla tabella customers se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customers' AND column_name = 'created_by') THEN
        ALTER TABLE public.customers ADD COLUMN created_by uuid REFERENCES auth.users(id);
        RAISE NOTICE 'Colonna created_by aggiunta alla tabella customers';
    ELSE
        RAISE NOTICE 'Colonna created_by già esistente nella tabella customers';
    END IF;
END $$;

-- Aggiungi colonna created_by alla tabella price_lists se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'price_lists' AND column_name = 'created_by') THEN
        ALTER TABLE public.price_lists ADD COLUMN created_by uuid REFERENCES auth.users(id);
        RAISE NOTICE 'Colonna created_by aggiunta alla tabella price_lists';
    ELSE
        RAISE NOTICE 'Colonna created_by già esistente nella tabella price_lists';
    END IF;
END $$;

-- Aggiungi colonna is_active alla tabella products se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = 'is_active') THEN
        ALTER TABLE public.products ADD COLUMN is_active boolean DEFAULT true NOT NULL;
        RAISE NOTICE 'Colonna is_active aggiunta alla tabella products';
    ELSE
        RAISE NOTICE 'Colonna is_active già esistente nella tabella products';
    END IF;
END $$;

-- Aggiungi colonna created_by alla tabella products se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = 'created_by') THEN
        ALTER TABLE public.products ADD COLUMN created_by uuid REFERENCES auth.users(id);
        RAISE NOTICE 'Colonna created_by aggiunta alla tabella products';
    ELSE
        RAISE NOTICE 'Colonna created_by già esistente nella tabella products';
    END IF;
END $$;

-- ==============================================
-- 4. VERIFICA LE COLONNE AGGIUNTE
-- ==============================================

-- Mostra la struttura della tabella customers
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

-- Mostra la struttura della tabella price_lists
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'price_lists' 
ORDER BY ordinal_position;

-- Mostra la struttura della tabella products
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- ==============================================
-- 5. AGGIORNA I DATI ESISTENTI
-- ==============================================

-- Imposta tutti i clienti esistenti come attivi
UPDATE public.customers SET is_active = true WHERE is_active IS NULL;

-- Imposta tutti i listini esistenti come attivi e non di default
UPDATE public.price_lists SET is_active = true WHERE is_active IS NULL;
UPDATE public.price_lists SET is_default = false WHERE is_default IS NULL;

-- Imposta tutti i prodotti esistenti come attivi
UPDATE public.products SET is_active = true WHERE is_active IS NULL;

-- Imposta created_by per i clienti esistenti se mancante
UPDATE public.customers 
SET created_by = (SELECT id FROM auth.users LIMIT 1) 
WHERE created_by IS NULL;

-- Imposta created_by per i listini esistenti se mancante
UPDATE public.price_lists 
SET created_by = (SELECT id FROM auth.users LIMIT 1) 
WHERE created_by IS NULL;

-- Imposta created_by per i prodotti esistenti se mancante
UPDATE public.products 
SET created_by = (SELECT id FROM auth.users LIMIT 1) 
WHERE created_by IS NULL;

-- ==============================================
-- 6. MESSAGGIO DI CONFERMA
-- ==============================================

SELECT 'Colonne mancanti aggiunte con successo!' as status;
