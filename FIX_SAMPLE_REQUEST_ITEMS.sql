-- Script per verificare e aggiungere la colonna product_name alla tabella sample_request_items
-- Questo script risolve l'errore: "Could not find the 'product_name' column of 'sample_request_items' in the schema cache"

-- Prima verifica la struttura attuale della tabella
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'sample_request_items' 
ORDER BY ordinal_position;

-- Verifica se la colonna product_name esiste già
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'sample_request_items' 
    AND column_name = 'product_name'
) AS product_name_exists;

-- Aggiungi la colonna product_name solo se non esiste
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sample_request_items' 
        AND column_name = 'product_name'
    ) THEN
        ALTER TABLE sample_request_items 
        ADD COLUMN product_name VARCHAR(255);
        
        RAISE NOTICE 'Colonna product_name aggiunta con successo';
    ELSE
        RAISE NOTICE 'Colonna product_name esiste già';
    END IF;
END $$;

-- Verifica finale della struttura della tabella
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'sample_request_items' 
ORDER BY ordinal_position;

-- Commento sulla colonna
COMMENT ON COLUMN sample_request_items.product_name IS 'Nome del prodotto richiesto (inserito manualmente)';
