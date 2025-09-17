-- Aggiunta nuovi campi alla tabella products
-- Eseguire questo script nel database Supabase

-- Aggiungere nuovi campi
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS cartone TEXT,
ADD COLUMN IF NOT EXISTS pallet TEXT,
ADD COLUMN IF NOT EXISTS strati INTEGER,
ADD COLUMN IF NOT EXISTS scadenza TEXT,
ADD COLUMN IF NOT EXISTS iva DECIMAL(5,2) DEFAULT 22.00,
ADD COLUMN IF NOT EXISTS ean TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Rendere il campo peso opzionale (rimuovere NOT NULL se presente)
ALTER TABLE public.products 
ALTER COLUMN weight DROP NOT NULL;

-- Aggiungere commenti per documentare i nuovi campi
COMMENT ON COLUMN public.products.cartone IS 'Tipo di cartone/imballaggio del prodotto';
COMMENT ON COLUMN public.products.pallet IS 'Informazioni sul pallet';
COMMENT ON COLUMN public.products.strati IS 'Numero di strati nel pallet';
COMMENT ON COLUMN public.products.scadenza IS 'Durata di scadenza del prodotto (es. 3 anni, 2 anni)';
COMMENT ON COLUMN public.products.iva IS 'Percentuale IVA (default 22%)';
COMMENT ON COLUMN public.products.ean IS 'Codice EAN del prodotto';
COMMENT ON COLUMN public.products.photo_url IS 'URL della foto del prodotto (base64 data URL)';
COMMENT ON COLUMN public.products.weight IS 'Peso del prodotto (ora opzionale)';

-- Verificare la struttura aggiornata
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;
