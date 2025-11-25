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

const PRODUCTS_PAGE_SIZE = 60;
const NO_CATEGORY_VALUE = '__NO_CATEGORY__' as const;
type CategoryFilterValue = 'all' | typeof NO_CATEGORY_VALUE | string;

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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [codeFilter, setCodeFilter] = useState('');
  const [debouncedCodeFilter, setDebouncedCodeFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilterValue>('all');
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [existingProductIds, setExistingProductIds] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [productPage, setProductPage] = useState(0);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [totalAvailableProducts, setTotalAvailableProducts] = useState(0);
  const { addNotification } = useNotifications();

  // Gestisce il debounce della ricerca per evitare troppe chiamate a Supabase
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCodeFilter(codeFilter.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [codeFilter]);

  // Carica dati quando la modale viene aperta
  useEffect(() => {
    if (isOpen && priceListId) {
      // Reset dello stato quando si apre la modale
      setSelectedProducts([]);
      setSearchTerm('');
      setDebouncedSearchTerm('');
      setCodeFilter('');
      setDebouncedCodeFilter('');
      setSelectedCategory('all');
      setProducts([]);
      setProductPage(0);
      setHasMoreProducts(true);
      setTotalAvailableProducts(0);
      setInitialDataLoaded(false);
      // Ricarica sempre i dati quando si apre la modale per avere dati aggiornati
      loadInitialData();
    }
  }, [isOpen, priceListId]);

  const loadInitialData = async () => {
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

      // Carica categorie attive per il filtro
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('name')
        .eq('is_active', true)
        .order('name');

      if (categoriesError) {
        console.error('Errore nel caricamento categorie:', categoriesError);
        throw categoriesError;
      }

      setCategories((categoriesData || []).map(cat => cat.name).filter((name): name is string => Boolean(name)));

      setInitialDataLoaded(true);
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

  const fetchProducts = async (page = 0, reset = false) => {
    if (!priceListId) return;

    if (reset) {
      setProducts([]);
      setProductPage(0);
      setHasMoreProducts(true);
    }

    setIsLoadingProducts(true);
    try {
      const from = page * PRODUCTS_PAGE_SIZE;
      const to = from + PRODUCTS_PAGE_SIZE - 1;

      let query = supabase
        .from('products')
        .select('id, code, name, description, category, unit, base_price, is_active, customer_id', { count: 'exact' })
        .eq('is_active', true)
        .order('name')
        .range(from, to);

      if (selectedCategory !== 'all') {
        if (selectedCategory === NO_CATEGORY_VALUE) {
          query = query.is('category', null);
        } else {
          query = query.eq('category', selectedCategory);
        }
      }

      const trimmedSearch = debouncedSearchTerm.trim();
      const trimmedCode = debouncedCodeFilter.trim();
      if (trimmedSearch) {
        const searchValue = `%${trimmedSearch}%`;
        query = query.or([
          `name.ilike.${searchValue}`,
          `code.ilike.${searchValue}`,
          `description.ilike.${searchValue}`,
          `category.ilike.${searchValue}`
        ].join(','));
      }
      if (trimmedCode) {
        query = query.ilike('code', `${trimmedCode}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const normalizedData = data || [];
      setTotalAvailableProducts(count ?? normalizedData.length);
      setHasMoreProducts(
        count !== null && count !== undefined
          ? to + 1 < count
          : normalizedData.length === PRODUCTS_PAGE_SIZE
      );
      setProducts(prev => reset ? normalizedData : [...prev, ...normalizedData]);
      setProductPage(page);
    } catch (error) {
      console.error('Errore nel caricamento prodotti:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Errore nel caricamento dei prodotti'
      });
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !priceListId || !initialDataLoaded) return;
    fetchProducts(0, true);
  }, [debouncedSearchTerm, debouncedCodeFilter, selectedCategory, currentCustomer?.id, initialDataLoaded, isOpen, priceListId]);

  const handleLoadMoreProducts = () => {
    if (!hasMoreProducts || isLoadingProducts) return;
    fetchProducts(productPage + 1);
  };

  // Filtra prodotti lato client per controlli extra (cliente assegnato)
  const normalizedSearch = debouncedSearchTerm ? debouncedSearchTerm.toLowerCase() : '';
  const normalizedCodeFilter = debouncedCodeFilter ? debouncedCodeFilter.toLowerCase() : '';
  const filteredProducts = products.filter(product => {
    // Filtra i prodotti assegnati ad altri clienti
    if (currentCustomer?.id && product.customer_id && product.customer_id !== currentCustomer.id) {
      return false;
    }

    // Filtro per ricerca (ridondante rispetto al backend ma utile per sicurezza/UI)
    const matchesSearch = !normalizedSearch ||
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.code.toLowerCase().includes(normalizedSearch) ||
      product.description?.toLowerCase().includes(normalizedSearch) ||
      product.category?.toLowerCase().includes(normalizedSearch);

    const matchesCode = !normalizedCodeFilter || product.code.toLowerCase().startsWith(normalizedCodeFilter);

    // Filtro per categoria
    const matchesCategory =
      selectedCategory === 'all'
        ? true
        : selectedCategory === NO_CATEGORY_VALUE
          ? !product.category
          : product.category === selectedCategory;

    return matchesSearch && matchesCode && matchesCategory;
  });
  const displayedCount = totalAvailableProducts || filteredProducts.length;
  const isInitialLoading = isLoading || (isLoadingProducts && products.length === 0);

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
    setDebouncedSearchTerm('');
    setCodeFilter('');
    setDebouncedCodeFilter('');
    setSelectedCategory('all');
    setSelectedProducts([]);
    setExistingProductIds(new Set());
    setProducts([]);
    setCategories([]);
    setInitialDataLoaded(false);
    setHasMoreProducts(true);
    setProductPage(0);
    setTotalAvailableProducts(0);
    setIsLoading(false);
    setIsLoadingProducts(false);
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label htmlFor="codeFilter" className="text-xs font-medium text-gray-700">
                  Codice Prodotto
                </Label>
                <Input
                  id="codeFilter"
                  placeholder="Filtra per codice (es. EN)"
                  value={codeFilter}
                  onChange={(e) => setCodeFilter(e.target.value)}
                  className="h-8 text-sm uppercase"
                />
              </div>
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
                <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as CategoryFilterValue)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Tutte le categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le categorie</SelectItem>
                    <SelectItem value={NO_CATEGORY_VALUE}>Senza categoria</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
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
                    setDebouncedSearchTerm('');
                    setCodeFilter('');
                    setDebouncedCodeFilter('');
                    setSelectedCategory('all');
                    setProductPage(0);
                    setHasMoreProducts(true);
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
                Prodotti Disponibili ({displayedCount})
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

            {isInitialLoading ? (
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
              <>
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

                {hasMoreProducts && (
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoadMoreProducts}
                      disabled={isLoadingProducts}
                      className="text-xs"
                    >
                      {isLoadingProducts ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                          Caricamento...
                        </>
                      ) : (
                        'Carica altri prodotti'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSelectionModal;
