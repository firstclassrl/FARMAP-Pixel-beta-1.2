-- Verifica e correggi i listini esistenti per farli apparire nel modal
-- Esegui questo nel SQL Editor di Supabase

-- ==============================================
-- 1. VERIFICA LISTINI ESISTENTI
-- ==============================================

-- Mostra tutti i listini esistenti
SELECT 
    pl.id,
    pl.name,
    pl.description,
    pl.is_active,
    pl.is_default,
    pl.valid_from,
    pl.valid_until,
    pl.created_at
FROM public.price_lists pl
ORDER BY pl.created_at DESC;

-- ==============================================
-- 2. VERIFICA CLIENTI ASSOCIATI AI LISTINI
-- ==============================================

-- Mostra i clienti e i loro listini associati
SELECT 
    c.id as customer_id,
    c.company_name,
    c.is_active as customer_active,
    c.price_list_id,
    pl.name as price_list_name,
    pl.is_active as price_list_active
FROM public.customers c
LEFT JOIN public.price_lists pl ON c.price_list_id = pl.id
ORDER BY c.company_name;

-- ==============================================
-- 3. VERIFICA PRODOTTI NEI LISTINI
-- ==============================================

-- Mostra i prodotti associati ai listini
SELECT 
    pl.id as price_list_id,
    pl.name as price_list_name,
    COUNT(pli.id) as product_count
FROM public.price_lists pl
LEFT JOIN public.price_list_items pli ON pl.id = pli.price_list_id
GROUP BY pl.id, pl.name
ORDER BY pl.name;

-- ==============================================
-- 4. CORREGGI I LISTINI ESISTENTI
-- ==============================================

-- Imposta tutti i listini come attivi
UPDATE public.price_lists 
SET is_active = true 
WHERE is_active IS NULL OR is_active = false;

-- Imposta tutti i clienti come attivi
UPDATE public.customers 
SET is_active = true 
WHERE is_active IS NULL OR is_active = false;

-- ==============================================
-- 5. ASSOCIA LISTINI AI CLIENTI (se necessario)
-- ==============================================

-- Associa il primo listino al primo cliente se non hanno associazioni
UPDATE public.customers 
SET price_list_id = (
    SELECT id FROM public.price_lists 
    WHERE is_active = true 
    ORDER BY created_at DESC 
    LIMIT 1
)
WHERE price_list_id IS NULL 
AND id = (
    SELECT id FROM public.customers 
    WHERE is_active = true 
    ORDER BY created_at DESC 
    LIMIT 1
);

-- ==============================================
-- 6. AGGIUNGI PRODOTTI DI TEST AI LISTINI (se necessario)
-- ==============================================

-- Verifica se ci sono prodotti nel database
SELECT COUNT(*) as total_products FROM public.products;

-- Se non ci sono prodotti, crea alcuni prodotti di test
INSERT INTO public.products (
    code,
    name,
    description,
    category,
    unit,
    base_price,
    is_active,
    created_by
) 
SELECT * FROM (VALUES 
    ('PROD001', 'Prodotto Test 1', 'Prodotto di test per i listini', 'Test', 'pz', 10.00, true, (SELECT id FROM auth.users LIMIT 1)),
    ('PROD002', 'Prodotto Test 2', 'Prodotto di test per i listini', 'Test', 'pz', 15.00, true, (SELECT id FROM auth.users LIMIT 1)),
    ('PROD003', 'Prodotto Test 3', 'Prodotto di test per i listini', 'Test', 'pz', 20.00, true, (SELECT id FROM auth.users LIMIT 1))
) AS new_products(code, name, description, category, unit, base_price, is_active, created_by)
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE products.code = new_products.code);

-- Aggiungi i prodotti ai listini esistenti
INSERT INTO public.price_list_items (
    price_list_id,
    product_id,
    price,
    min_quantity,
    discount_percentage
)
SELECT 
    pl.id as price_list_id,
    p.id as product_id,
    p.base_price as price,
    1 as min_quantity,
    0 as discount_percentage
FROM public.price_lists pl
CROSS JOIN public.products p
WHERE pl.is_active = true 
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM public.price_list_items pli 
    WHERE pli.price_list_id = pl.id 
    AND pli.product_id = p.id
);

-- ==============================================
-- 7. VERIFICA FINALE
-- ==============================================

-- Mostra i listini che dovrebbero apparire nel modal
SELECT 
    pl.id,
    pl.name,
    pl.is_active,
    c.company_name as customer_name,
    COUNT(pli.id) as product_count
FROM public.price_lists pl
LEFT JOIN public.customers c ON c.price_list_id = pl.id
LEFT JOIN public.price_list_items pli ON pl.id = pli.price_list_id
WHERE pl.is_active = true
GROUP BY pl.id, pl.name, pl.is_active, c.company_name
HAVING COUNT(pli.id) > 0
ORDER BY pl.name;

-- ==============================================
-- 8. MESSAGGIO DI CONFERMA
-- ==============================================

SELECT 'Listini verificati e corretti!' as status;
