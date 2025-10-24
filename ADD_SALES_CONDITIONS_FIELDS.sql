-- Aggiunge i campi per le condizioni di vendita alla tabella price_lists
-- Questi campi permetteranno di specificare pagamento, trasporto, tempi di consegna e marchio

-- Aggiungi i nuovi campi alla tabella price_lists
ALTER TABLE price_lists 
ADD COLUMN payment_conditions VARCHAR(255),
ADD COLUMN shipping_conditions VARCHAR(255),
ADD COLUMN delivery_conditions VARCHAR(255),
ADD COLUMN brand_conditions VARCHAR(255);

-- Aggiungi commenti per documentare i nuovi campi
COMMENT ON COLUMN price_lists.payment_conditions IS 'Condizioni di pagamento (es. "30 giorni", "Bonifico anticipato", "FOB")';
COMMENT ON COLUMN price_lists.shipping_conditions IS 'Condizioni di trasporto (es. "Franco fabbrica", "Porto franco", "FOB")';
COMMENT ON COLUMN price_lists.delivery_conditions IS 'Tempi di consegna (es. "15 giorni", "Su richiesta", "Immediato")';
COMMENT ON COLUMN price_lists.brand_conditions IS 'Marchio e condizioni commerciali (es. "Marchio cliente", "Marchio proprio", "White label")';

-- Imposta valori di default per i campi esistenti (opzionale)
UPDATE price_lists 
SET payment_conditions = '30 giorni',
    shipping_conditions = 'Franco fabbrica',
    delivery_conditions = 'Su richiesta',
    brand_conditions = 'Marchio proprio'
WHERE payment_conditions IS NULL;
