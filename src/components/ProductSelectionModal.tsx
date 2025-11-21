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
  onProductsAdded?: () => void; // Callback per ricaricare i dati
}

const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({
  isOpen,
  onClose,
  onProductSelect,
  priceListId,
  currentCustomer,
  onProductsAdded
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [existingProductIds, setExistingProductIds] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const { addNotification } = useNotifications();

  // Carica dati quando la modale viene aperta
  useEffect(() => {
    if (isOpen && priceListId) {
      // Reset dello stato quando si apre la modale
      setSelectedProducts([]);
      setSearchTerm('');
      setSelectedCategory('all');
      // Ricarica sempre i dati quando si apre la modale per avere dati aggiornati
      loadData();
    }
  }, [isOpen, currentCustomer, priceListId]);

  const loadData = async () => {
    if (!priceListId) return;
    
    setIsLoading(true);
    try {
      // Carica prodotti già presenti nel listino - IMPORTANTE: sempre ricaricare per avere dati aggiornati
      const { data: existingItems, error: existingError } = await supabase
        .from('price_list_items')
        .select('product_id')
        .eq('price_list_id', priceListId);

      if (existingError) {
        console.error('Errore nel caricamento prodotti esistenti:', existingError);
        throw existingError;
      }
      
      // Crea un nuovo Set per forzare l'aggiornamento
      const existingIds = new Set(existingItems?.map(item => item.product_id) || []);
      console.log(`Prodotti già presenti nel listino: ${existingIds.size}`);
      setExistingProductIds(existingIds);

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
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Errore nel caricamento dei dati'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtra prodotti
  const filteredProducts = products.filter(product => {
    // Filtra i prodotti assegnati ad altri clienti
    if (currentCustomer?.id && product.customer_id && product.customer_id !== currentCustomer.id) {
      return false;
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

  const handleProductToggle = (product: Product, e?: React.MouseEvent) => {
    // Previeni la propagazione dell'evento se fornito
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Non permettere la selezione se il prodotto è già nel listino
    if (existingProductIds.has(product.id)) {
      return;
    }

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
      addNotification({
        type: 'warning',
        title: 'Attenzione',
        message: 'Seleziona almeno un prodotto'
      });
      return;
    }

    if (isAdding) {
      return; // Previeni click multipli
    }

    setIsAdding(true);
    try {
      // Filtra i prodotti già presenti per evitare duplicati
      const productsToAdd = selectedProducts.filter(p => !existingProductIds.has(p.id));
      
      if (productsToAdd.length === 0) {
        addNotification({
          type: 'warning',
          title: 'Attenzione',
          message: 'Tutti i prodotti selezionati sono già presenti nel listino'
        });
        setIsAdding(false);
        return;
      }

      // Prepara i dati per l'inserimento batch
      const itemsToInsert = productsToAdd.map(product => ({
        price_list_id: priceListId,
        product_id: product.id,
        price: product.base_price,
        min_quantity: 1,
        discount_percentage: 0
      }));

      // Inserisci tutti i prodotti in una singola operazione
      const { error } = await supabase
        .from('price_list_items')
        .insert(itemsToInsert);

      if (error) {
        // Se c'è un errore di duplicato, prova ad aggiungere uno per uno
        if (error.code === '23505' || error.message.includes('duplicate')) {
          let added = 0;
          let skipped = 0;
          for (const product of productsToAdd) {
            const { error: singleError } = await supabase
              .from('price_list_items')
              .insert({
                price_list_id: priceListId,
                product_id: product.id,
                price: product.base_price,
                min_quantity: 1,
                discount_percentage: 0
              });
            if (singleError) {
              if (singleError.code === '23505' || singleError.message.includes('duplicate')) {
                skipped++;
              } else {
                throw singleError;
              }
            } else {
              added++;
            }
          }
          if (added > 0) {
            addNotification({
              type: 'success',
              title: 'Prodotti aggiunti',
              message: `${added} prodotti aggiunti${skipped > 0 ? `, ${skipped} già presenti` : ''}`
            });
          }
        } else {
          throw error;
        }
      } else {
        addNotification({
          type: 'success',
          title: 'Successo',
          message: `${productsToAdd.length} prodotti aggiunti al listino`
        });
      }

      // Chiama il callback PRIMA di chiudere per aggiornare i dati nel componente padre
      onProductsAdded?.(); 
      
      // Reset dello stato
      setSelectedProducts([]);
      setExistingProductIds(new Set()); // Reset per forzare il ricaricamento alla prossima apertura
      
      // Chiudi la modale dopo un breve delay per permettere l'aggiornamento
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (error: any) {
      console.error('Errore nell\'aggiunta prodotti:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: error.message || 'Errore nell\'aggiunta dei prodotti'
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedProducts([]);
    setExistingProductIds(new Set());
    setIsAdding(false);
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
                  disabled={isAdding}
                  className="h-7 text-xs px-3 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {isAdding ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                      Aggiunta...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3 mr-1" />
                      Aggiungi {selectedProducts.length} Prodotti
                    </>
                  )}
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
                  const isAlreadyInList = existingProductIds.has(product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={(e) => handleProductToggle(product, e)}
                      className={`border rounded-lg p-3 transition-all ${
                        isAlreadyInList
                          ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                          : isSelected 
                            ? 'border-green-500 bg-green-50 cursor-pointer' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
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
                          {isAlreadyInList && (
                            <div className="text-xs text-orange-600 mt-1 font-medium">Già nel listino</div>
                          )}
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          {isAlreadyInList ? (
                            <Check className="w-4 h-4 text-gray-400" />
                          ) : isSelected ? (
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
