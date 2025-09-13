import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth'; // Il nostro hook per l'autenticazione
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2, Package, Edit } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
      {/* Digital Pattern Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(45deg, #10b981 1px, transparent 1px),
            linear-gradient(-45deg, #10b981 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }} />
      </div>
      
      <div className="relative z-10 space-y-6 p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-green-800 mb-2">🌱 Garden</h1>
          <p className="text-green-600 text-lg">Gestione prodotti per il reparto produzione</p>
          <p className="text-green-700 mt-2">
            Benvenuto, {profile?.full_name}. Il tuo ruolo è: <strong>{profile?.role}</strong>. Stai vedendo <strong>{products.length}</strong> prodotti.
          </p>
        </div>

        {/* Mostriamo una semplice lista dei prodotti caricati */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="bg-white/80 backdrop-blur-sm border-green-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                <CardTitle className="text-white">{product.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-3">{product.description || 'Nessuna descrizione'}</p>
                
                {/* Product Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Codice:</span>
                    <span className="text-gray-600 font-mono">{product.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Categoria:</span>
                    <span className="text-gray-600">{product.category || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Prezzo Base:</span>
                    <span className="text-gray-600">€{product.base_price || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Unità:</span>
                    <span className="text-gray-600">{product.unit || 'pz'}</span>
                  </div>
                  {product.brand_name && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Brand:</span>
                      <span className="text-gray-600">{product.brand_name}</span>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Package className="w-4 h-4 mr-1" />
                    Dettagli
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    Modifica
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}