-- ==============================================
-- AGGIUNGI FOREIGN KEY ALLA TABELLA SAMPLE_REQUESTS
-- ==============================================

-- 1. Verifica la struttura attuale della tabella sample_requests
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'sample_requests' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verifica se la foreign key esiste già
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'sample_requests';

-- 3. Aggiungi foreign key per customer_id se non esiste
DO $$
BEGIN
    -- Controlla se la foreign key esiste già
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'sample_requests' 
        AND constraint_name LIKE '%customer%'
    ) THEN
        -- Aggiungi la foreign key
        ALTER TABLE public.sample_requests 
        ADD CONSTRAINT fk_sample_requests_customer_id 
        FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key aggiunta: sample_requests.customer_id -> customers.id';
    ELSE
        RAISE NOTICE 'Foreign key già esistente per customer_id';
    END IF;
END $$;

-- 4. Aggiungi foreign key per created_by se non esiste
DO $$
BEGIN
    -- Controlla se la foreign key esiste già
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'sample_requests' 
        AND constraint_name LIKE '%created_by%'
    ) THEN
        -- Aggiungi la foreign key
        ALTER TABLE public.sample_requests 
        ADD CONSTRAINT fk_sample_requests_created_by 
        FOREIGN KEY (created_by) REFERENCES auth.users(id);
        
        RAISE NOTICE 'Foreign key aggiunta: sample_requests.created_by -> auth.users.id';
    ELSE
        RAISE NOTICE 'Foreign key già esistente per created_by';
    END IF;
END $$;

-- 5. Aggiungi foreign key per sample_request_items se non esiste
DO $$
BEGIN
    -- Controlla se la foreign key esiste già
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'sample_request_items' 
        AND constraint_name LIKE '%sample_request%'
    ) THEN
        -- Aggiungi la foreign key
        ALTER TABLE public.sample_request_items 
        ADD CONSTRAINT fk_sample_request_items_sample_request_id 
        FOREIGN KEY (sample_request_id) REFERENCES public.sample_requests(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key aggiunta: sample_request_items.sample_request_id -> sample_requests.id';
    ELSE
        RAISE NOTICE 'Foreign key già esistente per sample_request_id';
    END IF;
END $$;

-- 6. Aggiungi foreign key per product_id se non esiste
DO $$
BEGIN
    -- Controlla se la foreign key esiste già
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'sample_request_items' 
        AND constraint_name LIKE '%product%'
    ) THEN
        -- Aggiungi la foreign key
        ALTER TABLE public.sample_request_items 
        ADD CONSTRAINT fk_sample_request_items_product_id 
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key aggiunta: sample_request_items.product_id -> products.id';
    ELSE
        RAISE NOTICE 'Foreign key già esistente per product_id';
    END IF;
END $$;

-- 7. Verifica le foreign key aggiunte
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('sample_requests', 'sample_request_items')
ORDER BY tc.table_name, tc.constraint_name;

-- ==============================================
-- MESSAGGIO DI CONFERMA
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'FOREIGN KEY AGGIUNTE CON SUCCESSO!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Foreign key aggiunte:';
    RAISE NOTICE '- sample_requests.customer_id -> customers.id';
    RAISE NOTICE '- sample_requests.created_by -> auth.users.id';
    RAISE NOTICE '- sample_request_items.sample_request_id -> sample_requests.id';
    RAISE NOTICE '- sample_request_items.product_id -> products.id';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Ora il frontend dovrebbe funzionare correttamente!';
    RAISE NOTICE '==============================================';
END $$;
