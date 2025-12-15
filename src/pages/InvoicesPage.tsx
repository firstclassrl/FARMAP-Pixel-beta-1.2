import { useEffect, useState } from 'react';
import { FileText, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function InvoicesPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFlag = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'invoices_enabled')
        .maybeSingle();

      if (error) {
        console.error('Errore caricamento flag fatturazione:', error);
        setError('Impossibile verificare lo stato del modulo fatturazione.');
      } else {
        setEnabled(Boolean((data as any)?.value?.enabled));
      }
      setLoading(false);
    };

    loadFlag();
  }, []);

  if (loading) {
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
            Modulo fatturazione attivo. Qui potrai creare, modificare e consultare le fatture.
          </p>
        </div>
        <Button disabled>
          Nuova fattura (in sviluppo)
        </Button>
      </div>

      <Card>
        <CardContent className="py-10 text-center text-gray-600 space-y-2">
          <p className="font-medium">La parte visuale del modulo fatturazione è stata attivata.</p>
          <p className="text-sm">
            A breve verranno aggiunte: lista fatture, creazione manuale e generazione da ordine
            secondo il piano definito.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


