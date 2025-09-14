-- Aggiungi clienti di test per testare i listini
-- Esegui questo nel SQL Editor di Supabase DOPO aver eseguito FIX_MISSING_COLUMNS_PRICE_LISTS.sql

-- ==============================================
-- 1. VERIFICA SE CI SONO CLIENTI ESISTENTI
-- ==============================================

SELECT COUNT(*) as total_customers FROM public.customers;

-- ==============================================
-- 2. AGGIUNGI CLIENTI DI TEST SE NECESSARIO
-- ==============================================

-- Inserisci clienti di test solo se non esistono già
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
    tax_code,
    payment_terms,
    discount_percentage,
    is_active,
    created_by
) 
SELECT * FROM (VALUES 
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
        'RSSMRA80A01F205X',
        30,
        5.00,
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
        'BNCGLL85B55H501Y',
        45,
        10.00,
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
        'VRDLCU90C15F839Z',
        60,
        15.00,
        true,
        (SELECT id FROM auth.users LIMIT 1)
    ),
    (
        'FarmaP Industry',
        'Antonio Pasetti',
        'antonio.pasetti@farmapindustry.it',
        '+39 085 123 4567',
        'Via Abruzzo 1',
        'Pescara',
        'PE',
        'Italia',
        'IT12345678901',
        'PSTNTO80A01F205X',
        30,
        0.00,
        true,
        (SELECT id FROM auth.users LIMIT 1)
    ),
    (
        'Garden Farmap',
        'Donatella',
        'grafica@farmap.it',
        '+39 085 987 6543',
        'Via Garden 2',
        'Pescara',
        'PE',
        'Italia',
        'IT98765432109',
        'GRFDNT85B55H501Y',
        30,
        5.00,
        true,
        (SELECT id FROM auth.users LIMIT 1)
    )
) AS new_customers(company_name, contact_person, email, phone, address, city, province, country, vat_number, tax_code, payment_terms, discount_percentage, is_active, created_by)
WHERE NOT EXISTS (
    SELECT 1 FROM public.customers 
    WHERE customers.company_name = new_customers.company_name
);

-- ==============================================
-- 3. VERIFICA I CLIENTI AGGIUNTI
-- ==============================================

-- Conta i clienti dopo l'inserimento
SELECT COUNT(*) as total_customers_after FROM public.customers;

-- Mostra tutti i clienti
SELECT 
    id, 
    company_name, 
    contact_person, 
    email, 
    city, 
    province, 
    is_active,
    created_at
FROM public.customers 
ORDER BY company_name;

-- ==============================================
-- 4. MESSAGGIO DI CONFERMA
-- ==============================================

SELECT 'Clienti di test aggiunti con successo!' as status;
