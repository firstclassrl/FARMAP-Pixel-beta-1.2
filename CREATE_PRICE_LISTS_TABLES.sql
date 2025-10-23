-- Script per creare le tabelle price_lists e price_list_items
-- Eseguire questo script in Supabase SQL Editor

-- Abilita l'estensione uuid se non già abilitata
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabella price_lists
CREATE TABLE IF NOT EXISTS public.price_lists (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    description text,
    is_default boolean DEFAULT false NOT NULL,
    valid_from date DEFAULT CURRENT_DATE NOT NULL,
    valid_until date,
    currency text DEFAULT 'EUR'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id)
);

-- Abilita RLS per price_lists
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;

-- Policy per price_lists - solo admin e commerciale possono gestire
CREATE POLICY "Admin and Commerciale can manage price_lists" ON public.price_lists
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'commerciale')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'commerciale')
        )
    );

-- Policy per lettura - tutti possono leggere
CREATE POLICY "Everyone can read price_lists" ON public.price_lists 
    FOR SELECT USING (true);

-- Tabella price_list_items
CREATE TABLE IF NOT EXISTS public.price_list_items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    price_list_id uuid REFERENCES public.price_lists(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    price numeric(10,2) NOT NULL,
    discount_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    min_quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (price_list_id, product_id)
);

-- Abilita RLS per price_list_items
ALTER TABLE public.price_list_items ENABLE ROW LEVEL SECURITY;

-- Policy per price_list_items - solo admin e commerciale possono gestire
CREATE POLICY "Admin and Commerciale can manage price_list_items" ON public.price_list_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'commerciale')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'commerciale')
        )
    );

-- Policy per lettura - tutti possono leggere
CREATE POLICY "Everyone can read price_list_items" ON public.price_list_items 
    FOR SELECT USING (true);

-- Trigger per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Applica il trigger alle tabelle
CREATE TRIGGER update_price_lists_updated_at 
    BEFORE UPDATE ON public.price_lists 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_list_items_updated_at 
    BEFORE UPDATE ON public.price_list_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Aggiungi colonna is_active alla tabella price_lists se non esiste
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'price_lists' 
        AND column_name = 'is_active'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.price_lists ADD COLUMN is_active boolean DEFAULT true NOT NULL;
    END IF;
END $$;

-- Crea indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_price_lists_created_by ON public.price_lists(created_by);
CREATE INDEX IF NOT EXISTS idx_price_lists_valid_from ON public.price_lists(valid_from);
CREATE INDEX IF NOT EXISTS idx_price_lists_valid_until ON public.price_lists(valid_until);
CREATE INDEX IF NOT EXISTS idx_price_lists_is_active ON public.price_lists(is_active);

CREATE INDEX IF NOT EXISTS idx_price_list_items_price_list_id ON public.price_list_items(price_list_id);
CREATE INDEX IF NOT EXISTS idx_price_list_items_product_id ON public.price_list_items(product_id);

-- Verifica che le tabelle siano state create correttamente
SELECT 
    'price_lists' as table_name,
    COUNT(*) as row_count
FROM public.price_lists
UNION ALL
SELECT 
    'price_list_items' as table_name,
    COUNT(*) as row_count
FROM public.price_list_items;
