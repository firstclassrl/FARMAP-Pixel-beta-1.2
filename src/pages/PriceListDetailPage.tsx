import React, { useState, useEffect, useRef } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/exportUtils';
import { Loader2, FileText, Package, Plus, Edit, Trash2, X, Building, Check } from 'lucide-react';
import type { Database } from '../types/database.types';
import { CustomerSelectionModal } from '../components/CustomerSelectionModal';
import ProductSelectionModal from '../components/ProductSelectionModal';

type PriceList = Database['public']['Tables']['price_lists']['Row'];
type PriceListInsert = Database['public']['Tables']['price_lists']['Insert'];
type PriceListItem = Database['public']['Tables']['price_list_items']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

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
  name: z.string().min(2, 'Nome listino richiesto'),
  description: z.string().optional(),
  customer_id: z.string().optional(),
  valid_from: z.string().min(1, 'Data inizio validità richiesta'),
  valid_until: z.string().optional(),
  currency: z.string().default('EUR'),
  is_default: z.boolean().default(false),
});

const priceListItemSchema = z.object({
  product_id: z.string().min(1, 'Prodotto richiesto'),
  price: z.number().min(0.01, 'Prezzo deve essere maggiore di 0'),
  discount_percentage: z.number().min(0).max(100).default(0),
  min_quantity: z.number().min(1).default(1),
});

