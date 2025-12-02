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
import { formatDate, formatCurrency } from '../lib/exportUtils';

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
  mode?: 'view' | 'edit';
}

const OrderFormModal: React.FC<OrderFormModalProps> = ({ isOpen, onClose, orderId, mode = 'view' }) => {
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

      // Carica le condizioni di vendita dal listino associato (se presente)
      let priceListConditions: {
        payment_conditions?: string | null;
        shipping_conditions?: string | null;
        delivery_conditions?: string | null;
        brand_conditions?: string | null;
        print_conditions?: boolean;
      } | null = null;

      if (customerData.price_list_id) {
        const { data: priceListData, error: priceListError } = await supabase
          .from('price_lists')
          .select('payment_conditions, shipping_conditions, delivery_conditions, brand_conditions, print_conditions')
          .eq('id', customerData.price_list_id)
          .maybeSingle();

        if (!priceListError && priceListData) {
          priceListConditions = priceListData;
        }
      }

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
          id: item.id,
          productId: item.product_id,
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
        salesConditions: priceListConditions
          ? {
              payment: priceListConditions.payment_conditions || null,
              shipping: priceListConditions.shipping_conditions || null,
              delivery: priceListConditions.delivery_conditions || null,
              brand: priceListConditions.brand_conditions || null,
              printConditions: priceListConditions.print_conditions ?? true,
            }
          : null,
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

  /**
   * Genera un PDF con layout il più possibile identico alla vista HTML di `OrderFormTemplate`.
   * Usa gli stessi blocchi logici: logo, intestazione, dettagli ordine/cliente, tabella prodotti,
   * totali compatti, note, condizioni di vendita e riquadro firma.
   */
  const generateOrderPdf = (data: any) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let yPosition = margin;

    // 1) Logo come nella testata del template
    try {
      const logoImg = new Image();
      logoImg.src = '/logo_farmap industry.jpg';
      doc.addImage(logoImg, 'JPEG', margin, yPosition, 40, 12);
      yPosition += 18;
    } catch {
      yPosition += 10;
    }

    // 2) Titolo "ORDINE DI ACQUISTO" centrato, come nel template
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDINE DI ACQUISTO', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;

    // 3) Dettagli Ordine (colonna sinistra) + Tempi di consegna / Commerciale / Tracking
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const leftColX = margin;
    const rightColX = margin + contentWidth / 2;

    doc.text(`Numero: ${data.orderNumber}`, leftColX, yPosition);
    doc.text(`Data: ${formatDate(data.orderDate)}`, rightColX, yPosition);
    yPosition += 5;

    doc.text(`Tempi di consegna: ${formatDate(data.deliveryDate)}`, leftColX, yPosition);
    doc.text(`Commerciale: ${data.salesRepresentative}`, rightColX, yPosition);
    yPosition += 5;

    if (data.trackingNumber) {
      doc.text(`Tracking: ${data.trackingNumber}`, leftColX, yPosition);
      yPosition += 5;
    }

    yPosition += 4;

    // 4) Dettagli Cliente (colonna destra nel template, ma in PDF in blocco separato)
    doc.setFont('helvetica', 'bold');
    doc.text('Dettagli Cliente', margin, yPosition);
    yPosition += 6;

    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${data.customerName}`, margin, yPosition);
    yPosition += 4;
    doc.text(`Codice: ${data.customerCode}`, margin, yPosition);
    yPosition += 4;

    if (data.customerContact) {
      doc.text(`Contatto: ${data.customerContact}`, margin, yPosition);
      yPosition += 4;
    }
    if (data.customerPhone) {
      doc.text(`Telefono: ${data.customerPhone}`, margin, yPosition);
      yPosition += 4;
    }
    if (data.customerAddress) {
      const addrLines = doc.splitTextToSize(`Indirizzo: ${data.customerAddress}`, contentWidth);
      doc.text(addrLines, margin, yPosition);
      yPosition += addrLines.length * 4;
    }

    yPosition += 6;

    // 5) Tabella prodotti – stessa struttura della tabella HTML (Codice, Prodotto, Quantità, Prezzo, Totale)
    const tableBody = data.items.map((item: any) => {
      const descrizione =
        item.productDescription && item.productDescription.trim().length > 0
          ? `${item.productName}\n${item.productDescription}`
          : item.productName;

      const totaleRiga = (item.quantity || 0) * (item.unitPrice || 0);

      return [
        item.productCode || '',
        descrizione || '',
        `${item.quantity} ${item.unit || 'pz'}`,
        formatCurrency(item.unitPrice || 0),
        formatCurrency(totaleRiga),
      ];
    });

    autoTable(doc, {
      startY: yPosition,
      head: [['Codice', 'Prodotto', 'Quantità', 'Prezzo', 'Totale']],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 70 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
      },
      margin: { left: margin, right: margin },
    });

    const afterTableY = (doc as any).lastAutoTable.finalY + 6;

    // 6) Totali compatti in una riga, come nel footer del template
    const subtotal = data.subtotal ?? 0;
    const tax = data.taxAmount ?? 0;
    const total = data.totalAmount ?? subtotal + tax;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Subtotale: ${formatCurrency(subtotal)} | IVA: ${formatCurrency(tax)} | TOTALE: ${formatCurrency(
        total
      )}`,
      margin,
      afterTableY
    );

    let currentY = afterTableY + 8;

    // 7) Note ordine (stesso contenuto del riquadro giallo, senza sfondo)
    if (data.notes) {
      doc.setFont('helvetica', 'bold');
      doc.text('NOTE:', margin, currentY);
      currentY += 5;

      doc.setFont('helvetica', 'normal');
      const noteLines = doc.splitTextToSize(String(data.notes), contentWidth);
      doc.text(noteLines, margin, currentY);
      currentY += noteLines.length * 4 + 4;
    }

    // 8) Condizioni di vendita + riquadro firma, come nel blocco finale del template
    if (data.salesConditions && data.salesConditions.printConditions !== false) {
      doc.setFont('helvetica', 'bold');
      doc.text('Condizioni di vendita', margin, currentY);
      currentY += 5;

      doc.setFont('helvetica', 'normal');
      const condLines: string[] = [];
      if (data.salesConditions.payment) {
        condLines.push(`Pagamento: ${data.salesConditions.payment}`);
      }
      if (data.salesConditions.shipping) {
        condLines.push(`Trasporto: ${data.salesConditions.shipping}`);
      }
      if (data.salesConditions.delivery) {
        condLines.push(`Tempi di consegna: ${data.salesConditions.delivery}`);
      }
      if (data.salesConditions.brand) {
        condLines.push(`Marchio: ${data.salesConditions.brand}`);
      }

      condLines.forEach((line) => {
        const wrapped = doc.splitTextToSize(line, contentWidth - 60);
        doc.text(wrapped, margin, currentY);
        currentY += wrapped.length * 4;
      });

      // Riquadro firma a destra
      const boxWidth = 60;
      const boxHeight = 25;
      const boxX = pageWidth - margin - boxWidth;
      const boxY = currentY - 10;

      doc.rect(boxX, boxY, boxWidth, boxHeight);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Per accettazione', boxX + boxWidth / 2, boxY + 10, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.text('Timbro e firma', boxX + boxWidth / 2, boxY + 18, { align: 'center' });

      currentY = boxY + boxHeight + 6;
    }

    // 9) Footer identico alla vista (data/ora + indirizzo azienda)
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    const footerY = pageHeight - 15;

    doc.text(
      `Generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`,
      margin,
      footerY
    );
    doc.text(
      'FARMAP INDUSTRY S.r.l. - Via Nazionale, 66 - 65012 Cepagatti (PE)',
      pageWidth - margin,
      footerY,
      { align: 'right' }
    );

    return doc;
  };

  const handleDownloadPdf = async () => {
    if (!orderData) return;

    try {
      addNotification({
        type: 'info',
        title: 'Generazione PDF',
        message: 'Il PDF è in fase di creazione...',
      });

      const doc = generateOrderPdf(orderData);
      doc.save(`ordine_${orderData.orderNumber}.pdf`);

      addNotification({
        type: 'success',
        title: 'PDF generato',
        message: 'Il PDF è stato scaricato con successo.',
      });
    } catch (err) {
      console.error('PDF generation error:', err);
      addNotification({
        type: 'error',
        title: 'Errore PDF',
        message: 'Impossibile generare il PDF.',
      });
    }
  };

  const handleSaveOrder = async (updatedData: any) => {
    if (!orderId) return;

    try {
      setLoading(true);
      
      // Calculate totals from items
      let subtotal = 0;
      let totalDiscount = 0;

      // Update order items and calculate totals
      for (const item of updatedData.items) {
        if (item.id) {
          const itemSubtotal = item.quantity * item.unitPrice;
          const itemDiscount = item.discountPercentage ? (itemSubtotal * item.discountPercentage) / 100 : 0;
          const itemTotal = itemSubtotal - itemDiscount;

          subtotal += itemSubtotal;
          totalDiscount += itemDiscount;

          const { error: itemError } = await supabase
            .from('order_items')
            .update({
              quantity: item.quantity,
              unit_price: item.unitPrice,
              discount_percentage: item.discountPercentage || 0,
              total_price: itemTotal,
              notes: item.notes || null
            })
            .eq('id', item.id);

          if (itemError) {
            console.error(`Errore nell'aggiornamento dell'articolo ${item.productCode}:`, itemError);
            throw new Error(`Errore nell'aggiornamento dell'articolo ${item.productCode}: ${itemError.message}`);
          }
        }
      }

      const totalAmount = subtotal - totalDiscount;
      const taxAmount = totalAmount * 0.22; // 22% IVA standard

      // Update order with recalculated totals, note e nuova data di consegna
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          total_amount: totalAmount,
          tax_amount: taxAmount,
          discount_amount: totalDiscount,
          notes: updatedData.notes || null,
          delivery_date: updatedData.deliveryDate
            ? updatedData.deliveryDate.toISOString().split('T')[0]
            : null,
        })
        .eq('id', orderId);

      if (orderError) throw new Error(`Errore nell'aggiornamento dell'ordine: ${orderError.message}`);

      addNotification({
        type: 'success',
        title: 'Ordine aggiornato',
        message: 'Le modifiche sono state salvate con successo. I totali sono stati ricalcolati.'
      });

      // Close the modal after successful save
      onClose();

      // Refresh the order data
      await fetchOrderDetails();
      
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: error instanceof Error ? error.message : 'Errore durante il salvataggio'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!orderData || !orderData.customerEmail) {
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Email del cliente non disponibile'
      });
      return;
    }

    try {
      // Genera il PDF usando lo stesso layout dell'anteprima
      const doc = generateOrderPdf(orderData);
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Crea un link temporaneo per scaricare il PDF
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `ordine_${orderData.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Pulisci l'URL temporaneo
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);

      // Apri il client email con le istruzioni
      const subject = encodeURIComponent(`Ordine ${orderData.orderNumber} - FARMAP`);
      const body = encodeURIComponent(`Gentile ${orderData.customerName},

In allegato l'ordine di acquisto n. ${orderData.orderNumber}.

Dettagli ordine:
- Data: ${formatDate(orderData.orderDate)}
- Totale: €${orderData.totalAmount?.toFixed(2) || '0.00'}

IMPORTANTE: Il PDF è stato scaricato nella cartella Downloads.
Per allegarlo:
1. Clicca sull'icona graffetta (📎) in questa email
2. Seleziona il file "ordine_${orderData.orderNumber}.pdf" dalla cartella Downloads
3. Il file verrà allegato automaticamente
4. Invia l'email

Cordiali saluti,
FARMAP INDUSTRY S.r.l.`);

      window.open(`mailto:${orderData.customerEmail}?subject=${subject}&body=${body}`);

      addNotification({
        type: 'success',
        title: 'PDF generato e email preparata',
        message: `PDF scaricato automaticamente. Email preparata per ${orderData.customerEmail}`
      });
      
    } catch (error) {
      console.error('Error generating PDF for email:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile generare il PDF per l\'email'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="no-print p-6 pb-2 border-b">
          <div className="flex justify-between items-center pr-8">
            <DialogTitle>{orderData ? (mode === 'edit' ? `Modifica Ordine ${orderData.orderNumber}` : `Dettaglio Ordine ${orderData.orderNumber}`) : 'Caricamento...'}</DialogTitle>
            {orderData && mode !== 'edit' && (
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
              <OrderFormTemplate orderData={orderData} mode={mode} onSave={handleSaveOrder} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderFormModal;