-- Modifica il campo payment_terms da numerico a alfanumerico
-- Questo permetterà di inserire termini di pagamento come "30 giorni", "FOB", "CIF", etc.

-- Prima, aggiorna i dati esistenti convertendo i numeri in stringhe
UPDATE customers 
SET payment_terms = payment_terms::text || ' giorni'
WHERE payment_terms IS NOT NULL 
AND payment_terms::text ~ '^[0-9]+$';

-- Modifica il tipo di colonna da INTEGER a VARCHAR
ALTER TABLE customers 
ALTER COLUMN payment_terms TYPE VARCHAR(50);

-- Aggiungi un commento per documentare il cambio
COMMENT ON COLUMN customers.payment_terms IS 'Termini di pagamento in formato alfanumerico (es. "30 giorni", "FOB", "CIF", "Contanti")';

-- Opzionale: Aggiorna i valori NULL con un valore di default
UPDATE customers 
SET payment_terms = '30 giorni'
WHERE payment_terms IS NULL;

