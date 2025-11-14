-- ============================================================================
-- Script SQL per Import CSV Clienti - Aggiornamento codice_cliente e code_prefix
-- ============================================================================
-- Questo script aggiorna i campi codice_cliente e code_prefix nella tabella
-- customers basandosi su un file CSV con 3 colonne:
--   - codice_cliente
--   - company_name  
--   - code_prefix
--
-- Requisiti:
--   - Match case-insensitive su company_name
--   - Aggiorna solo record esistenti (ignora record senza match)
--   - In caso di duplicati nel CSV, usa il primo valore trovato
-- ============================================================================

-- STEP 1: Creazione tabella per i dati CSV in public schema
-- ============================================================================
DROP TABLE IF EXISTS public.temp_csv_customers;

CREATE TABLE public.temp_csv_customers (
    codice_cliente VARCHAR(20),
    company_name TEXT NOT NULL,
    code_prefix VARCHAR(10)  -- Aumentato per gestire spazi extra durante import
);

-- STEP 2: Importazione dati CSV nella tabella
-- ============================================================================
-- METODO 1: Usando COPY con dati CSV inline (consigliato per Supabase)
-- 
-- ISTRUZIONI:
-- 1. Copia il contenuto completo del tuo file CSV (INCLUDE anche l'header)
-- 2. Incolla il contenuto tra i comandi COPY e \.
-- 3. Il formato CSV deve essere: codice_cliente,company_name,code_prefix
--
-- ESEMPIO FORMATO CSV:
-- codice_cliente,company_name,code_prefix
-- 1,UEBER SRL,UE
-- 2,HORTUSI' SRL,HO
-- 3,VEBI ISTITUTO BIOCHIMICO SRL,VE

COPY public.temp_csv_customers (codice_cliente, company_name, code_prefix)
FROM STDIN
WITH (
    FORMAT csv,
    HEADER true,
    DELIMITER ',',
    QUOTE '"',
    ESCAPE '"'
);

-- INCOLLA QUI IL TUO FILE CSV COMPLETO (con header incluso)
-- codice_cliente,company_name,code_prefix
-- (i tuoi dati CSV qui)
\.

-- ============================================================================
-- METODO 2 ALTERNATIVO: Se COPY non funziona, usa questa funzione
-- ============================================================================
-- Scommenta e usa questo metodo se il metodo COPY dà problemi
/*
-- Crea funzione helper per importare CSV da stringa
CREATE OR REPLACE FUNCTION public.import_csv_to_temp_table(csv_data TEXT)
RETURNS void AS $$
DECLARE
    lines TEXT[];
    line TEXT;
    parts TEXT[];
    cod_cliente TEXT;
    comp_name TEXT;
    cod_prefix TEXT;
    i INT;
BEGIN
    -- Dividi in righe
    lines := string_to_array(csv_data, E'\n');
    
    -- Processa ogni riga (salta la prima se è header)
    FOR i IN 2..array_length(lines, 1)
    LOOP
        line := lines[i];
        
        -- Salta righe vuote
        IF TRIM(line) = '' THEN
            CONTINUE;
        END IF;
        
        -- Dividi per virgola (gestendo le virgolette)
        parts := string_to_array(line, ',');
        
        IF array_length(parts, 1) >= 3 THEN
            -- Estrai i valori (rimuovi spazi e virgolette)
            cod_cliente := TRIM(BOTH '"' FROM parts[1]);
            comp_name := TRIM(BOTH '"' FROM parts[2]);
            cod_prefix := TRIM(BOTH '"' FROM parts[3]);
            
            -- Inserisci nella tabella
            INSERT INTO public.temp_csv_customers (codice_cliente, company_name, code_prefix)
            VALUES (
                NULLIF(TRIM(cod_cliente), ''),
                TRIM(comp_name),
                NULLIF(TRIM(cod_prefix), '')
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Usa la funzione con i tuoi dati CSV (sostituisci i dati dell'esempio)
SELECT public.import_csv_to_temp_table('
codice_cliente,company_name,code_prefix
1,UEBER SRL,UE
2,HORTUSI'' SRL,HO
3,VEBI ISTITUTO BIOCHIMICO SRL,VE
');
*/

-- STEP 3: Pulizia e normalizzazione dati CSV
-- ============================================================================
-- Rimuovi spazi bianchi e gestisci duplicati (mantiene solo il primo record)
DROP TABLE IF EXISTS public.temp_csv_customers_clean;

CREATE TABLE public.temp_csv_customers_clean AS
SELECT DISTINCT ON (LOWER(TRIM(company_name)))
    NULLIF(TRIM(codice_cliente), '')::VARCHAR(20) AS codice_cliente,
    TRIM(company_name) AS company_name,
    -- Normalizza code_prefix: rimuovi spazi e tronca a 2 caratteri
    NULLIF(LEFT(TRIM(REPLACE(code_prefix, ' ', '')), 2), '')::VARCHAR(2) AS code_prefix
FROM public.temp_csv_customers
WHERE TRIM(company_name) != ''
ORDER BY LOWER(TRIM(company_name)), ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(company_name)) ORDER BY (SELECT 1));

