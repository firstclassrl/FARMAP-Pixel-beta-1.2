-- ==============================================
-- CREA SOLO LA TABELLA SAMPLE_REQUESTS
-- ==============================================

-- 1. Verifica se la tabella sample_requests esiste già
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'sample_requests' AND schemaname = 'public') 
        THEN 'TABELLA SAMPLE_REQUESTS ESISTE GIÀ' 
        ELSE 'TABELLA SAMPLE_REQUESTS NON ESISTE - VERRA CREATA' 
    END as sample_requests_status;

-- 2. Verifica la struttura della tabella customers
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Crea tabella sample_requests SENZA foreign key
CREATE TABLE IF NOT EXISTS public.sample_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid,  -- Senza foreign key per ora
    request_date date NOT NULL DEFAULT CURRENT_DATE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'cancelled')),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid
);

-- 4. Crea tabella sample_request_items SENZA foreign key
CREATE TABLE IF NOT EXISTS public.sample_request_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sample_request_id uuid,  -- Senza foreign key per ora
    product_id uuid,  -- Senza foreign key per ora
    quantity integer NOT NULL DEFAULT 1,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 5. Aggiungi indici per performance
CREATE INDEX IF NOT EXISTS idx_sample_requests_customer_id ON public.sample_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_sample_requests_status ON public.sample_requests(status);
CREATE INDEX IF NOT EXISTS idx_sample_requests_created_at ON public.sample_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_sample_request_items_sample_request_id ON public.sample_request_items(sample_request_id);
CREATE INDEX IF NOT EXISTS idx_sample_request_items_product_id ON public.sample_request_items(product_id);

-- 6. Aggiungi trigger per updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per sample_requests
DROP TRIGGER IF EXISTS update_sample_requests_updated_at ON public.sample_requests;
CREATE TRIGGER update_sample_requests_updated_at
    BEFORE UPDATE ON public.sample_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger per sample_request_items
DROP TRIGGER IF EXISTS update_sample_request_items_updated_at ON public.sample_request_items;
CREATE TRIGGER update_sample_request_items_updated_at
    BEFORE UPDATE ON public.sample_request_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Verifica le tabelle create
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('sample_requests', 'sample_request_items')
ORDER BY tablename;

-- 8. Conta i record nelle tabelle (dovrebbero essere 0)
SELECT 'sample_requests' as table_name, COUNT(*) as record_count FROM public.sample_requests
UNION ALL
SELECT 'sample_request_items' as table_name, COUNT(*) as record_count FROM public.sample_request_items;

-- ==============================================
-- MESSAGGIO DI CONFERMA
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'TABELLE SAMPLE_REQUESTS CREATE CON SUCCESSO!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Tabelle create:';
    RAISE NOTICE '- sample_requests (senza foreign key)';
    RAISE NOTICE '- sample_request_items (senza foreign key)';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Ora la campionatura dovrebbe funzionare!';
    RAISE NOTICE 'Le foreign key verranno aggiunte dopo aver verificato la struttura.';
    RAISE NOTICE '==============================================';
END $$;
