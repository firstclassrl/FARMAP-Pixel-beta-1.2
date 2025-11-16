import { useState, useEffect, useRef } from 'react';
import { Mail, Download, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/exportUtils';
import { useNotifications } from '../store/useStore';
import type { Database } from '../types/database.types';
// PDF generation now handled by backend service

type PriceList = Database['public']['Tables']['price_lists']['Row'];
type PriceListItem = Database['public']['Tables']['price_list_items']['Row'];

interface Customer {
  id: string;
  company_name: string;
  contact_person?: string;
  email?: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  base_price: number;
  photo_url?: string;
  photo_thumb_url?: string;
  cartone?: string;
  pallet?: string;
  ean?: string;
  scadenza?: string;
}

interface PriceListWithItems extends PriceList {
  customer?: Customer;
  price_list_items: (PriceListItem & {
    products: Product;
  })[];
}

interface PriceListPrintViewProps {
  isOpen: boolean;
  onClose: () => void;
  priceListId: string;
  sortField?: 'code' | 'name';
  sortDirection?: 'asc' | 'desc';
  selectedCategory?: string;
  printByCategory?: boolean;
}

export function PriceListPrintView({ 
  isOpen, 
  onClose, 
  priceListId,
  sortField = 'name',
  sortDirection = 'asc',
  selectedCategory = 'all',
  printByCategory = false
}: PriceListPrintViewProps) {
  const [priceList, setPriceList] = useState<PriceListWithItems | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { addNotification } = useNotifications();
  const printContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && priceListId) {
      loadPriceListData();
    }
  }, [isOpen, priceListId, sortField, sortDirection, selectedCategory]);

  const loadPriceListData = async () => {
    try {
      setLoading(true);
      
      // Load price list with items
      const { data: priceListData, error: priceListError } = await supabase
        .from('price_lists')
        .select(`
          *,
          price_list_items (
            *,
            products (id, code, name, description, category, unit, base_price, photo_url, photo_thumb_url, cartone, pallet, ean, scadenza)
          )
        `)
        .eq('id', priceListId)
        .single();

      if (priceListError) {
        console.error('🔴 Error loading price list:', priceListError);
        throw priceListError;
      }
      if (!priceListData) throw new Error('Price list not found');

      // Load associated customer
      const { data: customerData } = await supabase
        .from('customers')
        .select('id, company_name, contact_person, email')
        .eq('price_list_id', priceListId)
        .maybeSingle();

      setPriceList({
        ...(priceListData as any),
        customer: customerData || undefined
      } as PriceListWithItems);

    } catch (error) {
      console.error('Error loading price list data:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: error instanceof Error ? error.message : 'Impossibile caricare il listino'
      } as any);
    } finally {
      setLoading(false);
    }
  };

  const resolveBackendUrl = () => {
    const normalizeUrl = (url?: string | null) => {
      if (!url) return '';
      const trimmed = url.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
      }
      return `https://${trimmed}`;
    };

    const isLocalHost =
      typeof window !== 'undefined' &&
      !!window.location &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.') ||
        window.location.hostname.endsWith('.local'));

    const envUrl = normalizeUrl(import.meta.env.VITE_PDF_GENERATOR_URL);

    if (envUrl) {
      return envUrl;
    }

    if (isLocalHost) {
      return 'http://localhost:3001';
    }

    return 'https://pdf-generator-farmap-production.up.railway.app';
  };

  const handleSendEmail = async () => {
    if (!priceList || !priceList.customer?.email) {
      addNotification({
        type: 'warning',
        title: 'Email non disponibile',
        message: 'Il cliente non ha un indirizzo email configurato'
      } as any);
      return;
    }
    
    try {
      addNotification({
        type: 'info',
        title: 'Generazione PDF in corso',
        message: 'Sto creando il PDF...'
      } as any);

      // Get backend URL from environment variable, localhost fallback or production default
      let backendUrl = resolveBackendUrl();
      
      // Assicurati che l'URL abbia il protocollo
      if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
        backendUrl = 'https://' + backendUrl;
      }
      
      // Assicurati che l'URL non finisca con /
      const cleanBackendUrl = backendUrl.replace(/\/$/, '');
      const endpoint = `${cleanBackendUrl}/api/generate-price-list-pdf`;
      
      // Applica filtro categoria ai prodotti
      const filteredItems = [...priceList.price_list_items].filter(item => {
        if (selectedCategory === 'all') return true;
        return item.products.category === selectedCategory;
      });

      let requestBody: any;
      
      if (printByCategory) {
        // Raggruppa i prodotti per categoria
        const groupedByCategory = filteredItems.reduce((acc, item) => {
          const category = item.products.category || 'Senza categoria';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(item);
          return acc;
        }, {} as Record<string, typeof filteredItems>);

        // Ordina le categorie alfabeticamente
        const sortedCategories = Object.keys(groupedByCategory).sort();
        
        // Ordina i prodotti all'interno di ogni categoria
        sortedCategories.forEach(category => {
          groupedByCategory[category] = groupedByCategory[category].sort((a, b) => {
            let comparison = 0;
            if (sortField === 'code') {
              comparison = (a.products.code || '').localeCompare(b.products.code || '');
            } else {
              comparison = (a.products.name || '').localeCompare(b.products.name || '');
            }
            return sortDirection === 'asc' ? comparison : -comparison;
          });
        });

        // Crea una lista piatta ordinata per categoria (per compatibilità)
        const flatItems = sortedCategories.flatMap(category => groupedByCategory[category]);
        
        // Aggiungi un campo _category_group a ogni prodotto per aiutare il backend
        const itemsWithCategoryGroup = flatItems.map(item => ({
          ...item,
          _category_group: item.products.category || 'Senza categoria',
          _is_category_header: false
        }));

        requestBody = {
          priceListData: {
            ...priceList,
            price_list_items: itemsWithCategoryGroup
          },
          printByCategory: true,
          groupedByCategory: groupedByCategory,
          categoryOrder: sortedCategories,
          sortField: sortField,
          sortDirection: sortDirection,
          selectedCategory: selectedCategory
        };
      } else {
        // Comportamento normale: ordina i prodotti
        const itemsToSend = filteredItems.sort((a, b) => {
          let comparison = 0;
          if (sortField === 'code') {
            comparison = (a.products.code || '').localeCompare(b.products.code || '');
          } else {
            comparison = (a.products.name || '').localeCompare(b.products.name || '');
          }
          return sortDirection === 'asc' ? comparison : -comparison;
        });

        requestBody = {
          priceListData: {
            ...priceList,
            price_list_items: itemsToSend
          },
          printByCategory: false,
          sortField: sortField,
          sortDirection: sortDirection,
          selectedCategory: selectedCategory
        };
      }
      
      // Call backend to generate PDF
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Get PDF blob
      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Download PDF with proper filename
      const today = new Date().toLocaleDateString('it-IT').replace(/\//g, '-');
      const customerName = priceList.customer?.company_name || 'Cliente';
      const fileName = `listino_${customerName.replace(/[^a-zA-Z0-9]/g, '_')}_${today}.pdf`;
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URL
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      
      // Open email client
      const subject = `Listino Prezzi FARMAP - ${priceList.name}`;
      const body = `Gentile ${priceList.customer.company_name},

In allegato troverete il vostro listino prezzi personalizzato.

Listino: ${priceList.name}
Data: ${new Date().toLocaleDateString('it-IT')}
Prodotti inclusi: ${printByCategory ? Object.values(requestBody.groupedByCategory).flat().length : requestBody.priceListData.price_list_items.length}

IMPORTANTE: Il PDF è stato scaricato nella cartella Downloads.
Per allegarlo:
1. Clicca sull'icona graffetta (📎) in questa email
2. Seleziona il file "${fileName}" dalla cartella Downloads
3. Il file verrà allegato automaticamente
4. Invia l'email

Per qualsiasi domanda o chiarimento, non esitate a contattarci.

Cordiali saluti,
Team FARMAP`;

      const mailtoUrl = `mailto:${priceList.customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      window.location.href = mailtoUrl;
      
      addNotification({
        type: 'success',
        title: 'PDF generato e email preparata',
        message: `PDF scaricato automaticamente. Email preparata per ${priceList.customer.email}`
      } as any);
      
    } catch (error) {
      console.error('Error generating PDF for email:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: error instanceof Error ? error.message : 'Impossibile generare il PDF per l\'email'
      } as any);
    }
  };

  const handleDownloadPDF = async () => {
    if (!priceList) {
      console.error('🔴 handleDownloadPDF: priceList is null');
      return;
    }

    // Previeni click multipli
    if (isGeneratingPDF) {
      return;
    }

    setIsGeneratingPDF(true);

    try {

      // Get backend URL from environment variable or use default
      let backendUrl = resolveBackendUrl();
      
      // Assicurati che l'URL abbia il protocollo
      if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
        backendUrl = 'https://' + backendUrl;
      }
      
      // Assicurati che l'URL non finisca con /
      const cleanBackendUrl = backendUrl.replace(/\/$/, '');
      const endpoint = `${cleanBackendUrl}/api/generate-price-list-pdf`;
      
      console.log('🔵 PDF Generation - Raw backendUrl:', backendUrl);
      console.log('🔵 PDF Generation - Clean backendUrl:', cleanBackendUrl);
      console.log('🔵 PDF Generation - Env var exists:', !!import.meta.env.VITE_PDF_GENERATOR_URL);
      console.log('🔵 PDF Generation - Env var value:', import.meta.env.VITE_PDF_GENERATOR_URL || 'NOT SET');
      
      // Applica filtro categoria ai prodotti
      const filteredItems = [...priceList.price_list_items].filter(item => {
        if (selectedCategory === 'all') return true;
        return item.products.category === selectedCategory;
      });

      let requestBody: any;
      
      if (printByCategory) {
        // Raggruppa i prodotti per categoria
        const groupedByCategory = filteredItems.reduce((acc, item) => {
          const category = item.products.category || 'Senza categoria';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(item);
          return acc;
        }, {} as Record<string, typeof filteredItems>);

        // Ordina le categorie alfabeticamente
        const sortedCategories = Object.keys(groupedByCategory).sort();
        
        // Ordina i prodotti all'interno di ogni categoria
        sortedCategories.forEach(category => {
          groupedByCategory[category] = groupedByCategory[category].sort((a, b) => {
            let comparison = 0;
            if (sortField === 'code') {
              comparison = (a.products.code || '').localeCompare(b.products.code || '');
            } else {
              comparison = (a.products.name || '').localeCompare(b.products.name || '');
            }
            return sortDirection === 'asc' ? comparison : -comparison;
          });
        });

        // Crea una lista piatta ordinata per categoria (per compatibilità)
        const flatItems = sortedCategories.flatMap(category => groupedByCategory[category]);
        
        // Aggiungi un campo _category_group a ogni prodotto per aiutare il backend
        const itemsWithCategoryGroup = flatItems.map(item => ({
          ...item,
          _category_group: item.products.category || 'Senza categoria',
          _is_category_header: false
        }));

        requestBody = {
          priceListData: {
            ...priceList,
            price_list_items: itemsWithCategoryGroup
          },
          printByCategory: true,
          groupedByCategory: groupedByCategory,
          categoryOrder: sortedCategories,
          sortField: sortField,
          sortDirection: sortDirection,
          selectedCategory: selectedCategory
        };
      } else {
        // Comportamento normale: ordina i prodotti
        const itemsToSend = filteredItems.sort((a, b) => {
          let comparison = 0;
          if (sortField === 'code') {
            comparison = (a.products.code || '').localeCompare(b.products.code || '');
          } else {
            comparison = (a.products.name || '').localeCompare(b.products.name || '');
          }
          return sortDirection === 'asc' ? comparison : -comparison;
        });

        requestBody = {
          priceListData: {
            ...priceList,
            price_list_items: itemsToSend
          },
          printByCategory: false,
          sortField: sortField,
          sortDirection: sortDirection,
          selectedCategory: selectedCategory
        };
      }
      
      console.log('🔵 PDF Generation - Price list items:', printByCategory ? Object.values(requestBody.groupedByCategory).flat().length : requestBody.priceListData.price_list_items.length);
      console.log('🔵 PDF Generation - Full endpoint:', endpoint);
      console.log('🔵 PDF Generation - Print by category:', printByCategory);
      console.log('🔵 PDF Generation - Categories:', printByCategory ? requestBody.categoryOrder : 'N/A');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('🔵 PDF Response status:', response.status, response.statusText);
      console.log('🔵 PDF Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `HTTP error! status: ${response.status}` };
        }
        console.error('🔴 PDF Generation Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          errorText: errorText,
          fullError: JSON.stringify(errorData, null, 2)
        });
        
        // Mostra il messaggio completo all'utente
        const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
        const fullErrorMessage = errorData.stack ? `${errorMessage}\n\n${errorData.stack}` : errorMessage;
        throw new Error(fullErrorMessage);
      }

      // Get PDF blob
      const pdfBlob = await response.blob();
      const fileSizeMB = (pdfBlob.size / (1024 * 1024)).toFixed(2);
      console.log('🔵 PDF Generated - File size:', fileSizeMB, 'MB');
      console.log('🔵 PDF Blob type:', pdfBlob.type);
      console.log('🔵 PDF Blob size:', pdfBlob.size, 'bytes');
      
      if (pdfBlob.size === 0) {
        throw new Error('Il PDF generato è vuoto. Controlla i log del servizio.');
      }
      
      const pdfUrl = URL.createObjectURL(pdfBlob);
      console.log('🔵 PDF URL created');
      
      // Download PDF with proper filename
      const today = new Date().toLocaleDateString('it-IT').replace(/\//g, '-');
      const customerName = priceList.customer?.company_name || 'Cliente';
      const fileName = `listino_${customerName.replace(/[^a-zA-Z0-9]/g, '_')}_${today}.pdf`;
      
      console.log('🔵 Starting download:', fileName);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Usa requestAnimationFrame per assicurarsi che il DOM sia aggiornato
      requestAnimationFrame(() => {
        link.click();
        console.log('🔵 Download link clicked');
        
        // Clean up after download (più tempo per assicurarsi che il download inizi)
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(pdfUrl);
          console.log('🔵 Cleanup completed');
        }, 2000);
      });

      addNotification({
        type: 'success',
        title: 'PDF Generato',
        message: 'Il listino è stato scaricato come PDF'
      } as any);

    } catch (error) {
      console.error('🔴 Error generating PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore nella generazione del PDF';
      addNotification({
        type: 'error',
        title: 'Errore',
        message: errorMessage
      } as any);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const calculateFinalPrice = (basePrice: number, discount: number) => {
    return basePrice * (1 - discount / 100);
  };

  // Image loading no longer needed - handled by backend Puppeteer



  if (!isOpen) return null;

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          /* Reset all visibility */
          * {
            visibility: visible !important;
          }
          
          /* Hide modal overlay and close button during print */
          [data-radix-dialog-overlay],
          [data-radix-dialog-close] {
            visibility: hidden !important;
            display: none !important;
          }
          
          /* Hide non-print elements */
          .no-print {
            display: none !important;
          }
          
          /* Ensure print content is visible */
          .print-content,
          .print-page,
          .print-visible {
            visibility: visible !important;
            display: block !important;
          }
          
          /* Page setup - A4 Landscape */
          .print-page {
            width: 297mm;
            min-height: 210mm;
            margin: 0;
            padding: 10mm;
            background: white;
            box-shadow: none;
            page-break-after: always;
          }
          
          /* Print-specific styles */
          .print-header {
            border-bottom: 2px solid #dc2626;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          
          .print-table th,
          .print-table td {
            border: 1px solid #e5e7eb;
            padding: 6px 8px; /* righe più sottili in stampa */
            text-align: left;
            font-size: 12px;
            vertical-align: top;
          }
          
          .print-table th {
            background-color: #dc2626;
            color: white;
            font-weight: 600;
          }
          
          .print-table tbody tr:nth-child(even) {
            background-color: #f9fafb;
          }
        }
        
        @page {
          size: A4 landscape;
          margin: 0;
        }
      `}</style>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="print-modal-container max-w-7xl max-h-[95vh] overflow-y-auto p-0">
          <DialogHeader className="no-print p-6 pb-0">
            <DialogTitle>Anteprima Listino</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : priceList ? (
            <div className="print-content" ref={printContentRef}>
              <div className="print-page bg-white p-6 mx-auto print-visible" style={{ width: '297mm', minHeight: '210mm' }}>
                {/* Header Compatto */}
                <div className="print-header text-center mb-2">
                  <div className="flex items-center justify-center mb-1">
                    <img 
                      src="/logo farmap industry copy.png" 
                      alt="Farmap Logo" 
                      className="h-6 w-auto mr-2"
                    />
                    <h1 className="text-lg font-bold text-gray-700">
                      Listino {priceList.customer?.company_name || 'Cliente'}
                    </h1>
                  </div>
                </div>

                {/* Customer Info Compatto */}
                <div className="mb-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-medium text-gray-600">Listino:</span>
                      <span className="ml-1">{priceList.name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Data Creazione:</span>
                      <span className="ml-1">{new Date(priceList.created_at).toLocaleDateString('it-IT')}</span>
                    </div>
                  </div>
                </div>

                {/* Products Table */}
                <table className="print-table w-full border-collapse">
                  <thead>
                    <tr className="bg-red-600 text-white">
                      <th className="border border-gray-300 px-2 py-3 text-center w-20">Foto</th>
                      <th className="border border-gray-300 px-2 py-3 text-left w-20">Codice</th>
                      <th className="border border-gray-300 px-2 py-3 text-left w-40">Prodotto</th>
                      <th className="border border-gray-300 px-2 py-3 text-center w-16">MOQ</th>
                      <th className="border border-gray-300 px-2 py-3 text-center w-16">Cartone</th>
                      <th className="border border-gray-300 px-2 py-3 text-center w-16">Pedana</th>
                      <th className="border border-gray-300 px-2 py-3 text-center w-20">Scadenza</th>
                      <th className="border border-gray-300 px-2 py-3 text-center w-24">EAN</th>
                      <th className="border border-gray-300 px-2 py-3 text-center w-16">IVA</th>
                      <th className="border border-gray-300 px-2 py-3 text-right w-20">Prezzo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Filtra i prodotti
                      const filteredItems = [...priceList.price_list_items].filter(item => {
                        if (selectedCategory === 'all') return true;
                        return item.products.category === selectedCategory;
                      });

                      // Se printByCategory è true, raggruppa per categoria
                      if (printByCategory) {
                        // Raggruppa per categoria
                        const groupedByCategory = filteredItems.reduce((acc, item) => {
                          const category = item.products.category || 'Senza categoria';
                          if (!acc[category]) {
                            acc[category] = [];
                          }
                          acc[category].push(item);
                          return acc;
                        }, {} as Record<string, typeof filteredItems>);

                        // Ordina le categorie alfabeticamente
                        const sortedCategories = Object.keys(groupedByCategory).sort();

                        // Genera le righe raggruppate per categoria
                        let globalIndex = 0;
                        return sortedCategories.flatMap(category => {
                          const categoryItems = groupedByCategory[category]
                            .sort((a, b) => {
                              let comparison = 0;
                              if (sortField === 'code') {
                                comparison = (a.products.code || '').localeCompare(b.products.code || '');
                              } else {
                                comparison = (a.products.name || '').localeCompare(b.products.name || '');
                              }
                              return sortDirection === 'asc' ? comparison : -comparison;
                            });

                          return [
                            // Intestazione categoria
                            <tr key={`category-${category}`} className="bg-blue-100">
                              <td colSpan={10} className="border border-gray-300 px-3 py-1 font-bold text-sm text-blue-900">
                                {category}
                              </td>
                            </tr>,
                            // Prodotti della categoria
                            ...categoryItems.map((item) => {
                              const finalPrice = calculateFinalPrice(item.price, item.discount_percentage);
                              const vatRate = item.products.category === 'Farmaci' ? 10 : 22;
                              const rowIndex = globalIndex++;
                              
                              return (
                                <tr key={item.id} className={rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="border border-gray-300 p-0 text-center align-top">
                            <div className="w-16 h-16 bg-gray-200 overflow-hidden">
                              {(item.products.photo_thumb_url || item.products.photo_url) ? (
                                <img 
                                  src={item.products.photo_thumb_url || item.products.photo_url} 
                                  alt={item.products.name}
                                  className="w-full h-full object-contain"
                                  loading="lazy"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><span class="text-xs text-gray-400">N/A</span></div>';
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-xs text-gray-400">N/A</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-2 py-2 font-mono text-xs align-top">
                            {item.products.code}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 align-top">
                            <div>
                              <div className="font-medium text-xs">{item.products.name}</div>
                              {item.products.description && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {item.products.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center text-xs align-top">
                            {item.min_quantity} {item.products.unit}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center text-xs align-top">
                            {item.products.cartone || '-'}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center text-xs align-top">
                            {item.products.pallet || '-'}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center text-xs align-top">
                            {item.products.scadenza || '-'}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center text-xs align-top font-mono">
                            {item.products.ean || '-'}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center text-xs align-top">
                            {vatRate}%
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-right font-medium text-red-600 text-xs align-top">
                            {formatCurrency(finalPrice)}
                          </td>
                                </tr>
                              );
                            })
                          ];
                        });
                      } else {
                        // Comportamento normale: lista piatta ordinata
                        return filteredItems
                          .sort((a, b) => {
                            let comparison = 0;
                            if (sortField === 'code') {
                              comparison = (a.products.code || '').localeCompare(b.products.code || '');
                            } else {
                              comparison = (a.products.name || '').localeCompare(b.products.name || '');
                            }
                            return sortDirection === 'asc' ? comparison : -comparison;
                          })
                          .map((item, index) => {
                            const finalPrice = calculateFinalPrice(item.price, item.discount_percentage);
                            const vatRate = item.products.category === 'Farmaci' ? 10 : 22;
                            
                            return (
                              <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                <td className="border border-gray-300 p-0 text-center align-top">
                                  <div className="w-16 h-16 bg-gray-200 overflow-hidden">
                                    {(item.products.photo_thumb_url || item.products.photo_url) ? (
                                      <img 
                                        src={item.products.photo_thumb_url || item.products.photo_url} 
                                        alt={item.products.name}
                                        className="w-full h-full object-contain"
                                        loading="lazy"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const parent = target.parentElement;
                                          if (parent) {
                                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><span class="text-xs text-gray-400">N/A</span></div>';
                                          }
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-xs text-gray-400">N/A</span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-2 py-2 font-mono text-xs align-top">
                                  {item.products.code}
                                </td>
                                <td className="border border-gray-300 px-2 py-2 align-top">
                                  <div>
                                    <div className="font-medium text-xs">{item.products.name}</div>
                                    {item.products.description && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        {item.products.description}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-2 py-2 text-center text-xs align-top">
                                  {item.min_quantity} {item.products.unit}
                                </td>
                                <td className="border border-gray-300 px-2 py-2 text-center text-xs align-top">
                                  {item.products.cartone || '-'}
                                </td>
                                <td className="border border-gray-300 px-2 py-2 text-center text-xs align-top">
                                  {item.products.pallet || '-'}
                                </td>
                                <td className="border border-gray-300 px-2 py-2 text-center text-xs align-top">
                                  {item.products.scadenza || '-'}
                                </td>
                                <td className="border border-gray-300 px-2 py-2 text-center text-xs align-top font-mono">
                                  {item.products.ean || '-'}
                                </td>
                                <td className="border border-gray-300 px-2 py-2 text-center text-xs align-top">
                                  {vatRate}%
                                </td>
                                <td className="border border-gray-300 px-2 py-2 text-right font-medium text-red-600 text-xs align-top">
                                  {formatCurrency(finalPrice)}
                                </td>
                              </tr>
                            );
                          });
                      }
                    })()}
                  </tbody>
                </table>

                {/* Condizioni di Vendita */}
                {(priceList.payment_conditions || priceList.shipping_conditions || 
                  priceList.delivery_conditions || priceList.brand_conditions) && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                    <h3 className="text-xs font-bold text-orange-800 mb-1">CONDIZIONI DI VENDITA</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      {priceList.payment_conditions && (
                        <div>
                          <span className="font-bold text-gray-600">Pagamento:</span>
                          <span className="ml-1">{priceList.payment_conditions}</span>
                        </div>
                      )}
                      {priceList.shipping_conditions && (
                        <div>
                          <span className="font-bold text-gray-600">Trasporto:</span>
                          <span className="ml-1">{priceList.shipping_conditions}</span>
                        </div>
                      )}
                      {priceList.delivery_conditions && (
                        <div>
                          <span className="font-bold text-gray-600">Tempi di consegna:</span>
                          <span className="ml-1">{priceList.delivery_conditions}</span>
                        </div>
                      )}
                      {priceList.brand_conditions && (
                        <div className="ml-auto">
                          <span className="font-bold text-gray-600">Marchio:</span>
                          <span className="ml-1">{priceList.brand_conditions}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Campo Accettazione Ordine */}
                <div className="mt-2 flex justify-end">
                  <div className="border-2 border-black p-2 w-32 h-16">
                    <div className="text-xs font-bold text-center mb-1">ACCETTAZIONE ORDINE</div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Data:</span>
                        <div className="border-b border-black w-16"></div>
                      </div>
                      <div className="mt-2">
                        {/* Spazio bianco per firma e timbro */}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nota Codici */}
                <div className="mt-4 p-2">
                  <p className="text-xs font-medium text-red-600 text-center">
                    I codici presenti in questo listino sono ad uso interno. I codici personalizzati del cliente verranno generati automaticamente al momento dell'ordine.
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-2 pt-2 border-t border-gray-300 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <div>
                      <p>FARMAP INDUSTRY S.r.l. - Via Nazionale, 66 - 65012 Cepagatti (PE) - P.IVA: 02244470684 - Tel: +39 085 9774028</p>
                    </div>
                    <div className="text-right">
                      {priceList.valid_from && (
                        <p>Listino valido dal {new Date(priceList.valid_from).toLocaleDateString('it-IT')}</p>
                      )}
                      {priceList.valid_until && (
                        <p>fino al {new Date(priceList.valid_until).toLocaleDateString('it-IT')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 no-print">
              Errore nel caricamento del listino
            </div>
          )}
          
          {/* Footer with action buttons */}
          <div className="no-print p-6 pt-0 border-t bg-gray-50">
            <div className="flex items-center justify-end space-x-3">
              <Button 
                onClick={handleSendEmail} 
                variant="outline" 
                className="flex items-center space-x-2"
                disabled={!priceList?.customer?.email || isGeneratingPDF}
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generazione in corso...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Invia Email</span>
                  </>
                )}
              </Button>
              <Button 
                onClick={handleDownloadPDF} 
                className="flex items-center space-x-2"
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generazione in corso...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </>
                )}
              </Button>
            </div>
            {!priceList?.customer?.email && (
              <p className="text-xs text-gray-500 mt-2 text-right">
                Email non disponibile per questo cliente
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale di loading durante generazione PDF */}
      {isGeneratingPDF && (
        <Dialog open={isGeneratingPDF} onOpenChange={() => {}}>
          <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Generazione PDF in corso</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-center text-gray-600">
                Stiamo generando il PDF del listino...
                <br />
                <span className="text-sm text-gray-500 mt-2 block">
                  Attendere il completamento del download
                </span>
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
export default PriceListPrintView;