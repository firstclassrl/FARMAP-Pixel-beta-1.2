-- Aggiungi le colonne mancanti alla tabella profiles
-- Esegui questo nel SQL Editor di Supabase

-- 1. Aggiungi colonna created_at se non esiste
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
        RAISE NOTICE 'Colonna created_at aggiunta';
    ELSE
        RAISE NOTICE 'Colonna created_at già esistente';
    END IF;
END $$;

-- 2. Aggiungi colonna updated_at se non esiste
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;
        RAISE NOTICE 'Colonna updated_at aggiunta';
    ELSE
        RAISE NOTICE 'Colonna updated_at già esistente';
    END IF;
END $$;

-- 3. Verifica la struttura della tabella
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 4. Messaggio di conferma
SELECT 'Colonne aggiunte con successo!' as status;
