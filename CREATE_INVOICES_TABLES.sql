-- CREA TABELLE PER MODULO FATTURAZIONE
-- NOTE: eseguire questo script su Supabase PRIMA di aggiornare il frontend

begin;

-- 1) Tabella impostazioni applicazione (se non esiste)
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Imposta il flag globale per abilitare il modulo fatturazione (default: false)
insert into public.app_settings (key, value)
values ('invoices_enabled', jsonb_build_object('enabled', false))
on conflict (key) do update
  set value = excluded.value,
      updated_at = now();


-- 2) Tabella sequenze fatture per numerazione fiscale
create table if not exists public.invoice_sequences (
  year integer not null,
  prefix text not null default 'F',
  last_number integer not null default 0,
  primary key (year, prefix)
);


-- 3) Tabella fatture
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique,
  invoice_date date not null default current_date,

  customer_id uuid not null references public.customers (id) on delete restrict,
  order_id uuid references public.orders (id) on delete set null,

  payment_terms text,
  payment_due_date date,
  payment_status text not null default 'pending', -- pending | paid | overdue | cancelled

  subtotal_amount numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  taxable_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  currency text not null default 'EUR',

  status text not null default 'draft', -- draft | issued | cancelled
  notes text,

  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- 4) Tabella righe fattura
create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,

  order_item_id uuid references public.order_items (id) on delete set null,
  product_id uuid references public.products (id) on delete set null,

  description text not null,
  quantity numeric(12,3) not null default 0,
  unit text,
  unit_price numeric(12,4) not null default 0,
  discount_percentage numeric(5,2) not null default 0,

  vat_rate numeric(5,2) not null default 22,
  vat_amount numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,

  created_at timestamptz not null default now()
);


-- 5) Colonne per fatturazione parziale sugli order_items
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'order_items'
      and column_name = 'invoiced_quantity'
  ) then
    alter table public.order_items
      add column invoiced_quantity numeric(12,3) not null default 0;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'order_items'
      and column_name = 'last_invoiced_at'
  ) then
    alter table public.order_items
      add column last_invoiced_at timestamptz;
  end if;
end $$;

commit;



