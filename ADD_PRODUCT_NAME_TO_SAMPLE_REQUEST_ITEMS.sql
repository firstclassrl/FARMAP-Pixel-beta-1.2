-- Script per aggiungere la colonna product_name alla tabella sample_request_items
-- Questo script risolve l'errore: "Could not find the 'product_name' column of 'sample_request_items' in the schema cache"

-- Aggiungi la colonna product_name
ALTER TABLE sample_request_items 
ADD COLUMN product_name VARCHAR(255);

-- Commento sulla colonna
COMMENT ON COLUMN sample_request_items.product_name IS 'Nome del prodotto richiesto (inserito manualmente)';

-- Verifica che la colonna sia stata aggiunta
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sample_request_items' 
AND column_name = 'product_name';
