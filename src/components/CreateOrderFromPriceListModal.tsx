import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  FileText, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Package,
  Building,
  Calendar,
  Euro
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { createOrderFromPriceList, validatePriceListForOrder } from '../lib/orderUtils';
import { formatCurrency } from '../lib/exportUtils';
import type { Database } from '../types/database.types';

type PriceList = Database['public']['Tables']['price_lists']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];

interface PriceListWithCustomer extends PriceList {
  customer?: Customer;
  product_count: number;
  total_value: number;
}

interface CreateOrderFromPriceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

export const CreateOrderFromPriceListModal: React.FC<CreateOrderFromPriceListModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated
}) => {
  const [priceLists, setPriceLists] = useState<PriceListWithCustomer[]>([]);
  const [selectedPriceListId, setSelectedPriceListId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [selectedPriceListValid, setSelectedPriceListValid] = useState<boolean | null>(null);

  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // Load available price lists when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPriceLists();
    } else {
      // Reset state when modal closes
      setSelectedPriceListId('');
      setSelectedPriceListValid(null);
    }
  }, [isOpen]);

  // Validate selected price list
  useEffect(() => {
    if (selectedPriceListId) {
      validateSelectedPriceList();
    } else {
      setSelectedPriceListValid(null);
    }
  }, [selectedPriceListId]);

  const loadPriceLists = async () => {
    try {
      setLoading(true);

      // Load active price lists with customer and item count
      const { data: priceListsData, error: priceListsError } = await supabase
        .from('price_lists')
        .select(`
          *,
          price_list_items(count)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (priceListsError) throw priceListsError;

      // Load customers to match with price lists
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, company_name, contact_person, price_list_id')
        .eq('is_active', true)
        .not('price_list_id', 'is', null);

      if (customersError) throw customersError;

      // Combine price lists with customer data and calculate totals
      const priceListsWithDetails = await Promise.all(
        (priceListsData || []).map(async (priceList) => {
          const customer = customersData?.find(c => c.price_list_id === priceList.id);
          const productCount = (priceList.price_list_items as any)[0]?.count || 0;

          // Calculate total value of price list
          let totalValue = 0;
          if (productCount > 0) {
            const { data: itemsData } = await supabase
              .from('price_list_items')
              .select('price, min_quantity, discount_percentage')
              .eq('price_list_id', priceList.id);

            if (itemsData) {
              totalValue = itemsData.reduce((sum, item) => {
                const itemTotal = item.price * item.min_quantity;
                const discountAmount = (itemTotal * item.discount_percentage) / 100;
                return sum + (itemTotal - discountAmount);
              }, 0);
            }
          }

          return {
            ...priceList,
            customer: customer ? {
              id: customer.id,
              company_name: customer.company_name,
              contact_person: customer.contact_person
            } as Customer : undefined,
            product_count: productCount,
            total_value: totalValue
          };
        })
      );

      // Filter out price lists without customers or products
      const validPriceLists = priceListsWithDetails.filter(
        pl => pl.customer && pl.product_count > 0
      );

      setPriceLists(validPriceLists);

    } catch (error) {
      console.error('Error loading price lists:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile caricare i listini disponibili'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateSelectedPriceList = async () => {
    if (!selectedPriceListId) return;

    try {
      setValidating(true);
      const isValid = await validatePriceListForOrder(selectedPriceListId);
      setSelectedPriceListValid(isValid);
    } catch (error) {
      console.error('Error validating price list:', error);
      setSelectedPriceListValid(false);
    } finally {
      setValidating(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!user?.id) {
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Devi essere autenticato per creare ordini'
      });
      return;
    }

    if (!selectedPriceListId) {
      addNotification({
        type: 'warning',
        title: 'Attenzione',
        message: 'Seleziona un listino per creare l\'ordine'
      });
      return;
    }

    if (selectedPriceListValid === false) {
      addNotification({
        type: 'error',
        title: 'Listino non valido',
        message: 'Il listino selezionato non può essere utilizzato per creare un ordine'
      });
      return;
    }

    setCreating(true);

    try {
      // Create order from price list
      const newOrderId = await createOrderFromPriceList(selectedPriceListId, user.id);

      // Get the selected price list info for notification
      const selectedPriceList = priceLists.find(pl => pl.id === selectedPriceListId);

      addNotification({
        type: 'success',
        title: 'Ordine creato',
        message: `Nuovo ordine creato dal listino "${selectedPriceList?.name}" per ${selectedPriceList?.customer?.company_name}`
      });

      // Close modal and refresh orders list
      onClose();
      onOrderCreated();

    } catch (error: any) {
      console.error('Error creating order:', error);
      addNotification({
        type: 'error',
        title: 'Errore creazione ordine',
        message: error.message || 'Si è verificato un errore durante la creazione dell\'ordine'
      });
    } finally {
      setCreating(false);
    }
  };

  const selectedPriceList = priceLists.find(pl => pl.id === selectedPriceListId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5" />
            <span>Nuovo Ordine da Listino</span>
          </DialogTitle>
          <DialogDescription>
            Seleziona un listino esistente per generare automaticamente un nuovo ordine
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
              <span className="text-gray-600">Caricamento listini...</span>
            </div>
          ) : (
            <>
              {/* Price List Selection */}
              <div className="space-y-3">
                <Label htmlFor="price-list-select">Seleziona Listino Cliente</Label>
                <Select value={selectedPriceListId} onValueChange={setSelectedPriceListId}>
                  <SelectTrigger id="price-list-select">
                    <SelectValue placeholder="Scegli un listino da cui creare l'ordine" />
                  </SelectTrigger>
                  <SelectContent>
                    {priceLists.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="font-medium">Nessun listino disponibile</p>
                        <p className="text-xs mt-1">
                          Crea prima un listino con prodotti e assegnalo a un cliente
                        </p>
                      </div>
                    ) : (
                      priceLists.map((priceList) => (
                        <SelectItem key={priceList.id} value={priceList.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{priceList.name}</span>
                            <span className="text-xs text-gray-500">
                              {priceList.customer?.company_name} • {priceList.product_count} prodotti
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {/* Validation Status */}
                {validating && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Validazione listino...</span>
                  </div>
                )}

                {selectedPriceListValid === true && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Listino valido per la creazione dell'ordine</span>
                  </div>
                )}

                {selectedPriceListValid === false && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">
                      Listino non valido (scaduto, inattivo o senza prodotti)
                    </span>
                  </div>
                )}
              </div>

              {/* Selected Price List Preview */}
              {selectedPriceList && (
                <Card className="bg-red-50 border-red-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-red-600" />
                      <span>Anteprima Ordine</span>
                    </CardTitle>
                    <CardDescription>
                      Dettagli dell'ordine che verrà creato dal listino selezionato
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Cliente</p>
                          <p className="text-sm text-gray-600">{selectedPriceList.customer?.company_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Data Ordine</p>
                          <p className="text-sm text-gray-600">{new Date().toLocaleDateString('it-IT')}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Prodotti</p>
                          <p className="text-sm text-gray-600">{selectedPriceList.product_count} articoli</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Euro className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Valore Stimato</p>
                          <p className="text-sm text-gray-600 font-semibold">
                            {formatCurrency(selectedPriceList.total_value)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">Cosa succederà:</p>
                          <ul className="text-xs space-y-1">
                            <li>• Verrà creato un nuovo ordine con stato "In attesa"</li>
                            <li>• Tutti i prodotti del listino saranno aggiunti con le quantità minime (MOQ)</li>
                            <li>• I prezzi e gli sconti del listino verranno applicati automaticamente</li>
                            <li>• Potrai modificare l'ordine dopo la creazione</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={onClose} disabled={creating}>
                  Annulla
                </Button>
                <Button
                  onClick={handleCreateOrder}
                  disabled={
                    !selectedPriceListId || 
                    selectedPriceListValid === false || 
                    creating || 
                    validating ||
                    priceLists.length === 0
                  }
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creazione ordine...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Crea Ordine
                    </>
                  )}
                </Button>
              </div>

              {/* No Price Lists Available */}
              {!loading && priceLists.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nessun listino disponibile
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Per creare un ordine da un listino, devi prima:
                  </p>
                  <div className="text-left bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
                    <ol className="text-sm text-gray-700 space-y-2">
                      <li className="flex items-start space-x-2">
                        <span className="bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                        <span>Creare un listino con prodotti</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
                        <span>Assegnare il listino a un cliente attivo</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
                        <span>Assicurarsi che il listino sia attivo e valido</span>
                      </li>
                    </ol>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};