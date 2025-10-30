-- Opzionale: aggiunge una colonna per la miniatura della foto del prodotto
-- Esegui in Supabase SQL editor se vuoi salvare anche l'URL della thumbnail

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS photo_thumb_url TEXT;

COMMENT ON COLUMN public.products.photo_thumb_url IS 'URL pubblico della miniatura della foto prodotto';


