import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../store/useStore';

export interface SearchResult {
  id: string;
  type: 'customer' | 'product' | 'order' | 'price_list' | 'sample_request';
  title: string;
  subtitle: string;
  description?: string;
  url: string;
  icon: string;
  relevance: number;
}

export const useSmartSearch = () => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  const searchAll = useCallback(async (term: string) => {
    if (!term.trim() || term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results: SearchResult[] = [];
      const searchLower = term.toLowerCase();

      // Search Customers
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, company_name, contact_person, email, phone, address')
        .or(`company_name.ilike.%${term}%,contact_person.ilike.%${term}%,email.ilike.%${term}%`)
        .limit(5);

      if (!customersError && customers) {
        customers.forEach(customer => {
          const relevance = calculateRelevance(customer.company_name, searchLower) +
                           calculateRelevance(customer.contact_person || '', searchLower) +
                           calculateRelevance(customer.email || '', searchLower);
          
          results.push({
            id: customer.id,
            type: 'customer',
            title: customer.company_name,
            subtitle: customer.contact_person || customer.email || 'Cliente',
            description: `${customer.email || ''} ${customer.phone || ''}`.trim(),
            url: `/customers`,
            icon: '👥',
            relevance
          });
        });
      }

      // Search Products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, code, description, category, base_price')
        .or(`name.ilike.%${term}%,code.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%`)
        .limit(5);

      if (!productsError && products) {
        products.forEach(product => {
          const relevance = calculateRelevance(product.name, searchLower) +
                           calculateRelevance(product.code, searchLower) +
                           calculateRelevance(product.description || '', searchLower) +
                           calculateRelevance(product.category || '', searchLower);
          
          results.push({
            id: product.id,
            type: 'product',
            title: product.name,
            subtitle: `Codice: ${product.code} | €${product.base_price}`,
            description: product.description || product.category || 'Prodotto',
            url: `/products`,
            icon: '📦',
            relevance
          });
        });
      }

      // Search Orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id, order_number, order_date, total_amount, status,
          customers!inner(company_name)
        `)
        .or(`order_number.ilike.%${term}%,customers.company_name.ilike.%${term}%`)
        .limit(5);

      if (!ordersError && orders) {
        orders.forEach(order => {
          const relevance = calculateRelevance(order.order_number, searchLower) +
                           calculateRelevance(order.customers?.company_name || '', searchLower);
          
          results.push({
            id: order.id,
            type: 'order',
            title: `Ordine ${order.order_number}`,
            subtitle: order.customers?.company_name || 'Ordine',
            description: `€${order.total_amount} | ${new Date(order.order_date).toLocaleDateString('it-IT')}`,
            url: `/orders`,
            icon: '🛒',
            relevance
          });
        });
      }

      // Search Price Lists
      const { data: priceLists, error: priceListsError } = await supabase
        .from('price_lists')
        .select('id, name, description, valid_from, valid_to')
        .or(`name.ilike.%${term}%,description.ilike.%${term}%`)
        .limit(5);

      if (!priceListsError && priceLists) {
        priceLists.forEach(priceList => {
          const relevance = calculateRelevance(priceList.name, searchLower) +
                           calculateRelevance(priceList.description || '', searchLower);
          
          results.push({
            id: priceList.id,
            type: 'price_list',
            title: priceList.name,
            subtitle: priceList.description || 'Listino prezzi',
            description: `Valido dal ${new Date(priceList.valid_from).toLocaleDateString('it-IT')}`,
            url: `/price-lists`,
            icon: '📋',
            relevance
          });
        });
      }

      // Search Sample Requests
      const { data: sampleRequests, error: sampleRequestsError } = await supabase
        .from('sample_requests')
        .select(`
          id, request_number, status, request_date,
          customers!inner(company_name)
        `)
        .or(`request_number.ilike.%${term}%,customers.company_name.ilike.%${term}%`)
        .limit(5);

      if (!sampleRequestsError && sampleRequests) {
        sampleRequests.forEach(request => {
          const relevance = calculateRelevance(request.request_number, searchLower) +
                           calculateRelevance(request.customers?.company_name || '', searchLower);
          
          results.push({
            id: request.id,
            type: 'sample_request',
            title: `Campionatura ${request.request_number}`,
            subtitle: request.customers?.company_name || 'Richiesta campioni',
            description: `${request.status} | ${new Date(request.request_date).toLocaleDateString('it-IT')}`,
            url: `/sample-requests`,
            icon: '🧪',
            relevance
          });
        });
      }

      // Sort by relevance and limit results
      const sortedResults = results
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 10);

      setSearchResults(sortedResults);

    } catch (error) {
      console.error('Search error:', error);
      addNotification({
        type: 'error',
        title: 'Errore ricerca',
        message: 'Si è verificato un errore durante la ricerca'
      });
    } finally {
      setIsSearching(false);
    }
  }, [addNotification]);

  const calculateRelevance = (text: string, searchTerm: string): number => {
    if (!text) return 0;
    
    const textLower = text.toLowerCase();
    
    // Exact match gets highest score
    if (textLower === searchTerm) return 100;
    
    // Starts with search term gets high score
    if (textLower.startsWith(searchTerm)) return 80;
    
    // Contains search term gets medium score
    if (textLower.includes(searchTerm)) return 60;
    
    // Word boundary match gets lower score
    const words = textLower.split(/\s+/);
    const hasWordMatch = words.some(word => word.startsWith(searchTerm));
    if (hasWordMatch) return 40;
    
    return 0;
  };

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    searchAll(term);
  }, [searchAll]);

  const handleResultClick = useCallback((result: SearchResult) => {
    navigate(result.url);
    setSearchResults([]);
    setSearchTerm('');
  }, [navigate]);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchTerm('');
  }, []);

  return {
    searchResults,
    isSearching,
    searchTerm,
    handleSearch,
    handleResultClick,
    clearSearch
  };
};
