import { supabase } from './supabase';
import type { Database } from '../types/database.types';

type PriceList = Database['public']['Tables']['price_lists']['Row'];
type PriceListItem = Database['public']['Tables']['price_list_items']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];

interface PriceListWithDetails extends PriceList {
  customer?: Customer;
  price_list_items: (PriceListItem & {
    products: Product;
  })[];
}

/**
 * Generates a unique order number
 * Format: ORD-YYYYMMDD-XXXX (where XXXX is a sequential number)
 */
export const generateOrderNumber = async (): Promise<string> => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Get the count of orders created today
  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact' })
    .gte('created_at', `${today.toISOString().slice(0, 10)}T00:00:00.000Z`)
    .lt('created_at', `${today.toISOString().slice(0, 10)}T23:59:59.999Z`);

  if (error) {
    console.error('Error getting order count:', error);
    // Fallback to random number if count fails
    const randomNum = Math.floor(Math.random() * 9999) + 1;
    return `ORD-${dateStr}-${randomNum.toString().padStart(4, '0')}`;
  }

  const orderNumber = (count || 0) + 1;
  return `ORD-${dateStr}-${orderNumber.toString().padStart(4, '0')}`;
};

/**
 * Creates a new order from an existing price list
 * @param priceListId - ID of the price list to use
 * @param userId - ID of the user creating the order
 * @returns Promise<string> - ID of the created order
 */
export const createOrderFromPriceList = async (
  priceListId: string,
  userId: string
): Promise<string> => {
  try {
    // 1. Fetch price list with all related data
    const { data: priceListData, error: priceListError } = await supabase
      .from('price_lists')
      .select(`
        *,
        price_list_items (
          *,
          products (*)
        )
      `)
      .eq('id', priceListId)
      .single();

    if (priceListError) {
      throw new Error(`Errore nel caricamento del listino: ${priceListError.message}`);
    }

    if (!priceListData) {
      throw new Error('Listino non trovato');
    }

    // 2. Find customer associated with this price list
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('price_list_id', priceListId)
      .maybeSingle();

    if (customerError) {
      throw new Error(`Errore nel caricamento del cliente: ${customerError.message}`);
    }

    if (!customerData) {
      throw new Error('Nessun cliente associato a questo listino');
    }

    // 3. Validate price list has items
    if (!priceListData.price_list_items || priceListData.price_list_items.length === 0) {
      throw new Error('Il listino selezionato non contiene prodotti');
    }

    // 4. Calculate order totals
    let subtotal = 0;
    let totalDiscount = 0;

    const orderItems = priceListData.price_list_items.map((item: any) => {
      const itemSubtotal = item.price * item.min_quantity;
      const itemDiscount = (itemSubtotal * item.discount_percentage) / 100;
      const itemTotal = itemSubtotal - itemDiscount;

      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;

      return {
        product_id: item.product_id,
        quantity: item.min_quantity,
        unit_price: item.price,
        discount_percentage: item.discount_percentage,
        total_price: itemTotal,
        notes: `Generato da listino: ${priceListData.name}`
      };
    });

    const totalAmount = subtotal - totalDiscount;
    const taxAmount = totalAmount * 0.22; // 22% IVA standard

    // 5. Generate unique order number
    const orderNumber = await generateOrderNumber();

    // 6. Create order in database
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: customerData.id,
        order_date: new Date().toISOString().split('T')[0],
        total_amount: totalAmount,
        tax_amount: taxAmount,
        discount_amount: totalDiscount,
        shipping_cost: 0,
        status: 'pending',
        notes: `Ordine generato automaticamente dal listino: ${priceListData.name}`,
        created_by: userId
      })
      .select()
      .single();

    if (orderError) {
      throw new Error(`Errore nella creazione dell'ordine: ${orderError.message}`);
    }

    // 7. Create order items
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: newOrder.id
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) {
      // If items creation fails, try to clean up the order
      await supabase.from('orders').delete().eq('id', newOrder.id);
      throw new Error(`Errore nella creazione degli articoli dell'ordine: ${itemsError.message}`);
    }

    return newOrder.id;

  } catch (error) {
    console.error('Error creating order from price list:', error);
    throw error;
  }
};

/**
 * Validates if a price list can be used to create an order
 * @param priceListId - ID of the price list to validate
 * @returns Promise<boolean> - true if valid, false otherwise
 */
export const validatePriceListForOrder = async (priceListId: string): Promise<boolean> => {
  try {
    // Check if price list exists and is active
    const { data: priceList, error: priceListError } = await supabase
      .from('price_lists')
      .select('id, valid_from, valid_until, is_active, customer_id')
      .eq('id', priceListId)
      .eq('is_active', true)
      .single();

    if (priceListError || !priceList) {
      console.error('Price list validation failed - price list not found or inactive:', priceListError);
      return false;
    }

    // Check if price list is currently valid (valid_from must be <= now, valid_until must be >= now or null)
    const now = new Date();
    const validFrom = new Date(priceList.valid_from);
    const validUntil = priceList.valid_until ? new Date(priceList.valid_until) : null;

    // Allow price lists that start in the future or have no expiration date
    // Only reject if valid_until is set and has passed
    if (validUntil && validUntil < now) {
      console.error('Price list validation failed - expired:', { validUntil, now });
      return false;
    }

    // Check if price list has items
    const { count, error: countError } = await supabase
      .from('price_list_items')
      .select('id', { count: 'exact' })
      .eq('price_list_id', priceListId);

    if (countError || !count || count === 0) {
      console.error('Price list validation failed - no items:', { countError, count });
      return false;
    }

    // Check if there's a customer associated
    // First try using customer_id from price list
    if (priceList.customer_id) {
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('id', priceList.customer_id)
        .eq('is_active', true)
        .maybeSingle();

      if (customerError || !customer) {
        console.error('Price list validation failed - customer not found or inactive (by customer_id):', { customerError, customer_id: priceList.customer_id });
        return false;
      }
    } else {
      // Fallback: try finding customer by price_list_id (backward compatibility)
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('price_list_id', priceListId)
        .eq('is_active', true)
        .maybeSingle();

      if (customerError || !customer) {
        console.error('Price list validation failed - no customer associated:', { customerError, customer_id: priceList.customer_id });
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error validating price list:', error);
    return false;
  }
};