type PriceListFormData = z.infer<typeof priceListSchema>;
type PriceListItemFormData = z.infer<typeof priceListItemSchema>;

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
  const [isItemSubmitting, setIsItemSubmitting] = useState(false);
  const [currentPriceList, setCurrentPriceList] = useState<PriceListWithItems | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isNewPriceListCreated, setIsNewPriceListCreated] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Main form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PriceListFormData>({
    resolver: zodResolver(priceListSchema),
    defaultValues: {
      currency: 'EUR',
      is_default: false,
      valid_from: new Date().toISOString().split('T')[0],
    },
  });

  // Item form
  const {
    register: registerItem,
    handleSubmit: handleSubmitItem,
    formState: { errors: itemErrors },
    reset: resetItem,
    setValue: setItemValue,
    watch: watchItem,
  } = useForm<PriceListItemFormData>({
    resolver: zodResolver(priceListItemSchema),
    defaultValues: {
      discount_percentage: 0,
      min_quantity: 1,
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

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, code, name, category, unit, base_price')
        .eq('is_active', true)
        .order('name');

      if (productsError) throw productsError;

      setCustomers(customersData || []);
      setProducts(productsData || []);

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

      // Pre-fill form
      reset({
        name: data.name,
        description: data.description || '',
        valid_from: data.valid_from,
        valid_until: data.valid_until || '',
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
      
      const finalPriceListData = {
        ...priceListData,
        description: data.description || null,
        valid_until: data.valid_until || null,
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

        // Auto-scroll to products section and show add product form
        setTimeout(() => {
          productsSectionRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
          setShowItemForm(true);
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

  const handleItemFormSubmit = async (data: PriceListItemFormData) => {
    if (!currentPriceList) return;

    setIsItemSubmitting(true);
    try {
      if (editingItemId) {
        // Update existing item
        const { error } = await supabase
          .from('price_list_items')
          .update({
            price: data.price,
            discount_percentage: data.discount_percentage || 0,
            min_quantity: data.min_quantity || 1,
          })
          .eq('id', editingItemId);

        if (error) throw error;

        addNotification({
          type: 'success',
          title: 'Prodotto aggiornato',
          message: 'Il prodotto è stato aggiornato nel listino',
        });
      } else {
        // Check if product already exists in the price list
        const existingItem = currentPriceList.price_list_items?.find(
          item => item.product_id === data.product_id
        );

        if (existingItem) {
          // Update existing item instead of creating new one
          const { error } = await supabase
            .from('price_list_items')
            .update({
              price: data.price,
              discount_percentage: data.discount_percentage || 0,
              min_quantity: data.min_quantity || 1,
            })
            .eq('id', existingItem.id);

          if (error) throw error;

          addNotification({
            type: 'success',
            title: 'Prodotto aggiornato',
            message: 'Il prodotto esistente è stato aggiornato nel listino',
          });
        } else {
        // Create new item
        const { error } = await supabase
          .from('price_list_items')
          .insert({
            price_list_id: currentPriceList.id,
            product_id: data.product_id,
            price: data.price,
            discount_percentage: data.discount_percentage || 0,
            min_quantity: data.min_quantity || 1,
          });

        if (error) throw error;

        addNotification({
          type: 'success',
          title: 'Prodotto aggiunto',
          message: 'Il prodotto è stato aggiunto al listino',
        });
        }
      }

      // Refresh the price list data
      await fetchPriceListDetails(currentPriceList.id);
      resetItem();
      setEditingItemId(null);
      setShowItemForm(false);
    } catch (error: any) {
      console.error('Error saving price list item:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: error.message || 'Errore durante il salvataggio del prodotto',
      });
    } finally {
      setIsItemSubmitting(false);
    }
  };

  const handleEditItem = (item: PriceListItem & { products: Product }) => {
    setItemValue('product_id', item.product_id);
    setItemValue('price', item.price);
    setItemValue('discount_percentage', item.discount_percentage);
    setItemValue('min_quantity', item.min_quantity);
    setEditingItemId(item.id);
    setShowItemForm(true);
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

  const handleAddProduct = () => {
    if (!currentPriceList) {
      addNotification({
        type: 'warning',
        title: 'Attenzione',
        message: 'Salva prima le informazioni del listino per poter aggiungere prodotti',
      });
      return;
    }
    resetItem();
    setEditingItemId(null);
    setShowItemForm(true);
  };

  const handleClose = () => {
    reset();
    resetItem();
    setEditingItemId(null);
    setShowItemForm(false);
    setCurrentPriceList(null);
    setSelectedCustomerId('');
    setIsNewPriceListCreated(false);
    onClose();
  };

  const handleCancelItemForm = () => {
    resetItem();
    setEditingItemId(null);
    setShowItemForm(false);
  };

  const handleFinishPriceList = () => {
    if (!currentPriceList) return;
    
    if (currentPriceList.price_list_items.length === 0) {
      addNotification({
        type: 'warning',
        title: 'Attenzione',
        message: 'Aggiungi almeno un prodotto al listino prima di completare',
      });
      return;
    }

    addNotification({
      type: 'success',
      title: 'Listino completato',
      message: `Il listino "${currentPriceList.name}" è stato creato con successo con ${currentPriceList.price_list_items.length} prodotti`,
    });

    // Call success callback and close
    onSaveSuccess();
    handleClose();
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
      <DialogContent className="w-[98vw] h-[98vh] max-w-none max-h-none overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {priceListId ? 'Modifica Listino' : 'Nuovo Listino'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="h-full overflow-y-auto space-y-6 p-1">
            {/* Informazioni Listino Section */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-2">
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
                      Valido dal *
                    </Label>
                    <Input
                      id="valid_from"
                      type="date"
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
                      type="date"
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

            {/* Prodotti nel Listino Section - CON VISUALIZZAZIONE */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
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
              <div className="space-y-2">
                  {currentPriceList.price_list_items.map((item) => (
                    <div key={item.id} className="bg-white border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                        <div>
                            <p className="font-medium text-gray-900 text-sm">{item.products.name}</p>
                          <p className="text-xs text-gray-500">{item.products.code}</p>
                        </div>
                          <div className="text-sm">
                            <span className="text-gray-600">Prezzo:</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.price}
                              onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
                              className="h-6 text-xs w-20 mt-1"
                            />
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600">MOQ:</span>
                            <Input
                              type="number"
                              min="1"
                              value={item.min_quantity}
                              onChange={(e) => handleMOQChange(item.id, parseInt(e.target.value) || 1)}
                              className="h-6 text-xs w-16 mt-1"
                            />
                            <span className="text-xs text-gray-500 ml-1">{item.products.unit}</span>
                          </div>
                        <div className="text-sm">
                          {item.discount_percentage > 0 && (
                              <div>
                                <span className="text-gray-600">Sconto:</span>
                                <div className="font-medium text-green-600">{item.discount_percentage}%</div>
                              </div>
                          )}
                        </div>
                      </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            className="h-6 text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
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

    </Dialog>
  );
}
export default PriceListDetailPage;
