import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, Package, Plus, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../store/useStore';

interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  base_price: number;
  is_active: boolean;
  customer_id?: string;
}

interface Customer {
  id: string;
  company_name: string;
  code_prefix?: string;
}

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductSelect: (product: Product) => void;
  priceListId: string;
  currentCustomer?: Customer | null;
}

const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({
  isOpen,
  onClose,
  onProductSelect,
  priceListId,
  currentCustomer
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotifications();

  // Carica dati
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, currentCustomer]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Carica clienti
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, company_name, code_prefix')
        .eq('is_active', true)
        .order('company_name');

      if (customersError) throw customersError;
      setCustomers(customersData || []);

      // Carica prodotti
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, code, name, description, category, unit, base_price, is_active, customer_id')
        .eq('is_active', true)
        .order('name');

      if (productsError) throw productsError;
      setProducts(productsData || []);

    } catch (error) {
      console.error('Errore nel caricamento dati:', error);
      addNotification('Errore nel caricamento dei dati', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtra prodotti
  const filteredProducts = products.filter(product => {
    // Filtro per cliente (code_prefix)
    if (currentCustomer?.code_prefix) {
      const productPrefix = product.code.substring(0, 2);
      if (productPrefix !== currentCustomer.code_prefix) {
        // Controlla se il prefisso appartiene a qualche cliente
        const prefixBelongsToCustomer = customers.some(c => c.code_prefix === productPrefix);
        if (prefixBelongsToCustomer) {
          return false; // Il prodotto appartiene a un altro cliente
        }
      }
    }

    // Filtro per ricerca
    const matchesSearch = !searchTerm ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro per categoria
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Categorie uniche
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const handleProductToggle = (product: Product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => p.id === product.id);
      if (isSelected) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const handleAddSelectedProducts = async () => {
    if (selectedProducts.length === 0) {
      addNotification('Seleziona almeno un prodotto', 'warning');
      return;
    }

    try {
      for (const product of selectedProducts) {
        const { error } = await supabase
          .from('price_list_items')
          .insert({
            price_list_id: priceListId,
            product_id: product.id,
            price: product.base_price,
            min_quantity: 1,
            discount_percentage: 0
          });

        if (error) throw error;
      }

      addNotification(`${selectedProducts.length} prodotti aggiunti al listino`, 'success');
      setSelectedProducts([]);
      onClose();
    } catch (error) {
      console.error('Errore nell\'aggiunta prodotti:', error);
      addNotification('Errore nell\'aggiunta dei prodotti', 'error');
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedProducts([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[90vw] h-[90vh] max-w-none max-h-none overflow-hidden">
        <DialogHeader>
          <DialogTitle>Seleziona Prodotti per il Listino</DialogTitle>
        </DialogHeader>

        <div className="h-full overflow-y-auto space-y-4 p-1">
          {/* Filtri */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="search" className="text-xs font-medium text-gray-700">
                  Cerca Prodotti
                </Label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Cerca per nome, codice, descrizione o categoria..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category" className="text-xs font-medium text-gray-700">
                  Categoria
                </Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Tutte le categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le categorie</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category || ''}>
                        {category || 'Senza categoria'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  className="h-8 text-xs"
                >
                  Pulisci Filtri
                </Button>
              </div>
            </div>
          </div>

          {/* Lista Prodotti */}
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Prodotti Disponibili ({filteredProducts.length})
              </h3>
              {selectedProducts.length > 0 && (
                <Button
                  onClick={handleAddSelectedProducts}
                  className="h-7 text-xs px-3 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Aggiungi {selectedProducts.length} Prodotti
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Nessun prodotto trovato con i filtri selezionati'
                    : 'Non ci sono prodotti attivi disponibili'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto">
                {filteredProducts.map(product => {
                  const isSelected = selectedProducts.some(p => p.id === product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => handleProductToggle(product)}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500">Codice: {product.code}</div>
                          {product.category && (
                            <div className="text-xs text-gray-500">Categoria: {product.category}</div>
                          )}
                          <div className="text-xs text-gray-500">Prezzo: €{product.base_price.toFixed(2)}</div>
                        </div>
                        <div className="ml-2">
                          {isSelected ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <div className="w-4 h-4 border border-gray-300 rounded"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSelectionModal;
