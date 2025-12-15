import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Loader2, FileText, Package, Plus, Trash2, X, Building, Eye, ArrowUp, ArrowDown } from 'lucide-react';
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

type PriceListItemWithProduct = PriceListWithItems['price_list_items'][number];

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
  print_conditions: z.boolean().default(true),
  payment_conditions: z.string().optional(),
  shipping_conditions: z.string().optional(),
  delivery_conditions: z.string().optional(),
  brand_conditions: z.string().optional(),
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
  const [sortField, setSortField] = useState<'code' | 'name'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [printByCategory, setPrintByCategory] = useState(false);
  const [pendingMOQValues, setPendingMOQValues] = useState<Record<string, string>>({});
  const [pendingPriceValues, setPendingPriceValues] = useState<Record<string, string>>({});
  const conditionsSaveTimerRef = useRef<number | null>(null);

  const scheduleSaveConditions = (immediate = false, targetPriceListId?: string) => {
    const priceListId = targetPriceListId || currentPriceList?.id;
    if (!priceListId) return;
    if (conditionsSaveTimerRef.current) {
      window.clearTimeout(conditionsSaveTimerRef.current);
      conditionsSaveTimerRef.current = null;
    }
    const run = async () => {
      try {
        const values = getValues();
        const { error } = await supabase
          .from('price_lists')
          .update({
            payment_conditions: values.payment_conditions || null,
            shipping_conditions: values.shipping_conditions || null,
            delivery_conditions: values.delivery_conditions || null,
            brand_conditions: values.brand_conditions || null,
            print_conditions: values.print_conditions ?? true,
          })
          .eq('id', priceListId);
        if (error) {
          // Fallback: se la colonna non esiste ancora, riprova senza print_conditions
          if (
            (error as any)?.code === 'PGRST204' ||
            String((error as any)?.message || '').includes("Could not find the 'print_conditions' column")
          ) {
            const { error: retryError } = await supabase
              .from('price_lists')
              .update({
                payment_conditions: values.payment_conditions || null,
                shipping_conditions: values.shipping_conditions || null,
                delivery_conditions: values.delivery_conditions || null,
                brand_conditions: values.brand_conditions || null,
              })
              .eq('id', priceListId);
            if (retryError) throw retryError;
          } else {
            throw error;
          }
        }
      } catch (e) {
        console.error('Errore salvataggio condizioni:', e);
      }
    };
    if (immediate) {
      void run();
    } else {
      conditionsSaveTimerRef.current = window.setTimeout(run, 600);
    }
  };

  const applyCustomerPaymentTerms = (
    customer: Customer | null | undefined,
    persistImmediately = true,
    targetPriceListId?: string
  ) => {
    if (!customer) return;
    const paymentTerms = customer.payment_terms || '';
    setValue('payment_conditions', paymentTerms);
    if (persistImmediately) {
      scheduleSaveConditions(true, targetPriceListId);
    }
  };

  // Main form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues,
  } = useForm<PriceListFormData>({
    resolver: zodResolver(priceListSchema),
    defaultValues: {
      currency: 'EUR',
      is_default: false,
      print_conditions: true,
    },
  });


  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, company_name, contact_person, payment_terms, email')
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
            products (id, code, name, category, unit, base_price, cartone, pallet, scadenza)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const priceList = data as PriceListWithItems;

      // Find customer associated with this price list via price_lists.customer_id
      let customerData: Customer | null = null;
      if ((priceList as any).customer_id) {
        const { data: c } = await supabase
          .from('customers')
          .select('*')
          .eq('id', (priceList as any).customer_id)
          .maybeSingle();
        customerData = c || null;
      }

      setCurrentPriceList({
        ...priceList,
        customer: customerData || undefined,
      } as PriceListWithItems);

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
        name: priceList.name,
        description: priceList.description || '',
        valid_from: convertDateToItalian(priceList.valid_from),
        valid_until: convertDateToItalian(priceList.valid_until),
        currency: priceList.currency,
        is_default: priceList.is_default,
        print_conditions: (priceList as any).print_conditions ?? true,
        customer_id: customerData?.id || '',
        payment_conditions: priceList.payment_conditions || '',
        shipping_conditions: priceList.shipping_conditions || '',
        delivery_conditions: priceList.delivery_conditions || '',
        brand_conditions: priceList.brand_conditions || '',
      });

      const resolvedCustomerId = customerData?.id || '';
      setSelectedCustomerId(resolvedCustomerId);
      setSelectedCustomer(customerData || null);

      if ((!data.payment_conditions || data.payment_conditions.trim() === '') && customerData?.payment_terms) {
        setValue('payment_conditions', customerData.payment_terms);
        scheduleSaveConditions(true, data.id);
      }
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
      // Prevenire lo scroll del body quando la modale è aperta
      document.body.style.overflow = 'hidden';
    } else {
      // Ripristinare lo scroll del body quando la modale è chiusa
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup quando il componente viene smontato
    return () => {
      document.body.style.overflow = 'unset';
    };
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
      // ID cliente che vogliamo associare dopo il salvataggio
      const effectiveCustomerId = customer_id || selectedCustomerId || '';
      
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

      const sanitizedPriceListData = {
        ...priceListData,
        description: data.description || null,
        valid_from: convertDateToISO(data.valid_from),
        valid_until: convertDateToISO(data.valid_until),
        print_conditions: data.print_conditions ?? true,
        payment_conditions: data.payment_conditions || null,
        shipping_conditions: data.shipping_conditions || null,
        delivery_conditions: data.delivery_conditions || null,
        brand_conditions: data.brand_conditions || null,
        customer_id: effectiveCustomerId || null,
      };

      if (currentPriceList) {
        // Update existing price list
        const { error } = await supabase
          .from('price_lists')
          .update(sanitizedPriceListData)
          .eq('id', currentPriceList.id);

        if (error) {
          // Fallback se la colonna non esiste ancora: riprova senza print_conditions
          if (
            (error as any)?.code === 'PGRST204' ||
            String((error as any)?.message || '').includes("Could not find the 'print_conditions' column")
          ) {
            const { print_conditions, ...fallbackData } = sanitizedPriceListData as any;
            const { error: retryError } = await supabase
              .from('price_lists')
              .update(fallbackData)
              .eq('id', currentPriceList.id);
            if (retryError) throw retryError;
          } else {
            throw error;
          }
        }

        addNotification({
          type: 'success',
          title: 'Listino aggiornato',
          message: `${data.name} è stato aggiornato con successo`,
        });

        // Gestione associazione cliente <-> listino
        // Ora è tutta gestita tramite la colonna price_lists.customer_id,
        // quindi qui ci limitiamo ad aggiornare lo stato locale in base a effectiveCustomerId
        console.log('🔗 effectiveCustomerId (saved in price_lists.customer_id):', effectiveCustomerId);

        if (effectiveCustomerId) {
          setSelectedCustomerId(effectiveCustomerId);
          setSelectedCustomer(
            customers.find(c => c.id === effectiveCustomerId) || null
          );
        } else {
          setSelectedCustomerId('');
          setSelectedCustomer(null);
        }

        // Refresh the price list data
        await fetchPriceListDetails(currentPriceList.id);

        // Call success callback when updating existing price list
        onSaveSuccess();
      } else {
        // Create new price list
        const newPriceListPayload = {
          ...sanitizedPriceListData,
          created_by: user.id
        };

        let insertResult = await supabase
          .from('price_lists')
          .insert([newPriceListPayload])
          .select()
          .single();

        if (insertResult.error) {
          // Fallback se la colonna non esiste: riprova senza print_conditions
          const err = insertResult.error as any;
          if (
            err?.code === 'PGRST204' ||
            String(err?.message || '').includes("Could not find the 'print_conditions' column")
          ) {
            const { print_conditions, ...fallbackPayload } = newPriceListPayload as any;
            insertResult = await supabase
              .from('price_lists')
              .insert([fallbackPayload])
              .select()
              .single();
            if (insertResult.error) throw insertResult.error;
          } else {
            throw insertResult.error;
          }
        }
        const newPriceList = insertResult.data!;

        // Handle customer assignment for new price list:
        // impostiamo direttamente customer_id sul nuovo listino
        if (effectiveCustomerId) {
          const { error: customerError } = await supabase
            .from('price_lists')
            .update({ customer_id: effectiveCustomerId })
            .eq('id', newPriceList.id);

          if (customerError) {
            console.error('Error assigning customer to new price list:', customerError);
            addNotification({
              type: 'warning',
              title: 'Attenzione',
              message: 'Listino creato ma errore nell\'assegnazione del cliente',
            });
          } else {
            setSelectedCustomerId(effectiveCustomerId);
            setSelectedCustomer(
              customers.find(c => c.id === effectiveCustomerId) || null
            );
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

        // Call success callback to refresh the list when creating a new price list
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

  const handleSaveAndClose = async () => {
    try {
      // Usa handleSubmit per validare e salvare i dati del form
      await handleSubmit(handleMainFormSubmit)();

      // Dopo aver salvato il listino, salva anche i campi prodotto (cartone, pallet, scadenza)
      if (currentPriceList?.price_list_items?.length) {
        // Raggruppa per prodotto per evitare update duplicati
        const productUpdatesMap = new Map<
          string,
          { cartone: string | null; pallet: string | null; scadenza: string | null }
        >();

        currentPriceList.price_list_items.forEach((item) => {
          const product = item.products;
          if (!product?.id) return;

          productUpdatesMap.set(product.id, {
            cartone: (product as any).cartone ?? null,
            pallet: (product as any).pallet ?? null,
            scadenza: (product as any).scadenza ?? null,
          });
        });

        for (const [productId, fields] of productUpdatesMap.entries()) {
          const { error } = await supabase
            .from('products')
            .update(fields)
            .eq('id', productId);

          if (error) {
            console.error('Errore nel salvataggio dei campi prodotto:', error);
            addNotification({
              type: 'error',
              title: 'Errore',
              message: 'Errore nel salvataggio dei dati prodotto (cartone/pedana/scadenza)',
            });
            // Non rilanciamo l'errore: continuiamo a chiudere la modale per non bloccare l’utente
          }
        }
      }
      
      // Se arriviamo qui, il salvataggio è andato a buon fine
      addNotification({
        type: 'success',
        title: 'Listino salvato',
        message: 'Le modifiche sono state salvate con successo'
      });

      // Chiudi la modale
      handleClose();
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Errore nel salvataggio delle modifiche'
      });
    }
  };


  const handleCustomerChange = (customerId: string, customerOverride?: Customer | null) => {
    setValue('customer_id', customerId);
    setSelectedCustomerId(customerId);
    
    // Find and set the selected customer object
    const customer = customerOverride || customers.find(c => c.id === customerId) || null;
    setSelectedCustomer(customer);

    if (customer) {
      applyCustomerPaymentTerms(customer, true);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    handleCustomerChange(customer.id, customer);
    setShowCustomerModal(false);
  };


  const handleOpenCustomerModal = () => {
    setShowCustomerModal(true);
  };




  const handlePriceChange = async (itemId: string, newPrice: number) => {
    try {
      // Normalizza sempre a 2 decimali
      const normalizedPrice = Number.isFinite(newPrice)
        ? Number(newPrice.toFixed(2))
        : 0;

      const { error } = await supabase
        .from('price_list_items')
        .update({ price: normalizedPrice })
        .eq('id', itemId);

      if (error) throw error;

      // Aggiorna lo stato locale
      if (currentPriceList) {
        const updatedItems = currentPriceList.price_list_items.map(item =>
          item.id === itemId ? { ...item, price: normalizedPrice } : item
        );
        setCurrentPriceList({ ...currentPriceList, price_list_items: updatedItems });
      }

      // Pulisci il valore temporaneo per questo item
      setPendingPriceValues(prev => {
        if (!(itemId in prev)) return prev;
        const { [itemId]: _removed, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      console.error('Errore nell\'aggiornamento del prezzo:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Errore nell\'aggiornamento del prezzo'
      });
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

      setPendingMOQValues(prev => {
        if (!(itemId in prev)) return prev;
        const { [itemId]: _removed, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      console.error('Errore nell\'aggiornamento del MOQ:', error);
      addNotification('Errore nell\'aggiornamento del MOQ', 'error');
    }
  };

  /**
   * Aggiorna solo lo stato locale dei campi legati al prodotto (cartone, pallet, scadenza).
   * Il salvataggio su database viene eseguito solo quando si clicca su "Salva e Chiudi".
   */
  const handleProductFieldChange = (itemId: string, field: 'cartone' | 'pallet' | 'scadenza', value: string) => {
    if (!currentPriceList) return;

    const updatedItems = currentPriceList.price_list_items.map(i =>
      i.id === itemId
        ? { ...i, products: { ...i.products, [field]: value } }
        : i
    );

    setCurrentPriceList({
      ...currentPriceList,
      price_list_items: updatedItems,
    });
  };

  const renderProductCard = (item: PriceListItemWithProduct) => (
    <div key={item.id} className="bg-white border border-green-200 rounded p-2">
      <div className="flex items-center gap-3 flex-wrap xl:flex-nowrap">
        <div className="flex items-center gap-2 min-w-[220px] flex-1">
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

        {item.discount_percentage > 0 && (
          <div className="text-xs text-green-700 font-semibold min-w-[70px]">
            Sconto {item.discount_percentage}%
          </div>
        )}

        <div className="flex items-center gap-1 min-w-[110px]">
          <span className="text-xs text-gray-600">Prezzo:</span>
          <div className="relative">
            <Input
              type="text"
              inputMode="decimal"
              value={
                pendingPriceValues[item.id] ??
                (item.price !== null && item.price !== undefined
                  ? String(item.price)
                  : '')
              }
              onChange={(e) => {
                const value = e.target.value;
                // permettiamo numeri, virgola, punto e stringa vuota
                if (/^[0-9]*[.,]?[0-9]*$/.test(value) || value === '') {
                  setPendingPriceValues(prev => ({
                    ...prev,
                    [item.id]: value,
                  }));
                }
              }}
              onBlur={async () => {
                const raw =
                  pendingPriceValues[item.id] ??
                  (item.price !== null && item.price !== undefined
                    ? String(item.price)
                    : '');

                if (raw === '') {
                  // campo vuoto: non forziamo a 0, semplicemente ripristiniamo il valore precedente
                  setPendingPriceValues(prev => {
                    if (!(item.id in prev)) return prev;
                    const { [item.id]: _removed, ...rest } = prev;
                    return rest;
                  });
                  return;
                }

                const parsed = parseFloat(raw.replace(',', '.'));
                if (isNaN(parsed)) {
                  // valore non valido: ripristina
                  setPendingPriceValues(prev => {
                    if (!(item.id in prev)) return prev;
                    const { [item.id]: _removed, ...rest } = prev;
                    return rest;
                  });
                  return;
                }

                const normalized = Number(parsed.toFixed(2));
                if (normalized !== Number(item.price ?? 0)) {
                  await handlePriceChange(item.id, normalized);
                } else {
                  // se non è cambiato, pulisci solo il valore temporaneo
                  setPendingPriceValues(prev => {
                    if (!(item.id in prev)) return prev;
                    const { [item.id]: _removed, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              className="h-5 text-xs w-16 pr-4 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-gray-500">€</span>
          </div>
        </div>

        <div className="flex items-center gap-1 min-w-[120px]">
          <span className="text-xs text-gray-600">MOQ:</span>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pendingMOQValues[item.id] ?? (item.min_quantity?.toString() ?? '')}
            onChange={(e) => {
              const { value } = e.target;
              if (/^\d*$/.test(value)) {
                setPendingMOQValues(prev => ({
                  ...prev,
                  [item.id]: value
                }));
              }
            }}
            onBlur={() => {
              const rawValue = pendingMOQValues[item.id] ?? (item.min_quantity?.toString() ?? '');
              const parsedValue = parseInt(rawValue, 10);
              const finalValue = !isNaN(parsedValue) && parsedValue > 0 ? parsedValue : item.min_quantity || 1;
              if (finalValue !== item.min_quantity) {
                handleMOQChange(item.id, finalValue);
              } else if (pendingMOQValues[item.id] !== undefined) {
                setPendingMOQValues(prev => {
                  const { [item.id]: _removed, ...rest } = prev;
                  return rest;
                });
              }
            }}
            className="h-5 text-xs w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-xs text-gray-500">{item.products.unit}</span>
        </div>

        <div className="flex items-center gap-1 min-w-[140px]">
          <span className="text-xs text-gray-600">Cartone:</span>
          <Input
            value={item.products.cartone || ''}
            onChange={(e) => handleProductFieldChange(item.id, 'cartone', e.target.value)}
            className="h-5 text-xs w-24"
          />
        </div>

        <div className="flex items-center gap-1 min-w-[140px]">
          <span className="text-xs text-gray-600">Pedana:</span>
          <Input
            value={item.products.pallet || ''}
            onChange={(e) => handleProductFieldChange(item.id, 'pallet', e.target.value)}
            className="h-5 text-xs w-24"
          />
        </div>

        <div className="flex items-center gap-1 min-w-[150px]">
          <span className="text-xs text-gray-600">Scadenza:</span>
          <Input
            value={item.products.scadenza || ''}
            onChange={(e) => handleProductFieldChange(item.id, 'scadenza', e.target.value)}
            className="h-5 text-xs w-28"
          />
        </div>

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
  );

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'block' : 'hidden'}`}>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      
      {/* Modal Content */}
      <div className="relative w-[95vw] h-[95vh] bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-2 pt-2 pb-1 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold">
              {priceListId ? 'Modifica Listino' : 'Nuovo Listino'}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col px-2 py-1 overflow-hidden min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
            {/* Informazioni Listino Section - Immediatamente sotto i pulsanti */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-1 mt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-red-600" />
                  <h3 className="text-sm font-semibold text-red-800">Informazioni Listino</h3>
                </div>
              </div>
              
              <form onSubmit={handleSubmit(handleMainFormSubmit)} className="mt-1">
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-1 mt-0 mb-0 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-1 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-800">
                    Prodotti nel Listino ({currentPriceList?.price_list_items?.length || 0})
                  </h3>
                </div>
                {currentPriceList && (
                  <Button
                    type="button"
                    onClick={() => setShowProductModal(true)}
                    className="h-7 text-xs px-3 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Aggiungi Prodotti
                  </Button>
                )}
              </div>

              {!currentPriceList ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <p className="text-sm text-green-700">
                    Salva prima le informazioni del listino per gestire i prodotti
                  </p>
                </div>
              ) : currentPriceList.price_list_items && currentPriceList.price_list_items.length > 0 ? (
              <>
              {/* Controlli di ordinamento e filtro categoria */}
              <div className="flex items-center gap-2 mb-2 flex-shrink-0 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-600">Ordina per:</Label>
                  <Select value={sortField} onValueChange={(value: 'code' | 'name') => setSortField(value)}>
                    <SelectTrigger className="h-6 text-xs w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nome</SelectItem>
                      <SelectItem value="code">Codice</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    className="h-6 text-xs px-2"
                    title={sortDirection === 'asc' ? 'Crescente' : 'Decrescente'}
                  >
                    {sortDirection === 'asc' ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-600">Categoria:</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-6 text-xs w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte le categorie</SelectItem>
                      {Array.from(new Set(currentPriceList.price_list_items.map(item => item.products.category).filter(Boolean))).map(category => (
                        <SelectItem key={category} value={category || ''}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="printByCategory"
                    checked={printByCategory}
                    onChange={(e) => setPrintByCategory(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Label htmlFor="printByCategory" className="text-xs text-gray-600 cursor-pointer">
                    Stampa per categorie
                  </Label>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0">
                {(() => {
                  const filteredItems = currentPriceList.price_list_items
                    ? [...currentPriceList.price_list_items].filter(item => {
                        if (selectedCategory === 'all') return true;
                        return item.products.category === selectedCategory;
                      })
                    : [];

                  const sortItems = (items: PriceListItemWithProduct[]) => {
                    return [...items].sort((a, b) => {
                      let comparison = 0;
                      if (sortField === 'code') {
                        comparison = (a.products.code || '').localeCompare(b.products.code || '');
                      } else {
                        comparison = (a.products.name || '').localeCompare(b.products.name || '');
                      }
                      return sortDirection === 'asc' ? comparison : -comparison;
                    });
                  };

                  if (printByCategory) {
                    const groupedByCategory = filteredItems.reduce<Record<string, PriceListItemWithProduct[]>>((acc, item) => {
                      const category = item.products.category || 'Senza categoria';
                      if (!acc[category]) {
                        acc[category] = [];
                      }
                      acc[category].push(item);
                      return acc;
                    }, {});

                    const sortedCategories = Object.keys(groupedByCategory).sort();

                    return sortedCategories.map(category => (
                      <div key={`category-${category}`} className="space-y-1">
                        <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold px-3 py-1 rounded">
                          {category}
                        </div>
                        {sortItems(groupedByCategory[category]).map(item => renderProductCard(item))}
                      </div>
                    ));
                  }

                  return sortItems(filteredItems).map(item => renderProductCard(item));
                })()}
              </div>
              </>
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

            {/* Condizioni di Vendita Section - Arancione */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-1 mt-0 mb-0">
              <div className="flex items-center space-x-2 mb-1">
                <FileText className="w-4 h-4 text-orange-600" />
                <h3 className="text-sm font-semibold text-orange-800">Condizioni di Vendita</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="payment_conditions" className="text-xs font-medium text-gray-700">
                    Pagamento
                  </Label>
                  <Input
                    id="payment_conditions"
                    {...register('payment_conditions', { onChange: () => scheduleSaveConditions(false) })}
                    className="h-6 text-xs"
                    placeholder="es. 30 giorni, Bonifico anticipato"
                    onBlur={() => scheduleSaveConditions(true)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="shipping_conditions" className="text-xs font-medium text-gray-700">
                    Trasporto
                  </Label>
                  <Input
                    id="shipping_conditions"
                    {...register('shipping_conditions', { onChange: () => scheduleSaveConditions(false) })}
                    className="h-6 text-xs"
                    placeholder="es. Franco fabbrica, FOB"
                    onBlur={() => scheduleSaveConditions(true)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="delivery_conditions" className="text-xs font-medium text-gray-700">
                    Tempi di consegna
                  </Label>
                  <Input
                    id="delivery_conditions"
                    {...register('delivery_conditions', { onChange: () => scheduleSaveConditions(false) })}
                    className="h-6 text-xs"
                    placeholder="es. 15 giorni, Su richiesta"
                    onBlur={() => scheduleSaveConditions(true)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="brand_conditions" className="text-xs font-medium text-gray-700">
                    Marchio
                  </Label>
                  <Input
                    id="brand_conditions"
                    {...register('brand_conditions', { onChange: () => scheduleSaveConditions(false) })}
                    className="h-6 text-xs"
                    placeholder="es. Marchio cliente, White label"
                    onBlur={() => scheduleSaveConditions(true)}
                  />
                </div>
              </div>
              
              {/* Flag stampa condizioni */}
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="print_conditions"
                  {...register('print_conditions', { onChange: () => scheduleSaveConditions(true) })}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <Label htmlFor="print_conditions" className="text-xs text-gray-700 cursor-pointer">
                  Stampa condizioni
                </Label>
              </div>
            </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t bg-gray-50 px-2 py-1">
          <Button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="h-7 text-xs px-4 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!priceListId}
          >
            <Eye className="w-3 h-3 mr-1" />
            Anteprima
          </Button>
          <Button
            type="button"
            onClick={handleSaveAndClose}
            className="h-7 text-xs px-4 bg-green-600 hover:bg-green-700 text-white"
          >
            Salva e Chiudi
          </Button>
        </div>
      </div>
      
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
          onProductsAdded={() => fetchPriceListDetails(currentPriceList.id)}
        />
      )}

      {/* Price List Preview Modal */}
      <PriceListPrintView
        isOpen={showPreviewModal && !!priceListId}
        onClose={() => setShowPreviewModal(false)}
        priceListId={priceListId || ''}
        sortField={sortField}
        sortDirection={sortDirection}
        selectedCategory={selectedCategory}
        printByCategory={printByCategory}
      />
    </div>
  );
}
export default PriceListDetailPage;
