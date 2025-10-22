-- Creazione tabella appointments per il calendario vendite
-- Eseguire questo script in Supabase SQL Editor

-- Crea la tabella appointments
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT,
    type TEXT NOT NULL CHECK (type IN ('appointment', 'call', 'reminder')),
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')) DEFAULT 'scheduled',
    location TEXT,
    notes TEXT,
    reminder_minutes INTEGER DEFAULT 30,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crea indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_appointments_start_date ON public.appointments(start_date);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_created_by ON public.appointments(created_by);
CREATE INDEX IF NOT EXISTS idx_appointments_type ON public.appointments(type);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- Abilita RLS (Row Level Security)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Crea policy per permettere agli utenti di vedere solo i propri appuntamenti
-- e agli admin di vedere tutti gli appuntamenti
CREATE POLICY "Users can view their own appointments" ON public.appointments
    FOR SELECT USING (
        created_by = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Crea policy per permettere agli utenti di inserire i propri appuntamenti
CREATE POLICY "Users can insert their own appointments" ON public.appointments
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Crea policy per permettere agli utenti di aggiornare i propri appuntamenti
CREATE POLICY "Users can update their own appointments" ON public.appointments
    FOR UPDATE USING (
        created_by = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Crea policy per permettere agli utenti di eliminare i propri appuntamenti
CREATE POLICY "Users can delete their own appointments" ON public.appointments
    FOR DELETE USING (
        created_by = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Crea trigger per aggiornare automaticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON public.appointments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Commenti per documentare la tabella
COMMENT ON TABLE public.appointments IS 'Tabella per gestire gli appuntamenti del calendario vendite';
COMMENT ON COLUMN public.appointments.type IS 'Tipo di appuntamento: appointment, call, reminder';
COMMENT ON COLUMN public.appointments.status IS 'Stato dell''appuntamento: scheduled, completed, cancelled, rescheduled';
COMMENT ON COLUMN public.appointments.reminder_minutes IS 'Minuti prima dell''appuntamento per il promemoria';
