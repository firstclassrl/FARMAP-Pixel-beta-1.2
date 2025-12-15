import { useEffect, useState } from 'react';
import { FileText, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Database } from '../types/database.types';
import { formatCurrency, formatDate } from '../lib/exportUtils';
import InvoiceFormModal from '../components/InvoiceFormModal';

type Invoice = Database['public']['Tables']['invoices']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];

interface InvoiceWithCustomer extends Invoice {
  customers: Customer | null;
}

export default function InvoicesPage() {
  const { profile } = useAuth();
  const [flagLoading, setFlagLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [flagError, setFlagError] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<InvoiceWithCustomer[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const loadFlag = async () => {
      setFlagLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'invoices_enabled')
        .maybeSingle();

      if (error) {
        console.error('Errore caricamento flag fatturazione:', error);
        setFlagError('Impossibile verificare lo stato del modulo fatturazione.');
      } else {
        setEnabled(Boolean((data as any)?.value?.enabled));
      }
      setFlagLoading(false);
    };

    loadFlag();
  }, []);

  const loadInvoices = async () => {
    if (!enabled) return;
    setListLoading(true);
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customers(*)')
      .order('invoice_date', { ascending: false });

    if (error) {
      console.error('Errore caricamento fatture:', error);
    } else {
      setInvoices((data as InvoiceWithCustomer[]) || []);
    }
    setListLoading(false);
  };

  useEffect(() => {
    if (enabled) {
      loadInvoices();
    }
  }, [enabled]);

  if (flagLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Card className="max-w-lg w-full">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <CardTitle>Modulo fatturazione disattivato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600">
              Il modulo di fatturazione è attualmente disattivato nelle impostazioni
              dell&apos;applicazione.
            </p>
            {profile?.role === 'admin' && (
              <p className="text-sm text-gray-600">
                Apri il menu utente in alto a destra &rarr; <span className="font-semibold">Impostazioni</span> e
                abilita la voce <span className="font-semibold">Modulo fatturazione</span>.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-slate-700" />
            Fatture
          </h1>
          <p className="text-gray-600 mt-1">
            Crea e consulta le fatture dei clienti. Questa è una prima versione semplificata.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          Nuova fattura
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Elenco fatture</CardTitle>
        </CardHeader>
        <CardContent>
          {listLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">Caricamento fatture...</span>
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-gray-600">
              Non ci sono ancora fatture. Crea la prima usando il pulsante &quot;Nuova fattura&quot;.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-4">Numero</th>
                    <th className="py-2 pr-4">Data</th>
                    <th className="py-2 pr-4">Cliente</th>
                    <th className="py-2 pr-4 text-right">Totale</th>
                    <th className="py-2 pr-4">Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        {inv.invoice_number || 'Bozza'}
                      </td>
                      <td className="py-2 pr-4">
                        {formatDate(inv.invoice_date)}
                      </td>
                      <td className="py-2 pr-4">
                        {inv.customers?.company_name || 'N/A'}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        {formatCurrency(inv.total_amount || 0)}
                      </td>
                      <td className="py-2 pr-4">
                        {inv.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <InvoiceFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onCreated={loadInvoices}
      />
    </div>
  );
}

