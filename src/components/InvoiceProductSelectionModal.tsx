import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Search, Package, Loader2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../store/useStore';
import type { Database } from '../types/database.types';

type Product = Database['public']['Tables']['products']['Row'];

interface InvoiceProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductSelect: (product: Product) => void;
  selectedProductId?: string | null;
}

export const InvoiceProductSelectionModal: React.FC<InvoiceProductSelectionModalProps> = ({
  isOpen,
  onClose,
  onProductSelect,
  selectedProductId,
}) => {
  const { addNotification } = useNotifications();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    } else {
      setSearchTerm('');
      setProducts([]);
    }
  }, [isOpen]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name')
        .limit(200);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Errore caricamento prodotti:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile caricare i prodotti',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.code.toLowerCase().includes(term) ||
      p.name.toLowerCase().includes(term) ||
      (p.description || '').toLowerCase().includes(term)
    );
  });

  const handleSelect = (product: Product) => {
    onProductSelect(product);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            <span>Seleziona prodotto</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cerca per codice, nome o descrizione..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Caricamento prodotti...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-10 text-gray-600">
                Nessun prodotto trovato. Prova a cambiare i criteri di ricerca.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProducts.map((p) => (
                  <Card
                    key={p.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedProductId === p.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelect(p)}
                  >
                    <CardContent className="p-3 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-gray-600">
                            {p.code}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {p.name}
                          </span>
                        </div>
                        {p.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {p.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end text-xs text-gray-600 gap-1">
                        {typeof p.base_price === 'number' && (
                          <span>Prezzo base: € {p.base_price.toFixed(2)}</span>
                        )}
                        {typeof p.iva === 'number' && (
                          <span>IVA: {p.iva}%</span>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-1"
                        >
                          Seleziona
                        </Button>
                        {selectedProductId === p.id && (
                          <div className="flex items-center text-primary-600 text-[11px]">
                            <Check className="w-3 h-3 mr-1" />
                            Selezionato
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceProductSelectionModal;



