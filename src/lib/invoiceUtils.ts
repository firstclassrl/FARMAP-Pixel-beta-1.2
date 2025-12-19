import { supabase } from './supabase';
import type { Database } from '../types/database.types';

type InvoiceRow = Database['public']['Tables']['invoices']['Row'];
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
type InvoiceItemInsert = Database['public']['Tables']['invoice_items']['Insert'];

export type InvoiceStatus = 'draft' | 'issued' | 'cancelled';

export interface InvoiceItemInput {
  product_id: string | null;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percentage: number;
  vat_rate: number;
}

export interface InvoicePayload {
  customer_id: string;
  order_id?: string | null;
  invoice_date: string; // ISO yyyy-mm-dd
  payment_terms?: string | null;
  notes?: string | null;
  status: InvoiceStatus;
  items: InvoiceItemInput[];
}

export interface CalculatedInvoiceTotals {
  subtotal_amount: number;
  discount_amount: number;
  taxable_amount: number;
  tax_amount: number;
  total_amount: number;
  items: Omit<InvoiceItemInsert, 'invoice_id'>[];
}

export const calculateInvoiceTotals = (items: InvoiceItemInput[]): CalculatedInvoiceTotals => {
  let subtotal = 0;
  let discount = 0;
  let taxable = 0;
  let tax = 0;

  const mappedItems: Omit<InvoiceItemInsert, 'invoice_id'>[] = items.map((item) => {
    const rowSubtotal = item.quantity * item.unit_price;
    const rowDiscount = rowSubtotal * (item.discount_percentage / 100);
    const rowTaxable = rowSubtotal - rowDiscount;
    const rowTax = rowTaxable * (item.vat_rate / 100);
    const rowTotal = rowTaxable + rowTax;

    subtotal += rowSubtotal;
    discount += rowDiscount;
    taxable += rowTaxable;
    tax += rowTax;

    return {
      id: undefined,
      order_item_id: null,
      product_id: item.product_id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      discount_percentage: item.discount_percentage,
      vat_rate: item.vat_rate,
      vat_amount: rowTax,
      line_total: rowTotal,
      created_at: undefined,
    };
  });

  return {
    subtotal_amount: Number(subtotal.toFixed(2)),
    discount_amount: Number(discount.toFixed(2)),
    taxable_amount: Number(taxable.toFixed(2)),
    tax_amount: Number(tax.toFixed(2)),
    total_amount: Number((taxable + tax).toFixed(2)),
    items: mappedItems,
  };
};

/**
 * Genera il numero fattura chiamando la RPC `next_invoice_number`.
 * Richiede che la funzione esista già nel database.
 */
export const generateInvoiceNumber = async (
  invoiceDate: string,
  prefix = 'F'
): Promise<string | null> => {
  const year = new Date(invoiceDate).getFullYear();

  const { data, error } = await supabase.rpc('next_invoice_number', {
    p_year: year,
    p_prefix: prefix,
  });

  if (error) {
    console.error('Errore generazione numero fattura:', error);
    // In caso di errore, restituiamo null così la fattura rimane senza numero
    return null;
  }

  return data as string;
};

export const createInvoice = async (payload: InvoicePayload): Promise<InvoiceRow> => {
  if (!payload.items || payload.items.length === 0) {
    throw new Error('La fattura deve contenere almeno una riga.');
  }

  const { items, ...totals } = calculateInvoiceTotals(payload.items);

  let invoiceNumber: string | null = null;
  if (payload.status === 'issued') {
    invoiceNumber = await generateInvoiceNumber(payload.invoice_date);
  }

  const insertData: InvoiceInsert = {
    customer_id: payload.customer_id,
    order_id: payload.order_id ?? null,
    invoice_date: payload.invoice_date,
    payment_terms: payload.payment_terms ?? null,
    payment_due_date: null,
    payment_status: 'pending',
    status: payload.status,
    notes: payload.notes ?? null,
    invoice_number: invoiceNumber ?? undefined,
    subtotal_amount: totals.subtotal_amount,
    discount_amount: totals.discount_amount,
    taxable_amount: totals.taxable_amount,
    tax_amount: totals.tax_amount,
    total_amount: totals.total_amount,
    currency: 'EUR',
    created_at: undefined,
    updated_at: undefined,
    created_by: undefined as any,
    id: undefined as any,
  };

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert(insertData)
    .select('*')
    .single();

  if (invoiceError || !invoice) {
    console.error('Errore creazione fattura:', invoiceError);
    throw invoiceError || new Error('Errore creazione fattura');
  }

  const itemsWithInvoice: InvoiceItemInsert[] = items.map((item) => ({
    ...item,
    invoice_id: invoice.id,
  }));

  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(itemsWithInvoice);

  if (itemsError) {
    console.error('Errore creazione righe fattura:', itemsError);
    throw itemsError;
  }

  return invoice;
};




