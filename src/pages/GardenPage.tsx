import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle, ArrowLeft, LogOut } from 'lucide-react';
import { GardenHeader } from '../components/GardenHeader';
import { GardenFilters } from '../components/GardenFilters';
import { GardenProductCard } from '../components/GardenProductCard';
import { Button } from '../components/ui/button';

export default function GardenPage() {
  const { profile, signOut } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchProductsForRole = async () => {
      if (!profile?.role) return; // Aspetta che il profilo sia caricato

      setLoading(true);

      // 1. Decidiamo quale "finestra" (Vista) usare in base al ruolo dell'utente
      let viewName = '';
      const role = profile.role as string;
      if (role === 'admin' || role === 'commerciale' || role === 'sales') {
        viewName = 'view_products_commercial';
      } else if (role === 'production') {
        viewName = 'view_products_production';
      } else if (role === 'customer_user') {
        viewName = 'view_products_customer';
      }

      if (!viewName) {
        console.error("Ruolo non valido o senza vista definita:", profile.role);
        setLoading(false);
        return;
      }

      try {
        // 2. Chiediamo i dati alla Vista corretta
        // Il database farà il lavoro di filtrare le colonne per noi!
        const { data, error } = await supabase.from(viewName).select('*');

        if (error) {
          console.error(`Errore nel caricare i dati da ${viewName}:`, error);
          
          // Fallback: try to load from products table directly
          
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('products')
            .select('id, name, code, description, category, base_price, unit, photo_url, brand_name, customer_id')
            .eq('is_active', true);
            
          if (fallbackError) {
            console.error('Errore anche nel fallback:', fallbackError);
          } else {
            
            setProducts(fallbackData || []);
            setFilteredProducts(fallbackData || []);
          }
        } else {
          
          setProducts(data || []);
          setFilteredProducts(data || []);
        }
      } catch (e) {
        console.error('Errore generico durante il caricamento dei prodotti:', e);
      }

      setLoading(false);
    };

    fetchProductsForRole();
  }, [profile]);

  // Filter products based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product => {
      const searchLower = searchTerm.toLowerCase();
      return (
        product.name?.toLowerCase().includes(searchLower) ||
        product.code?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower) ||
        product.brand_name?.toLowerCase().includes(searchLower)
      );
    });

    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const handleViewDetails = (product: any) => {
    // Implement product details view
  };

  const handleDownloadPDF = (product: any) => {
    // Implement product PDF download
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-emerald-900 to-teal-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-2xl mb-4">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-gray-300 font-medium">Caricamento prodotti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-emerald-900 to-teal-900 relative overflow-hidden">
      {/* Dark Pattern Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, #10b981 1px, transparent 1px),
            radial-gradient(circle at 75% 75%, #14b8a6 1px, transparent 1px),
            radial-gradient(circle at 50% 50%, #06b6d4 1px, transparent 1px),
            linear-gradient(45deg, transparent 40%, rgba(16, 185, 129, 0.1) 50%, transparent 60%),
            linear-gradient(-45deg, transparent 40%, rgba(20, 184, 166, 0.1) 50%, transparent 60%)
          `,
          backgroundSize: '80px 80px, 100px 100px, 60px 60px, 120px 120px, 120px 120px'
        }} />
      </div>

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Floating Orbs - More Subtle */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-full blur-xl animate-pulse delay-1000" />
      <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 rounded-full blur-xl animate-pulse delay-2000" />
      
      <div className="relative z-10">
        {/* Navigation Buttons */}
        <div className="max-w-7xl mx-auto px-6 pt-6 flex justify-between items-center">
          {/* Back to Pixel Button - Only for Admin, Commercial and Sales (NOT for production) */}
          {(profile?.role === 'admin' || profile?.role === 'commerciale' || profile?.role === 'sales') && (
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="bg-white/20 backdrop-blur-sm border-white/30 text-gray-300 hover:bg-white/30 h-8 text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna a Pixel
            </Button>
          )}
          
          {/* Logout Button - Visible for all users */}
          <Button
            onClick={async () => {
              await signOut();
              // Reindirizza a garden/login dopo logout
              window.location.href = '/garden/login';
            }}
            variant="outline"
            className="bg-red-500/20 backdrop-blur-sm border-red-400/30 text-red-200 hover:bg-red-500/30 h-8 text-sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Header */}
        <GardenHeader
          userName={profile?.full_name || undefined}
          userRole={profile?.role}
          productCount={filteredProducts.length}
        />

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-6 mb-8">
          <GardenFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onFilterClick={() => {}}
          />
        </div>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-6 pb-12">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl shadow-2xl mb-6">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">
                {searchTerm ? 'Nessun prodotto trovato' : 'Nessun prodotto disponibile'}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm 
                  ? `Non sono stati trovati prodotti che corrispondono a "${searchTerm}"`
                  : 'Non ci sono prodotti disponibili per il tuo ruolo al momento'
                }
              </p>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1 max-w-4xl mx-auto'
            }`}>
              {filteredProducts.map((product) => (
                <GardenProductCard
                  key={product.id}
                  product={product}
                  onViewDetails={handleViewDetails}
                  onDownload={handleDownloadPDF}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}