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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
          <div className="space-y-6">
            {/* Informazioni Listino Section */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold text-red-800">Informazioni Listino</h3>
              </div>
              
              <form onSubmit={handleSubmit(handleMainFormSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome Listino *</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="customer_id">Cliente *</Label>
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleOpenCustomerModal}
                        className={`w-full justify-start h-auto p-3 ${errors.customer_id ? 'border-red-500' : ''}`}
                      >
                        {selectedCustomer ? (
                          <div className="flex items-center space-x-3 w-full">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                              <Building className="w-4 h-4 text-primary-600" />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium text-gray-900">
                                {selectedCustomer.company_name}
                              </div>
                              {selectedCustomer.contact_person && (
                                <div className="text-xs text-gray-500">
                                  {selectedCustomer.contact_person}
                                </div>
                              )}
                              {selectedCustomer.city && (
                                <div className="text-xs text-gray-500">
                                  {selectedCustomer.city}, {selectedCustomer.province}
                                </div>
                              )}
                            </div>
                            <Check className="w-4 h-4 text-primary-600" />
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-gray-500">
                            <Building className="w-4 h-4" />
                            <span>Clicca per selezionare un cliente</span>
                          </div>
                        )}
                      </Button>
                      
                      {selectedCustomer && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(null);
                            setSelectedCustomerId('');
                            setValue('customer_id', '');
                          }}
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Rimuovi cliente assegnato
                        </Button>
                      )}
                    </div>
                    {errors.customer_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.customer_id.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="currency">Valuta</Label>
                    <Select onValueChange={(value) => setValue('currency', value)} defaultValue="EUR">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-1">
                    <Label htmlFor="valid_from">Valido dal *</Label>
                    <Input
                      id="valid_from"
                      type="date"
                      {...register('valid_from')}
                      className={errors.valid_from ? 'border-red-500' : ''}
                    />
                    {errors.valid_from && (
                      <p className="mt-1 text-sm text-red-600">{errors.valid_from.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="valid_until">Valido fino al</Label>
                    <Input
                      id="valid_until"
                      type="date"
                      {...register('valid_until')}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="description">Descrizione</Label>
                    <textarea
                      id="description"
                      {...register('description')}
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Descrizione del listino..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-2">
                      <input
                        id="is_default"
                        type="checkbox"
                        {...register('is_default')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="is_default">Listino predefinito</Label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvataggio...
                      </>
                    ) : (
                      currentPriceList ? 'Aggiorna Listino' : 'Salva Dettagli Listino'
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Prodotti nel Listino Section - SEMPRE VISIBILE */}
            <div ref={productsSectionRef} className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-red-800">
                    Prodotti nel Listino {currentPriceList?.customer ? `per ${currentPriceList.customer.company_name}` : ''}
                  </h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddProduct}
                  className="flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Aggiungi Prodotto</span>
                </Button>
              </div>

              {/* Messaggio informativo se il listino non è ancora salvato */}
              {!currentPriceList && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Nota:</strong> Salva prima le informazioni del listino per poter aggiungere i prodotti.
                  </p>
                </div>
              )}

              {/* Lista prodotti */}
              <div className="space-y-2">
                {currentPriceList?.price_list_items?.length === 0 && (
                  <div className="text-center py-8 text-gray-500 bg-white border rounded-lg">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p>Nessun prodotto in questo listino.</p>
                    <p className="text-sm">Clicca "Aggiungi Prodotto" per iniziare.</p>
                  </div>
                )}

                {currentPriceList?.price_list_items?.map((item) => (
                  <div key={item.id} className="bg-white border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                        <div>
                          <p className="font-medium text-gray-900">{item.products.name}</p>
                          <p className="text-xs text-gray-500">{item.products.code}</p>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {item.products.category || 'Categoria'}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Prezzo:</span>
                          <div className="font-medium">{formatCurrency(item.price)}</div>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">MOQ:</span>
                          <div className="font-medium">{item.min_quantity} {item.products.unit}</div>
                        </div>
                        <div className="text-sm">
                          {item.discount_percentage > 0 && (
                            <span className="text-red-600 text-xs">Sconto {item.discount_percentage}%</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditItem(item)}
                          className="h-8 w-8"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItem(item.id)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Aggiungi/Modifica Prodotto */}
            {showItemForm && (
              <div className="bg-gray-50 border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium">
                    {editingItemId ? 'Modifica Prodotto' : 'Aggiungi Nuovo Prodotto'}
                  </h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCancelItemForm}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <form onSubmit={handleSubmitItem(handleItemFormSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="product_id">Prodotto *</Label>
                      <Select
                        value={watchItem('product_id') || ''}
                        onValueChange={(value) => setItemValue('product_id', value)}
                        disabled={!!editingItemId}
                      >
                        <SelectTrigger className={itemErrors.product_id ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Seleziona prodotto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.code} - {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {itemErrors.product_id && (
                        <p className="mt-1 text-sm text-red-600">{itemErrors.product_id.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="price">Prezzo (€) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        {...registerItem('price', { valueAsNumber: true })}
                        className={itemErrors.price ? 'border-red-500' : ''}
                      />
                      {itemErrors.price && (
                        <p className="mt-1 text-sm text-red-600">{itemErrors.price.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="min_quantity">MOQ</Label>
                      <Input
                        id="min_quantity"
                        type="number"
                        min="1"
                        {...registerItem('min_quantity', { valueAsNumber: true })}
                        className={itemErrors.min_quantity ? 'border-red-500' : ''}
                      />
                      {itemErrors.min_quantity && (
                        <p className="mt-1 text-sm text-red-600">{itemErrors.min_quantity.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="discount_percentage">Sconto (%)</Label>
                      <Input
                        id="discount_percentage"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        {...registerItem('discount_percentage', { valueAsNumber: true })}
                        className={itemErrors.discount_percentage ? 'border-red-500' : ''}
                      />
                      {itemErrors.discount_percentage && (
                        <p className="mt-1 text-sm text-red-600">{itemErrors.discount_percentage.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCancelItemForm}
                    >
                      Annulla
                    </Button>
                    <Button type="submit" disabled={isItemSubmitting}>
                      {isItemSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvataggio...
                        </>
                      ) : (
                        editingItemId ? 'Aggiorna Prodotto' : 'Aggiungi Prodotto'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Footer con pulsante Chiudi */}
            <div className="flex justify-end pt-4 border-t">
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleClose}>
                  Annulla
                </Button>
                {(currentPriceList || isNewPriceListCreated) && (
                  <Button onClick={handleFinishPriceList}>
                    Fatto
                  </Button>
                )}
              </div>
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
    </Dialog>
  );
}
export default PriceListDetailPage;