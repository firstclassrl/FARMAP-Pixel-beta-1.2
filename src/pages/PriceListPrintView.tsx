import React, { useState, useEffect } from 'react';
import { X, Printer, Mail } from 'lucide-react';
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
}

export function PriceListPrintView({ isOpen, onClose, priceListId }: PriceListPrintViewProps) {
  const [priceList, setPriceList] = useState<PriceListWithItems | null>(null);
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (isOpen && priceListId) {
      loadPriceListData();
    }
  }, [isOpen, priceListId]);

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
            products (id, code, name, description, category, unit, base_price)
          )
        `)
        .eq('id', priceListId)
        .single();

      if (priceListError) throw priceListError;

      // Load associated customer
      const { data: customerData } = await supabase
        .from('customers')
        .select('id, company_name, contact_person, email')
        .eq('price_list_id', priceListId)
        .maybeSingle();

      setPriceList({
        ...priceListData,
        customer: customerData || undefined
      } as PriceListWithItems);

    } catch (error) {
      console.error('Error loading price list data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    if (!priceList || !priceList.customer?.email) {
      addNotification({
        type: 'warning',
        title: 'Email non disponibile',
        message: 'Il cliente non ha un indirizzo email configurato'
      });
      return;
    }
    
    const subject = `Listino Prezzi FARMAP - ${priceList.name}`;
    const body = `Gentile ${priceList.customer.company_name},

In allegato troverete il vostro listino prezzi personalizzato.

Listino: ${priceList.name}
Data: ${new Date().toLocaleDateString('it-IT')}
Prodotti inclusi: ${priceList.price_list_items?.length || 0}

Per qualsiasi domanda o chiarimento, non esitate a contattarci.

Cordiali saluti,
Team FARMAP`;

    const mailtoUrl = `mailto:${priceList.customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    try {
      window.location.href = mailtoUrl;
      addNotification({
        type: 'success',
        title: 'Client email aperto',
        message: `Email preparata per ${priceList.customer.email}`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile aprire il client email'
      });
    }
  };

  const calculateFinalPrice = (basePrice: number, discount: number) => {
    return basePrice * (1 - discount / 100);
  };

  const calculateAverageDiscount = () => {
    if (!priceList?.price_list_items?.length) return 0;
    const totalDiscount = priceList.price_list_items.reduce((sum, item) => sum + item.discount_percentage, 0);
    return Math.round(totalDiscount / priceList.price_list_items.length);
  };

  const getStatusLabel = () => {
    if (!priceList) return 'Bozza';
    
    const now = new Date();
    const validFrom = new Date(priceList.valid_from);
    const validUntil = priceList.valid_until ? new Date(priceList.valid_until) : null;
    
    if (validFrom <= now && (!validUntil || validUntil >= now)) {
      return 'Attivo';
    } else if (validUntil && validUntil < now) {
      return 'Scaduto';
    }
    return 'Anteprima';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide everything by default */
          body * {
            visibility: hidden;
          }
          
          /* Show only print content */
          .print-modal-container,
          .print-modal-container *,
          .print-content, 
          .print-content * {
            visibility: visible;
          }
          
          /* Hide modal overlay and close button during print */
          [data-radix-dialog-overlay],
          [data-radix-dialog-close] {
            visibility: hidden !important;
            display: none !important;
          }
          
          /* Position print content */
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          /* Hide non-print elements */
          .no-print {
            display: none !important;
          }
          
          /* Page setup */
          .print-page {
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            padding: 20mm;
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
            padding: 8px 12px;
            text-align: left;
            font-size: 12px;
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
          size: A4;
          margin: 0;
        }
      `}</style>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="print-modal-container max-w-5xl max-h-[95vh] overflow-y-auto p-0">
          <DialogHeader className="no-print p-6 pb-0">
            <DialogTitle>Anteprima Listino</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : priceList ? (
            <div className="print-content">
              <div className="print-page bg-white p-8 mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
                {/* Header */}
                <div className="print-header text-center mb-8">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-8 h-8 bg-gray-300 rounded mr-3"></div>
                    <h1 className="text-2xl font-bold text-gray-700">
                      Listino {priceList.customer?.company_name || 'Cliente'}
                    </h1>
                  </div>
                  
                  <div className="text-center">
                    <h2 className="text-4xl font-bold text-red-600 mb-2">FARMAP</h2>
                    <p className="text-lg text-gray-600">Listino Prezzi Cliente</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    {priceList.customer?.company_name || 'Cliente Non Specificato'}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-8 text-sm">
                    <div>
                      <div className="mb-2">
                        <span className="font-medium text-gray-600">Listino:</span>
                        <span className="ml-2">{priceList.name}</span>
                      </div>
                      <div className="mb-2">
                        <span className="font-medium text-gray-600">Sconto Applicato:</span>
                        <span className="ml-2 text-red-600 font-medium">{calculateAverageDiscount()}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="mb-2">
                        <span className="font-medium text-gray-600">Data:</span>
                        <span className="ml-2">{new Date().toLocaleDateString('it-IT')}</span>
                      </div>
                      <div className="mb-2">
                        <span className="font-medium text-gray-600">Stato:</span>
                        <span className="ml-2">{getStatusLabel()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products Table */}
                <table className="print-table w-full border-collapse">
                  <thead>
                    <tr className="bg-red-600 text-white">
                      <th className="border border-gray-300 px-3 py-2 text-left">Codice</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Prodotto</th>
                      <th className="border border-gray-300 px-3 py-2 text-center">Categoria</th>
                      <th className="border border-gray-300 px-3 py-2 text-center">MOQ</th>
                      <th className="border border-gray-300 px-3 py-2 text-right">Prezzo Base</th>
                      <th className="border border-gray-300 px-3 py-2 text-center">IVA</th>
                      <th className="border border-gray-300 px-3 py-2 text-right">Prezzo Cliente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceList.price_list_items.map((item, index) => {
                      const finalPrice = calculateFinalPrice(item.price, item.discount_percentage);
                      const vatRate = item.products.category === 'Farmaci' ? 10 : 22; // Example VAT logic
                      
                      return (
                        <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="border border-gray-300 px-3 py-2 font-mono text-sm">
                            {item.products.code}
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <div>
                              <div className="font-medium">{item.products.name}</div>
                              {item.products.description && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {item.products.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                            {item.products.category || '-'}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            {item.min_quantity} {item.products.unit}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-right">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            {vatRate}%
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-right font-medium text-red-600">
                            {formatCurrency(finalPrice)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <div>
                      <p>FARMAP S.r.l. - Via Example 123, 00100 Roma</p>
                      <p>P.IVA: 12345678901 - Tel: +39 06 1234567</p>
                    </div>
                    <div className="text-right">
                      <p>Listino valido dal {new Date(priceList.valid_from).toLocaleDateString('it-IT')}</p>
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
                disabled={!priceList?.customer?.email}
              >
                <Mail className="w-4 h-4" />
                <span>Invia Email</span>
              </Button>
              <Button 
                onClick={handlePrint} 
                className="flex items-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>Stampa</span>
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
    </>
  );
}
export default PriceListPrintView;