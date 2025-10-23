-- Script semplificato per creare le tabelle price_lists
-- Eseguire questo script in Supabase SQL Editor

-- 1. Crea la tabella price_lists
CREATE TABLE IF NOT EXISTS public.price_lists (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    is_default boolean DEFAULT false,
    valid_from date DEFAULT CURRENT_DATE,
    valid_until date,
    currency text DEFAULT 'EUR',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- 2. Crea la tabella price_list_items
CREATE TABLE IF NOT EXISTS public.price_list_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    price_list_id uuid REFERENCES public.price_lists(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    price numeric(10,2) NOT NULL,
    discount_percentage numeric(5,2) DEFAULT 0,
    min_quantity integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE (price_list_id, product_id)
);

-- 3. Abilita RLS
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_list_items ENABLE ROW LEVEL SECURITY;

-- 4. Crea policy per price_lists
DROP POLICY IF EXISTS "price_lists_policy" ON public.price_lists;
CREATE POLICY "price_lists_policy" ON public.price_lists
    FOR ALL USING (true)
    WITH CHECK (true);

-- 5. Crea policy per price_list_items
DROP POLICY IF EXISTS "price_list_items_policy" ON public.price_list_items;
CREATE POLICY "price_list_items_policy" ON public.price_list_items
    FOR ALL USING (true)
    WITH CHECK (true);

-- 6. Verifica creazione
SELECT 'price_lists created' as status, COUNT(*) as count FROM public.price_lists
UNION ALL
SELECT 'price_list_items created' as status, COUNT(*) as count FROM public.price_list_items;
