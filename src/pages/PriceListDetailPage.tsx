import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { Loader2, FileText, Package, Plus, Trash2, X, Building, Mail, Eye } from 'lucide-react';
import type { Database } from '../types/database.types';
import { CustomerSelectionModal } from '../components/CustomerSelectionModal';
import ProductSelectionModal from '../components/ProductSelectionModal';
import { PriceListPrintView } from './PriceListPrintView';

type PriceList = Database['public']['Tables']['price_lists']['Row'];
type PriceListItem = Database['public']['Tables']['price_list_items']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];

interface Product {
  id: string;
  code: string;
  name: string;
  category?: string;
  unit: string;
  base_price: number;
}

interface PriceListWithItems extends PriceList {
  customer?: Customer;
  price_list_items: (PriceListItem & {
    products: Product;
  })[];
}

interface PriceListDetailPageProps {
  isOpen: boolean;
  onClose: () => void;
  priceListId?: string;
  onSaveSuccess: () => void;
}

const priceListSchema = z.object({
  name: z.string().min(1, 'Nome listino richiesto'),
  description: z.string().optional(),
  customer_id: z.string().optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
  currency: z.string().default('EUR'),
  is_default: z.boolean().default(false),
});

type PriceListFormData = z.infer<typeof priceListSchema>;

