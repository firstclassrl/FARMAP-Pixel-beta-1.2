import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Download, Loader2, X, Mail } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNotifications } from '../store/useStore';
import { supabase } from '../lib/supabase';
import OrderFormTemplate from './OrderFormTemplate';
import type { Database } from '../types/database.types';

// Definizione Tipi (dal tuo codice originale)
type Order = Database['public']['Tables']['orders']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

interface OrderWithDetails extends Order {
  customers: Customer;
  created_by: Profile;
  order_items: (OrderItem & {
    products: Product;
  })[];
}

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
}

const OrderFormModal: React.FC<OrderFormModalProps> = ({ isOpen, onClose, orderId }) => {
  const orderFormRef = useRef<HTMLDivElement>(null);
  const { addNotification } = useNotifications();

  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    } else if (!isOpen) {
      setOrderData(null);
      setError(null);
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      setError(null);
      
      // First get the order data
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw new Error(`Impossibile caricare l'ordine: ${orderError.message}`);
      if (!orderData) throw new Error('Ordine non trovato.');

      // Get the profile data for the user who created the order
      let profileData = null;
      if (orderData.created_by) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', orderData.created_by)
          .single();
        
        if (!profileError) {
          profileData = profile;
        }
      }

      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', orderData.customer_id)
        .single();
      if (customerError) throw new Error(`Impossibile caricare i dati del cliente: ${customerError.message}`);

      const { data: orderItemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*, products (*)')
        .eq('order_id', orderId);
      if (itemsError) throw new Error(`Impossibile caricare gli articoli dell'ordine: ${itemsError.message}`);

      const combinedData = {
        ...orderData,
        customers: customerData,
        created_by: profileData,
        order_items: orderItemsData || []
      };

      // === LA PARTE FONDAMENTALE CHE HO RIPRISTINATO ===
      // Questa mappatura crea l'oggetto 'items' che il template si aspetta.
      const mappedOrderData = {
        orderNumber: combinedData.order_number,
        orderDate: new Date(combinedData.order_date),
        deliveryDate: combinedData.delivery_date ? new Date(combinedData.delivery_date) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        customerName: combinedData.customers?.company_name || 'N/A',
        customerCode: combinedData.customers?.vat_number || 'N/A',
        salesRepresentative: combinedData.created_by?.full_name || 'N/A',
        customerAddress: `${combinedData.customers?.address || ''}, ${combinedData.customers?.city || ''}`,
        customerContact: combinedData.customers?.contact_person || 'N/A',
        customerEmail: combinedData.customers?.email || '',
        customerPhone: combinedData.customers?.phone || '',
        shippingAddress: combinedData.shipping_address || 'Stesso indirizzo del cliente',
        items: combinedData.order_items.map(item => ({
          productCode: item.products?.code || 'N/A',
          productName: item.products?.name || 'N/A',
          productDescription: item.products?.description || '',
          quantity: item.quantity,
          unit: item.products?.unit || 'pz',
          unitPrice: item.unit_price,
          discountPercentage: item.discount_percentage,
          notes: item.notes || ''
        })),
        subtotal: combinedData.total_amount,
        taxAmount: combinedData.tax_amount,
        totalAmount: combinedData.total_amount + combinedData.tax_amount,
        notes: combinedData.notes || '',
      };

      setOrderData(mappedOrderData);
    } catch (err: any) {
      console.error('Error fetching order details:', err);
      setError(err.message);
      addNotification({ type: 'error', title: 'Errore', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!orderData) return;

    try {
      addNotification({ 
        type: 'info', 
        title: 'Generazione PDF', 
        message: 'Il PDF è in fase di creazione...' 
      });

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Header with logo space and title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('ORDINE DI ACQUISTO', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Company info
      doc.setFontSize(16);
      doc.setTextColor(220, 38, 38); // Red color
      doc.text('FARMAP S.r.l.', margin, yPosition);
      doc.setTextColor(0, 0, 0); // Reset to black
      yPosition += 15;

      // Order details
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const orderDetails = [
        [`Numero Ordine: ${orderData.orderNumber}`, `Data Ordine: ${orderData.orderDate.toLocaleDateString('it-IT')}`],
        [`Data Consegna: ${orderData.deliveryDate.toLocaleDateString('it-IT')}`, `Rappresentante: ${orderData.salesRepresentative}`]
      ];

      orderDetails.forEach(([left, right]) => {
        doc.text(left, margin, yPosition);
        doc.text(right, margin + contentWidth / 2, yPosition);
        yPosition += 6;
      });

      yPosition += 5;

      // Customer details
      doc.setFont('helvetica', 'bold');
      doc.text('Dettagli Cliente', margin, yPosition);
      yPosition += 8;
      
      doc.setFont('helvetica', 'normal');
      const customerDetails = [
        [`Cliente: ${orderData.customerName}`, `Codice: ${orderData.customerCode}`],
        [`Contatto: ${orderData.customerContact}`, `Email: ${orderData.customerEmail || 'N/A'}`],
        [`Telefono: ${orderData.customerPhone || 'N/A'}`, '']
      ];

      customerDetails.forEach(([left, right]) => {
        doc.text(left, margin, yPosition);
        if (right) doc.text(right, margin + contentWidth / 2, yPosition);
        yPosition += 5;
      });

      if (orderData.customerAddress) {
        doc.text(`Indirizzo: ${orderData.customerAddress}`, margin, yPosition);
        yPosition += 5;
      }

      yPosition += 5;

      // Products table using autoTable
      const tableData = orderData.items.map((item: any) => [
        item.productCode,
        item.productName + (item.productDescription ? `\n${item.productDescription}` : ''),
        `${item.quantity} ${item.unit || 'pz'}`,
        `€${item.unitPrice.toFixed(2)}`,
        item.discountPercentage ? `${item.discountPercentage}%` : '-',
        `€${(item.quantity * item.unitPrice * (1 - (item.discountPercentage || 0) / 100)).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Codice', 'Prodotto', 'Quantità', 'Prezzo Unit.', 'Sconto', 'Totale']],
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [220, 38, 38], // Red header
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: { 
          fontSize: 8,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 25 }, // Codice
          1: { cellWidth: 60 }, // Prodotto
          2: { cellWidth: 25 }, // Quantità
          3: { cellWidth: 25 }, // Prezzo
          4: { cellWidth: 20 }, // Sconto
          5: { cellWidth: 25 }  // Totale
        },
        margin: { left: margin, right: margin }
      });

      // Get position after table
      const finalY = (doc as any).lastAutoTable.finalY + 10;

      // Totals section
      const totalsX = pageWidth - margin - 60;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      doc.text('Subtotale (Imponibile):', totalsX - 5, finalY, { align: 'right' });
      doc.text(`€${orderData.subtotal.toFixed(2)}`, totalsX + 35, finalY, { align: 'right' });
      
      if (orderData.discountAmount && orderData.discountAmount > 0) {
        doc.setTextColor(220, 38, 38);
        doc.text('Sconto Applicato:', totalsX - 5, finalY + 6, { align: 'right' });
        doc.text(`-€${orderData.discountAmount.toFixed(2)}`, totalsX + 35, finalY + 6, { align: 'right' });
        doc.setTextColor(0, 0, 0);
      }
      
      doc.text('IVA:', totalsX - 5, finalY + 12, { align: 'right' });
      doc.text(`€${(orderData.taxAmount || 0).toFixed(2)}`, totalsX + 35, finalY + 12, { align: 'right' });
      
      // Total
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(220, 38, 38);
      doc.text('Totale Ordine:', totalsX - 5, finalY + 20, { align: 'right' });
      doc.text(`€${orderData.totalAmount.toFixed(2)}`, totalsX + 35, finalY + 20, { align: 'right' });
      doc.setTextColor(0, 0, 0);

      // Notes if present
      if (orderData.notes) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Note Ordine:', margin, finalY + 35);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const noteLines = doc.splitTextToSize(orderData.notes, contentWidth);
        doc.text(noteLines, margin, finalY + 42);
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Documento generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`,
        margin,
        pageHeight - 15
      );
      doc.text(
        'FARMAP S.r.l. - Sistema CRM Pixel',
        pageWidth - margin,
        pageHeight - 15,
        { align: 'right' }
      );

      // Save the PDF
      doc.save(`ordine_${orderData.orderNumber}.pdf`);
      
      addNotification({ 
        type: 'success', 
        title: 'PDF generato', 
        message: 'Il PDF è stato scaricato con successo.' 
      });
      
    } catch (err) {
      console.error('PDF generation error:', err);
      addNotification({ 
        type: 'error', 
        title: 'Errore PDF', 
        message: 'Impossibile generare il PDF.' 
      });
    }
  };

  const handleSendEmail = () => {
    if (!orderData || !orderData.customerEmail) {
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Email del cliente non disponibile'
      });
      return;
    }

    const subject = encodeURIComponent(`Ordine ${orderData.orderNumber} - FARMAP`);
    const body = encodeURIComponent(`Gentile ${orderData.customerName},

In allegato l'ordine di acquisto n. ${orderData.orderNumber}.

Dettagli ordine:
- Data: ${new Date(orderData.orderDate).toLocaleDateString('it-IT')}
- Totale: €${orderData.totalAmount.toFixed(2)}

Cordiali saluti,
FARMAP S.r.l.`);

    window.open(`mailto:${orderData.customerEmail}?subject=${subject}&body=${body}`);

    addNotification({
      type: 'success',
      title: 'Email Aperta',
      message: 'Il client di posta è stato aperto con i dettagli dell\'ordine'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="no-print p-6 pb-2 border-b">
          <div className="flex justify-between items-center pr-8">
            <DialogTitle>{orderData ? `Dettaglio Ordine ${orderData.orderNumber}` : 'Caricamento...'}</DialogTitle>
            {orderData && (
              <div className="flex gap-2">
                <Button onClick={handleDownloadPdf}>
                  <Download className="w-4 h-4 mr-2" /> Scarica PDF
                </Button>
                {orderData.customerEmail && (
                  <Button onClick={handleSendEmail} variant="outline">
                    <Mail className="w-4 h-4 mr-2" /> Invia Email
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>
        <div className="p-2">
          {loading && <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" /></div>}
          {error && <div className="p-12 text-center text-red-600">{error}</div>}
          {orderData && (
            <div ref={orderFormRef} className="mx-auto bg-white p-8 max-w-4xl">
              <OrderFormTemplate orderData={orderData} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderFormModal;