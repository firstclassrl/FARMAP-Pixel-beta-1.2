-- Aggiunge il campo codice_cliente alla tabella customers
-- Questo campo sarà univoco e servirà come identificativo alternativo del cliente

-- Aggiungi la colonna codice_cliente
ALTER TABLE customers 
ADD COLUMN codice_cliente VARCHAR(20) UNIQUE;

-- Aggiungi un indice per migliorare le performance delle ricerche
CREATE INDEX idx_customers_codice_cliente ON customers(codice_cliente);

-- Aggiungi un commento per documentare il campo
COMMENT ON COLUMN customers.codice_cliente IS 'Codice univoco del cliente (es. CLI001, CLI002, etc.)';

-- Opzionale: Aggiorna i clienti esistenti con un codice automatico
-- (Decommentare se si vogliono generare codici per i clienti esistenti)
/*
UPDATE customers 
SET codice_cliente = 'CLI' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 3, '0')
WHERE codice_cliente IS NULL;
*/

