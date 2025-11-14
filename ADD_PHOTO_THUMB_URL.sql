-- Aggiunge il campo photo_thumb_url alla tabella products
-- Esegui questo script nel database Supabase per abilitare i thumbnail

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS photo_thumb_url TEXT;

COMMENT ON COLUMN public.products.photo_thumb_url IS 'URL pubblico della miniatura della foto prodotto (thumbnail 200x200px)';

-- Verifica che il campo sia stato aggiunto
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'photo_thumb_url'
AND table_schema = 'public';
