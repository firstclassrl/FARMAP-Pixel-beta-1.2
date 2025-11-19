-- Aggiunge il flag per stampare/nascondere le condizioni nel listino
ALTER TABLE public.price_lists
ADD COLUMN IF NOT EXISTS print_conditions boolean DEFAULT true NOT NULL;

COMMENT ON COLUMN public.price_lists.print_conditions IS 'Se true, stampa le condizioni di vendita nel PDF/anteprima';




