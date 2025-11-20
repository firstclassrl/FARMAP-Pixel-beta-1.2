-- Aggiunge il campo photo_url alla tabella sample_requests
-- Esegui questo script nel database Supabase per abilitare le foto dei campioni inviati

ALTER TABLE public.sample_requests
ADD COLUMN IF NOT EXISTS photo_url TEXT;

COMMENT ON COLUMN public.sample_requests.photo_url IS 'URL pubblico della foto dei campioni inviati';

-- Verifica che il campo sia stato aggiunto
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sample_requests' 
AND column_name = 'photo_url'
AND table_schema = 'public';