export function PriceListDetailPage({
  isOpen,
  onClose,
  priceListId,
  onSaveSuccess,
}: PriceListDetailPageProps) {
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  const productsSectionRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPriceList, setCurrentPriceList] = useState<PriceListWithItems | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isNewPriceListCreated, setIsNewPriceListCreated] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Main form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<PriceListFormData>({
    resolver: zodResolver(priceListSchema),
    defaultValues: {
      currency: 'EUR',
      is_default: false,
    },
  });


  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, company_name, contact_person')
        .eq('is_active', true)
        .order('company_name');

      if (customersError) throw customersError;


      setCustomers(customersData || []);

      // Load price list if editing
      if (priceListId) {
        await fetchPriceListDetails(priceListId);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile caricare i dati',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPriceListDetails = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('price_lists')
        .select(`
          *,
          price_list_items (
            *,
            products (id, code, name, category, unit, base_price)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Find customer associated with this price list
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('price_list_id', id)
        .maybeSingle();

      setCurrentPriceList(data as PriceListWithItems);

      // Converti date dal formato ISO (yyyy-mm-dd) al formato italiano (dd/mm/yyyy)
      const convertDateToItalian = (dateStr: string | null): string => {
        if (!dateStr) return '';
        // Se è in formato ISO, convertilo
        if (dateStr.includes('-')) {
          const [year, month, day] = dateStr.split('-');
          return `${day}/${month}/${year}`;
        }
        return dateStr;
      };

      // Pre-fill form
      reset({
        name: data.name,
        description: data.description || '',
        valid_from: convertDateToItalian(data.valid_from),
        valid_until: convertDateToItalian(data.valid_until),
        currency: data.currency,
        is_default: data.is_default,
        customer_id: customerData?.id || '',
      });

      setSelectedCustomerId(customerData?.id || '');
      setSelectedCustomer(customerData || null);
    } catch (error) {
      console.error('Error fetching price list details:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile caricare i dettagli del listino',
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, priceListId]);

  const handleMainFormSubmit = async (data: PriceListFormData) => {
    console.log('🔍 Form submit data:', data);
    console.log('🔍 User:', user);
    
    if (!user?.id) {
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Devi essere autenticato per creare o modificare listini'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Extract customer_id from form data - it doesn't belong in price_lists table
      const { customer_id, ...priceListData } = data;
      
      // Converti date dal formato italiano (dd/mm/yyyy) al formato ISO (yyyy-mm-dd)
      const convertDateToISO = (dateStr: string | undefined): string | null => {
        if (!dateStr) return null;
        // Se è già in formato ISO, restituiscilo
        if (dateStr.includes('-')) return dateStr;
        // Se è in formato italiano (dd/mm/yyyy), convertilo
        if (dateStr.includes('/')) {
          const [day, month, year] = dateStr.split('/');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return dateStr;
      };

      const finalPriceListData = {
        ...priceListData,
        description: data.description || null,
        valid_from: convertDateToISO(data.valid_from),
        valid_until: convertDateToISO(data.valid_until),
        created_by: user.id,
      };

      if (currentPriceList) {
        // Update existing price list
        const { error } = await supabase
          .from('price_lists')
          .update(finalPriceListData)
          .eq('id', currentPriceList.id);

        if (error) throw error;

        addNotification({
          type: 'success',
          title: 'Listino aggiornato',
          message: `${data.name} è stato aggiornato con successo`,
        });

        // Handle customer assignment
        if (customer_id && customer_id !== selectedCustomerId) {
          // Remove price list from previous customer if any
          if (selectedCustomerId) {
            await supabase
              .from('customers')
              .update({ price_list_id: null })
              .eq('id', selectedCustomerId);
          }

          // Assign price list to new customer
          const { error: customerError } = await supabase
            .from('customers')
            .update({ price_list_id: currentPriceList.id })
            .eq('id', customer_id);

          if (customerError) {
            console.error('Error assigning customer to price list:', customerError);
            addNotification({
              type: 'warning',
              title: 'Attenzione',
              message: 'Listino salvato ma errore nell\'assegnazione del cliente',
            });
          } else {
            setSelectedCustomerId(customer_id);
          }
        } else if (!customer_id && selectedCustomerId) {
          // Remove customer assignment
          await supabase
            .from('customers')
            .update({ price_list_id: null })
            .eq('id', selectedCustomerId);
          setSelectedCustomerId('');
        }

        // Refresh the price list data
        await fetchPriceListDetails(currentPriceList.id);
      } else {
        // Create new price list
        const { data: newPriceList, error } = await supabase
          .from('price_lists')
          .insert([finalPriceListData])
          .select()
          .single();

        if (error) throw error;

        // Handle customer assignment for new price list
        if (customer_id) {
          const { error: customerError } = await supabase
            .from('customers')
            .update({ price_list_id: newPriceList.id })
            .eq('id', customer_id);

          if (customerError) {
            console.error('Error assigning customer to new price list:', customerError);
            addNotification({
              type: 'warning',
              title: 'Attenzione',
              message: 'Listino creato ma errore nell\'assegnazione del cliente',
            });
          } else {
            setSelectedCustomerId(customer_id);
          }
        }

        addNotification({
          type: 'success',
          title: 'Listino creato',
          message: `${data.name} è stato creato con successo`,
        });

        // Set the current price list to enable product management
        setCurrentPriceList({
          ...newPriceList,
          price_list_items: [],
        } as PriceListWithItems);

        // Mark as new price list created
        setIsNewPriceListCreated(true);

        // Auto-scroll to products section
        setTimeout(() => {
          productsSectionRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 500);
      }

      // Only call success callback if updating existing price list
      if (currentPriceList && !isNewPriceListCreated) {
        onSaveSuccess();
      }
    } catch (error: any) {
      console.error('Error saving price list:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: error.message || 'Errore durante il salvataggio del listino',
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo prodotto dal listino?')) return;

    try {
      const { error } = await supabase
        .from('price_list_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      addNotification({
        type: 'success',
        title: 'Prodotto rimosso',
        message: 'Il prodotto è stato rimosso dal listino',
      });

      // Refresh the price list data
      if (currentPriceList) {
        await fetchPriceListDetails(currentPriceList.id);
      }
    } catch (error: any) {
      console.error('Error deleting price list item:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Errore durante la rimozione del prodotto',
      });
    }
  };


  const handleClose = () => {
    reset();
    setCurrentPriceList(null);
    setSelectedCustomerId('');
    setIsNewPriceListCreated(false);
    onClose();
  };


  const handleCustomerChange = (customerId: string) => {
    setValue('customer_id', customerId);
    setSelectedCustomerId(customerId);
    
    // Find and set the selected customer object
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customer || null);
  };

  const handleCustomerSelect = (customer: Customer) => {
    handleCustomerChange(customer.id);
    setShowCustomerModal(false);
  };


  const handleOpenCustomerModal = () => {
    setShowCustomerModal(true);
  };

  const handleSendEmail = () => {
    if (!currentPriceList || !currentPriceList.customer) {
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Cliente non selezionato per il listino'
      });
      return;
    }

    if (!currentPriceList.customer.email) {
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Email del cliente non disponibile'
      });
      return;
    }

    const subject = encodeURIComponent(`Listino Prezzi - ${currentPriceList.name}`);
    const body = encodeURIComponent(`
Gentile ${currentPriceList.customer.contact_person || 'Cliente'},

In allegato il listino prezzi "${currentPriceList.name}" valido dal ${new Date(currentPriceList.valid_from).toLocaleDateString('it-IT')}${currentPriceList.valid_until ? ` al ${new Date(currentPriceList.valid_until).toLocaleDateString('it-IT')}` : ''}.

Cordiali saluti,
Il Team
    `);

    const mailtoLink = `mailto:${currentPriceList.customer.email}?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');

    addNotification({
      type: 'success',
      title: 'Email aperta',
      message: `Client email aperta per ${currentPriceList.customer.email}`
    });
  };



  const handlePriceChange = async (itemId: string, newPrice: number) => {
    try {
      const { error } = await supabase
        .from('price_list_items')
        .update({ price: newPrice })
        .eq('id', itemId);

      if (error) throw error;

      // Aggiorna lo stato locale
      if (currentPriceList) {
        const updatedItems = currentPriceList.price_list_items.map(item =>
          item.id === itemId ? { ...item, price: newPrice } : item
        );
        setCurrentPriceList({ ...currentPriceList, price_list_items: updatedItems });
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento del prezzo:', error);
      addNotification('Errore nell\'aggiornamento del prezzo', 'error');
    }
  };

  const handleMOQChange = async (itemId: string, newMOQ: number) => {
    try {
      const { error } = await supabase
        .from('price_list_items')
        .update({ min_quantity: newMOQ })
        .eq('id', itemId);

      if (error) throw error;

      // Aggiorna lo stato locale
      if (currentPriceList) {
        const updatedItems = currentPriceList.price_list_items.map(item =>
          item.id === itemId ? { ...item, min_quantity: newMOQ } : item
        );
        setCurrentPriceList({ ...currentPriceList, price_list_items: updatedItems });
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento del MOQ:', error);
      addNotification('Errore nell\'aggiornamento del MOQ', 'error');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[98vw] h-[98vh] max-w-none max-h-none overflow-hidden p-2">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <DialogTitle>
                {priceListId ? 'Modifica Listino' : 'Nuovo Listino'}
              </DialogTitle>
              {currentPriceList && (
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSendEmail}
                    className="h-7 text-xs px-3 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                    title="Invia listino via email"
                  >
                    <Mail className="w-3 h-3 mr-1" />
                    Invia Mail
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Informazioni Listino Section - Immediatamente sotto i pulsanti */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 mx-1 mt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-red-600" />
                  <h3 className="text-sm font-semibold text-red-800">Informazioni Listino</h3>
                </div>
                <Button
                  type="button"
                  onClick={() => setShowProductModal(true)}
                  className="h-7 text-xs px-3 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Inserisci Prodotti
                </Button>
              </div>
              
              <form onSubmit={handleSubmit(handleMainFormSubmit)} className="mt-2">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <div>
                    <Label htmlFor="name" className="text-xs font-medium text-gray-700">
                      Nome Listino *
                    </Label>
                    <Input
                      id="name"
                      {...register('name')}
                      className={`h-6 text-xs ${errors.name ? 'border-red-500' : ''}`}
                      placeholder="es. Listino 2024"
                    />
                    {errors.name && (
                      <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-700">Cliente *</Label>
                    <div className="flex items-center space-x-1">
                        {selectedCustomer ? (
                        <div className="flex items-center space-x-1 bg-white border rounded px-1 py-0.5 h-6 flex-1">
                          <Building className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-700 truncate">
                                {selectedCustomer.company_name}
                          </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(null);
                            setSelectedCustomerId('');
                            setValue('customer_id', '');
                          }}
                            className="h-3 w-3 p-0 hover:bg-gray-100"
                          >
                            <X className="h-2 w-2" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleOpenCustomerModal}
                          className={`h-6 text-xs flex-1 justify-start px-1 ${errors.customer_id ? 'border-red-500' : ''}`}
                        >
                          <Building className="w-3 h-3 mr-1" />
                          Cliente
                        </Button>
                      )}
                    </div>
                    {errors.customer_id && (
                      <p className="text-xs text-red-600 mt-1">{errors.customer_id.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="valid_from" className="text-xs font-medium text-gray-700">
                      Valido dal
                    </Label>
                    <Input
                      id="valid_from"
                      type="text"
                      placeholder="dd/mm/yyyy"
                      {...register('valid_from')}
                      className={`h-6 text-xs ${errors.valid_from ? 'border-red-500' : ''}`}
                    />
                    {errors.valid_from && (
                      <p className="text-xs text-red-600 mt-1">{errors.valid_from.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="valid_until" className="text-xs font-medium text-gray-700">
                      Valido fino al
                    </Label>
                    <Input
                      id="valid_until"
                      type="text"
                      placeholder="dd/mm/yyyy"
                      {...register('valid_until')}
                      className="h-6 text-xs"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-6 text-xs px-3 bg-green-600 hover:bg-green-700"
                    >
                    {isSubmitting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        currentPriceList ? 'Aggiorna' : 'Salva'
                    )}
                  </Button>
                  </div>
                </div>
              </form>
            </div>

            {/* Prodotti nel Listino Section - Espansa per riempire tutto lo spazio */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mx-1 mt-1 mb-0 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-800">
                    Prodotti nel Listino ({currentPriceList?.price_list_items?.length || 0})
                  </h3>
                </div>
                <Button
                  type="button"
                  onClick={() => setShowProductModal(true)}
                  className="h-7 text-xs px-3 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Aggiungi Prodotti
                </Button>
              </div>

              {!currentPriceList ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <p className="text-sm text-green-700">
                    Salva prima le informazioni del listino per gestire i prodotti
                  </p>
                </div>
              ) : currentPriceList.price_list_items && currentPriceList.price_list_items.length > 0 ? (
              <div className="space-y-1">
                  {currentPriceList.price_list_items.map((item) => (
                    <div key={item.id} className="bg-white border border-green-200 rounded p-2">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-4 gap-3 items-center">
                        <div className="flex items-center space-x-2">
                          {item.products.photo_url && (
                            <img 
                              src={item.products.photo_url} 
                              alt={item.products.name}
                              className="w-8 h-8 object-cover rounded border"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 text-xs">{item.products.name}</p>
                            <p className="text-xs text-gray-500">{item.products.code}</p>
                          </div>
                        </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-600">Prezzo:</span>
                            <div className="relative">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.price}
                                onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
                                className="h-5 text-xs w-16 pr-4 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">€</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-600">MOQ:</span>
                            <Input
                              type="number"
                              min="1"
                              value={item.min_quantity}
                              onChange={(e) => handleMOQChange(item.id, parseInt(e.target.value) || 1)}
                              className="h-5 text-xs w-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-xs text-gray-500">{item.products.unit}</span>
                          </div>
                        <div className="text-xs">
                          {item.discount_percentage > 0 && (
                              <div>
                                <span className="text-gray-600">Sconto:</span>
                                <div className="font-medium text-green-600">{item.discount_percentage}%</div>
                              </div>
                          )}
                        </div>
                      </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            className="h-5 text-xs px-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <p className="text-sm text-green-700 mb-4">
                    Nessun prodotto in questo listino
                  </p>
                  <p className="text-xs text-green-600">
                    Clicca "Aggiungi Prodotti" per iniziare
                  </p>
              </div>
              )}
            </div>
          </div>
        )}

        {/* Pulsanti in basso a destra - Footer minimo */}
        <div className="flex justify-end gap-2 border-t bg-gray-50">
          <Button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="h-7 text-xs px-4 bg-blue-600 hover:bg-blue-700 text-white m-0.5"
            disabled={!priceListId}
          >
            <Eye className="w-3 h-3 mr-1" />
            Anteprima
          </Button>
          <Button
            type="button"
            onClick={handleClose}
            className="h-7 text-xs px-4 bg-green-600 hover:bg-green-700 text-white m-0.5"
          >
            Salva e Chiudi
          </Button>
        </div>
      </DialogContent>
      
      {/* Customer Selection Modal */}
      <CustomerSelectionModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onCustomerSelect={handleCustomerSelect}
        selectedCustomerId={selectedCustomerId}
        title="Seleziona Cliente per Listino"
        description="Scegli il cliente a cui assegnare questo listino prezzi"
      />

      {/* Product Selection Modal */}
      {currentPriceList && (
        <ProductSelectionModal
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          onProductSelect={() => {}} // Non usato in questa implementazione
          priceListId={currentPriceList.id}
          currentCustomer={currentPriceList.customer}
        />
      )}

      {/* Price List Preview Modal */}
      <PriceListPrintView
        isOpen={showPreviewModal && !!priceListId}
        onClose={() => setShowPreviewModal(false)}
        priceListId={priceListId || ''}
      />

    </Dialog>
  );
}
export default PriceListDetailPage;
