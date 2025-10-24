-- Corregge il campo payment_terms nella tabella customers da INTEGER a VARCHAR
-- Questo risolve l'errore "invalid input syntax for type integer" quando si inserisce testo libero

-- Prima, crea una colonna temporanea per i nuovi valori
ALTER TABLE customers 
ADD COLUMN payment_terms_temp VARCHAR(50);

-- Copia i dati esistenti convertendo i numeri in stringhe
UPDATE customers 
SET payment_terms_temp = payment_terms::text || ' giorni'
WHERE payment_terms IS NOT NULL;

-- Aggiorna i valori NULL con un default
UPDATE customers 
SET payment_terms_temp = '30 giorni'
WHERE payment_terms_temp IS NULL;

-- Rimuovi la colonna originale
ALTER TABLE customers 
DROP COLUMN payment_terms;

-- Rinomina la colonna temporanea
ALTER TABLE customers 
RENAME COLUMN payment_terms_temp TO payment_terms;

-- Aggiungi un commento per documentare il cambio
COMMENT ON COLUMN customers.payment_terms IS 'Termini di pagamento in formato alfanumerico (es. "30 giorni", "FOB", "CIF", "Contanti")';

-- Opzionale: Aggiorna i valori NULL con un valore di default
UPDATE customers 
SET payment_terms = '30 giorni'
WHERE payment_terms IS NULL;