-- STEP 4: Verifica dati caricati
-- ============================================================================
SELECT 
    'Record caricati dal CSV' AS descrizione,
    COUNT(*) AS totale
FROM public.temp_csv_customers_clean;

SELECT 
    'Esempi di dati caricati' AS descrizione,
    codice_cliente,
    company_name,
    code_prefix
FROM public.temp_csv_customers_clean
LIMIT 10;

-- STEP 5: Verifica match con customers esistenti
-- ============================================================================
SELECT 
    'Record che troveranno match' AS descrizione,
    COUNT(*) AS totale
FROM public.temp_csv_customers_clean tcc
WHERE EXISTS (
    SELECT 1 
    FROM public.customers c 
    WHERE LOWER(TRIM(c.company_name)) = LOWER(tcc.company_name)
);

SELECT 
    'Record che NON troveranno match' AS descrizione,
    COUNT(*) AS totale
FROM public.temp_csv_customers_clean tcc
WHERE NOT EXISTS (
    SELECT 1 
    FROM public.customers c 
    WHERE LOWER(TRIM(c.company_name)) = LOWER(tcc.company_name)
);

-- Mostra i company_name che non troveranno match
SELECT 
    tcc.company_name,
    tcc.codice_cliente,
    tcc.code_prefix
FROM public.temp_csv_customers_clean tcc
WHERE NOT EXISTS (
    SELECT 1 
    FROM public.customers c 
    WHERE LOWER(TRIM(c.company_name)) = LOWER(tcc.company_name)
)
ORDER BY tcc.company_name;

-- STEP 6: AGGIORNAMENTO customers (match case-insensitive)
-- ============================================================================
-- IMPORTANTE: Questo UPDATE aggiorna solo i record che trovano un match
-- I record del CSV senza match vengono ignorati

UPDATE public.customers c
SET 
    codice_cliente = tcc.codice_cliente,
    code_prefix = tcc.code_prefix,
    updated_at = NOW()
FROM public.temp_csv_customers_clean tcc
WHERE LOWER(TRIM(c.company_name)) = LOWER(tcc.company_name)
  AND (
    -- Aggiorna solo se i valori sono diversi
    COALESCE(c.codice_cliente, '') != COALESCE(tcc.codice_cliente, '') OR
    COALESCE(c.code_prefix, '') != COALESCE(tcc.code_prefix, '')
  );

-- STEP 7: Verifica risultati aggiornamento
-- ============================================================================
SELECT 
    'Record aggiornati' AS descrizione,
    COUNT(*) AS totale
FROM public.customers c
INNER JOIN public.temp_csv_customers_clean tcc 
    ON LOWER(TRIM(c.company_name)) = LOWER(tcc.company_name)
WHERE (
    COALESCE(c.codice_cliente, '') = COALESCE(tcc.codice_cliente, '') AND
    COALESCE(c.code_prefix, '') = COALESCE(tcc.code_prefix, '')
);

-- Mostra alcuni esempi di record aggiornati
SELECT 
    c.id,
    c.company_name,
    c.codice_cliente AS codice_cliente_attuale,
    c.code_prefix AS code_prefix_attuale,
    tcc.codice_cliente AS codice_cliente_csv,
    tcc.code_prefix AS code_prefix_csv
FROM public.customers c
INNER JOIN public.temp_csv_customers_clean tcc 
    ON LOWER(TRIM(c.company_name)) = LOWER(tcc.company_name)
ORDER BY c.company_name
LIMIT 20;

-- STEP 8: Pulizia tabella (opzionale - commenta se vuoi mantenere i dati per verifica)
-- ============================================================================
-- DROP TABLE IF EXISTS public.temp_csv_customers;
-- DROP TABLE IF EXISTS public.temp_csv_customers_clean;

-- ============================================================================
-- FINE SCRIPT
-- ============================================================================
-- Note finali:
-- - I record aggiornati hanno anche updated_at modificato
-- - I record senza match nel CSV sono stati ignorati come richiesto
-- - I duplicati nel CSV sono stati gestiti prendendo il primo valore
-- ============================================================================

