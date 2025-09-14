-- Verifica e risolvi problemi con i clienti nei listini
-- Esegui questo nel SQL Editor di Supabase

-- ==============================================
-- 1. VERIFICA ESISTENZA TABELLA CUSTOMERS
-- ==============================================

-- Controlla se la tabella customers esiste
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

-- ==============================================
-- 2. VERIFICA CLIENTI ESISTENTI
-- ==============================================

-- Conta i clienti totali
SELECT COUNT(*) as total_customers FROM public.customers;

-- Conta i clienti attivi
SELECT COUNT(*) as active_customers FROM public.customers WHERE is_active = true;

-- Mostra alcuni clienti di esempio
SELECT id, company_name, contact_person, is_active, price_list_id 
FROM public.customers 
LIMIT 5;

-- ==============================================
-- 3. VERIFICA POLITICHE RLS
-- ==============================================

-- Mostra le politiche RLS per la tabella customers
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'customers';

-- ==============================================
-- 4. CREA CLIENTI DI TEST (se necessario)
-- ==============================================

-- Inserisci alcuni clienti di test se non esistono
INSERT INTO public.customers (
    company_name,
    contact_person,
    email,
    phone,
    address,
    city,
    province,
    country,
    vat_number,
    is_active,
    created_by
) VALUES 
(
    'Azienda Test 1',
    'Mario Rossi',
    'mario.rossi@aziendatest1.it',
    '+39 123 456 7890',
    'Via Roma 123',
    'Milano',
    'MI',
    'Italia',
    'IT12345678901',
    true,
    (SELECT id FROM auth.users LIMIT 1)
),
(
    'Azienda Test 2',
    'Giulia Bianchi',
    'giulia.bianchi@aziendatest2.it',
    '+39 098 765 4321',
    'Via Milano 456',
    'Roma',
    'RM',
    'Italia',
    'IT98765432109',
    true,
    (SELECT id FROM auth.users LIMIT 1)
),
(
    'Azienda Test 3',
    'Luca Verdi',
    'luca.verdi@aziendatest3.it',
    '+39 555 123 4567',
    'Via Napoli 789',
    'Napoli',
    'NA',
    'Italia',
    'IT55566677788',
    true,
    (SELECT id FROM auth.users LIMIT 1)
)
ON CONFLICT DO NOTHING;

-- ==============================================
-- 5. VERIFICA DOPO L'INSERIMENTO
-- ==============================================

-- Conta di nuovo i clienti
SELECT COUNT(*) as total_customers_after FROM public.customers;
SELECT COUNT(*) as active_customers_after FROM public.customers WHERE is_active = true;

-- Mostra tutti i clienti
SELECT id, company_name, contact_person, is_active, price_list_id 
FROM public.customers 
ORDER BY company_name;

-- ==============================================
-- 6. VERIFICA TABELLA PRICE_LISTS
-- ==============================================

-- Controlla se la tabella price_lists esiste
SELECT COUNT(*) as total_price_lists FROM public.price_lists;

-- Mostra alcuni listini
SELECT id, name, description, is_default, valid_from, valid_until 
FROM public.price_lists 
LIMIT 5;

-- ==============================================
-- 7. MESSAGGIO DI CONFERMA
-- ==============================================

SELECT 'Verifica clienti completata!' as status;
