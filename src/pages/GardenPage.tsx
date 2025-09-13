import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth'; // Il nostro hook per l'autenticazione
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Loader2 } from 'lucide-react';

export default function GardenPage() {
  const { profile } = useAuth(); // Prendiamo il profilo (e quindi il ruolo) dell'utente loggato
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductsForRole = async () => {
      if (!profile?.role) return; // Aspetta che il profilo sia caricato

      setLoading(true);

      // 1. Decidiamo quale "finestra" (Vista) usare in base al ruolo dell'utente
      let viewName = '';
      if (profile.role === 'admin' || profile.role === 'sales') {
        viewName = 'view_products_commercial';
      } else if (profile.role === 'production') {
        viewName = 'view_products_production';
      } else if (profile.role === 'customer_user') {
        viewName = 'view_products_customer';
      }

      if (!viewName) {
        console.error("Ruolo non valido o senza vista definita:", profile.role);
        setLoading(false);
        return;
      }

      console.log(`Caricamento dati per ruolo "${profile.role}" dalla vista "${viewName}"...`);

      // 2. Chiediamo i dati alla Vista corretta
      // Il database farà il lavoro di filtrare le colonne per noi!
      const { data, error } = await supabase.from(viewName).select('*');

      if (error) {
        console.error(`Errore nel caricare i dati da ${viewName}:`, error);
      } else {
        setProducts(data || []);
      }

      setLoading(false);
    };

    fetchProductsForRole();
  }, [profile]); // Questo effetto si attiva non appena il profilo è disponibile

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Garden - Schede Prodotto</h1>
      <p className="text-gray-600">
        Benvenuto, {profile?.full_name}. Il tuo ruolo è: <strong>{profile?.role}</strong>. Stai vedendo <strong>{products.length}</strong> prodotti.
      </p>

      {/* Mostriamo una semplice lista dei prodotti caricati */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader><CardTitle>{product.name}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">{product.description || 'Nessuna descrizione'}</p>
              {/* Qui aggiungeremo i campi e i pulsanti specifici per ogni ruolo */}
              <pre className="mt-4 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                {JSON.stringify(product, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}