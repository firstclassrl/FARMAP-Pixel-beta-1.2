-- Aggiungi un listino di test per testare la funzionalità
-- Esegui questo nel SQL Editor di Supabase DOPO aver eseguito i file precedenti

-- ==============================================
-- 1. VERIFICA SE CI SONO LISTINI ESISTENTI
-- ==============================================

SELECT COUNT(*) as total_price_lists FROM public.price_lists;

-- ==============================================
-- 2. CREA UN LISTINO DI TEST
-- ==============================================

-- Inserisci un listino di test
INSERT INTO public.price_lists (
    name,
    description,
    is_default,
    is_active,
    valid_from,
    valid_until,
    currency,
    created_by
) VALUES (
    'Listino Test 2024',
    'Listino di test per verificare la funzionalità',
    false,
    true,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 year',
    'EUR',
    (SELECT id FROM auth.users LIMIT 1)
) ON CONFLICT DO NOTHING;

-- ==============================================
-- 3. ASSOCIA IL LISTINO A UN CLIENTE
-- ==============================================

-- Associa il listino al primo cliente disponibile
UPDATE public.customers 
SET price_list_id = (
    SELECT id FROM public.price_lists 
    WHERE name = 'Listino Test 2024' 
    LIMIT 1
)
WHERE id = (
    SELECT id FROM public.customers 
    WHERE is_active = true 
    LIMIT 1
);

-- ==============================================
-- 4. VERIFICA IL LISTINO CREATO
-- ==============================================

-- Mostra il listino creato
SELECT 
    pl.id,
    pl.name,
    pl.description,
    pl.is_active,
    pl.is_default,
    pl.valid_from,
    pl.valid_until,
    c.company_name as customer_name
FROM public.price_lists pl
LEFT JOIN public.customers c ON c.price_list_id = pl.id
WHERE pl.name = 'Listino Test 2024';

-- ==============================================
-- 5. VERIFICA TUTTI I LISTINI
-- ==============================================

-- Mostra tutti i listini con i clienti associati
SELECT 
    pl.id,
    pl.name,
    pl.description,
    pl.is_active,
    pl.is_default,
    pl.valid_from,
    pl.valid_until,
    c.company_name as customer_name,
    c.id as customer_id
FROM public.price_lists pl
LEFT JOIN public.customers c ON c.price_list_id = pl.id
ORDER BY pl.created_at DESC;

-- ==============================================
-- 6. MESSAGGIO DI CONFERMA
-- ==============================================

SELECT 'Listino di test creato con successo!' as status;
