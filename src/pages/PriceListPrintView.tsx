import { useState, useEffect } from 'react';
import { Mail, Download } from 'lucide-react';
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
            products (id, code, name, description, category, unit, base_price, photo_url, cartone, pallet, ean, scadenza)
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

  const handleSendEmail = async () => {
    if (!priceList || !priceList.customer?.email) {
      addNotification({
        type: 'warning',
        title: 'Email non disponibile',
        message: 'Il cliente non ha un indirizzo email configurato'
      });
      return;
    }
    
    try {
      // Genera il PDF automaticamente in formato A4 orizzontale
      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = 297;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // 1. LOGO E INTESTAZIONE (identico all'HTML)
      try {
        const logoImg = new Image();
        logoImg.src = '/logo farmap industry copy.png';
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
          if (logoImg.complete) resolve(null);
        });
        // Logo a sinistra, dimensione compatte (h-6 w-auto = circa 24mm)
        doc.addImage(logoImg, 'PNG', margin, yPosition, 24, 9);
        // Titolo centrato alla stessa altezza
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(`Listino ${priceList.customer?.company_name || 'Cliente'}`, pageWidth / 2, yPosition + 6, { align: 'center' });
        yPosition += 12;
      } catch (logoError) {
        console.warn('Logo non caricato, continuo senza logo');
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(`Listino ${priceList.customer?.company_name || 'Cliente'}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 12;
      }

      // 2. DETTAGLI LISTINO (grid 2 colonne come HTML)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Listino: ${priceList.name}`, margin, yPosition);
      doc.text(`Data Creazione: ${new Date(priceList.created_at).toLocaleDateString('it-IT')}`, margin + contentWidth/2, yPosition);
      yPosition += 8;

      // 4. CARICA IMMAGINI E GENERA TABELLA
      const tableData = await Promise.all(
        priceList.price_list_items?.map(async (item) => {
          const finalPrice = calculateFinalPrice(item.price, item.discount_percentage);
          const vatRate = item.products?.category === 'Farmaci' ? 10 : 22;
          
          let photoBase64 = '';
          if (item.products?.photo_url) {
            try {
              photoBase64 = await loadImageAsBase64(item.products.photo_url);
            } catch (error) {
              console.warn('Errore nel caricamento foto:', error);
            }
          }
          
          return {
            photo: photoBase64,
            data: [
              '', // Placeholder per foto
              item.products?.code || '',
              item.products?.name || '',
              `${item.min_quantity} ${item.products?.unit || ''}`,
              item.products?.cartone || '-',
              item.products?.pallet || '-',
              item.products?.scadenza || '-',
              item.products?.ean || '-',
              `${vatRate}%`,
              `€${finalPrice.toFixed(2)}`
            ]
          };
        }) || []
      );

      // Genera la tabella con le immagini
      autoTable(doc, {
        startY: yPosition,
        head: [['Foto', 'Codice', 'Prodotto', 'MOQ', 'Cartone', 'Pedana', 'Scadenza', 'EAN', 'IVA', 'Prezzo']],
        body: tableData.map(item => item.data),
        theme: 'grid',
        headStyles: { 
          fillColor: [220, 38, 38], 
          textColor: [255, 255, 255],
          fontSize: 8
        },
        bodyStyles: { 
          fontSize: 7
        },
        columnStyles: {
          0: { cellWidth: 20 }, // Foto
          1: { cellWidth: 25 }, // Codice
          2: { cellWidth: 80 }, // Prodotto
          3: { cellWidth: 20 }, // MOQ
          4: { cellWidth: 20 }, // Cartone
          5: { cellWidth: 20 }, // Pedana
          6: { cellWidth: 25 }, // Scadenza
          7: { cellWidth: 30 }, // EAN
          8: { cellWidth: 15 }, // IVA
          9: { cellWidth: 25 }  // Prezzo Cliente
        },
        didDrawCell: (data) => {
          // Aggiungi le immagini nella colonna Foto
          if (data.column.index === 0 && data.row.index > 0) {
            const tableIndex = data.row.index - 1;
            const photoBase64 = tableData[tableIndex]?.photo;
            if (photoBase64) {
              try {
                doc.addImage(photoBase64, 'JPEG', data.cell.x + 1, data.cell.y + 1, 18, 18);
              } catch (error) {
                console.warn('Errore nell\'inserimento immagine:', error);
              }
            }
          }
        }
      });

      // 5. CONDIZIONI DI VENDITA
      const finalY = (doc as any).lastAutoTable.finalY || yPosition + 100;
      let conditionsY = finalY + 5;
      
      // Aggiungi sezione condizioni di vendita se ci sono dati
      if (priceList.payment_conditions || priceList.shipping_conditions || 
          priceList.delivery_conditions || priceList.brand_conditions) {
        
        // Box arancione (bg-orange-50, border-orange-200)
        doc.setFillColor(255, 247, 237); // bg-orange-50
        doc.setDrawColor(251, 191, 36); // border-orange-200
        doc.setLineWidth(0.5);
        const boxHeight = 25;
        doc.roundedRect(margin, conditionsY - 5, contentWidth, boxHeight, 2, 2, 'FD');
        
        // Titolo sezione
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(154, 52, 18); // text-orange-800
        doc.text('CONDIZIONI DI VENDITA', margin + 5, conditionsY + 3);
        
        // Condizioni allineate a sinistra, Marchio allineato a destra
        doc.setFontSize(8);
        let currentX = margin + 5;
        const lineY = conditionsY + 10;
        
        if (priceList.payment_conditions) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(75, 85, 99); // text-gray-600
          doc.text('Pagamento:', currentX, lineY);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          const paymentTextWidth = doc.getTextWidth(priceList.payment_conditions);
          doc.text(priceList.payment_conditions, currentX + 20, lineY);
          currentX += 20 + paymentTextWidth + 12;
        }
        
        if (priceList.shipping_conditions) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(75, 85, 99);
          doc.text('Trasporto:', currentX, lineY);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          const shippingTextWidth = doc.getTextWidth(priceList.shipping_conditions);
          doc.text(priceList.shipping_conditions, currentX + 20, lineY);
          currentX += 20 + shippingTextWidth + 12;
        }
        
        if (priceList.delivery_conditions) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(75, 85, 99);
          doc.text('Tempi di consegna:', currentX, lineY);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          doc.text(priceList.delivery_conditions, currentX + 35, lineY);
        }
        
        // Marchio allineato a destra
        if (priceList.brand_conditions) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(75, 85, 99);
          const marchioText = `Marchio: ${priceList.brand_conditions}`;
          doc.text(marchioText, pageWidth - margin - 5, lineY, { align: 'right' });
        }
        
        conditionsY += boxHeight + 5;
      }

      // 6. CAMPO ACCETTAZIONE ORDINE
      const acceptanceY = conditionsY + 10;
      
      // Rettangolo per accettazione ordine
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(pageWidth - 60, acceptanceY, 50, 25);
      
      // Titolo del campo
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('ACCETTAZIONE ORDINE', pageWidth - 55, acceptanceY + 5);
      
      // Solo campo Data
      doc.setLineWidth(0.3);
      doc.line(pageWidth - 55, acceptanceY + 10, pageWidth - 15, acceptanceY + 10);
      doc.text('Data', pageWidth - 50, acceptanceY + 15);
      
      // Spazio bianco per firma e timbro

      // 6.5. NOTA CODICI (Card gialla con testo rosso - più piccola)
      const noteY = acceptanceY + 35;
      const noteBoxHeight = 8; // Ridotto da 12 a 8
      doc.setFillColor(255, 247, 237); // bg-yellow-50
      doc.roundedRect(margin, noteY, contentWidth, noteBoxHeight, 2, 2, 'F');
      doc.setDrawColor(251, 191, 36); // border-yellow-200
      doc.roundedRect(margin, noteY, contentWidth, noteBoxHeight, 2, 2, 'D');
      
      doc.setFontSize(7); // Ridotto da 9 a 7
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38); // text-red-600
      const noteText = "I codici presenti in questo listino sono ad uso interno. I codici personalizzati del cliente verranno generati automaticamente al momento dell'ordine.";
      doc.text(noteText, pageWidth / 2, noteY + 5, { align: 'center', maxWidth: contentWidth - 10 });

      // 7. FOOTER (due colonne come HTML - dati FARMAP su una riga)
      doc.setTextColor(0, 0, 0); // Reset text color to black
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128); // text-gray-500
      let footerY = noteY + noteBoxHeight + 5;
      
      // Linea separatrice
      doc.setDrawColor(209, 213, 219); // border-gray-300
      doc.setLineWidth(0.3);
      doc.line(margin, footerY, pageWidth - margin, footerY);
      
      footerY += 5;
      
      // Colonna sinistra - tutto su una riga
      doc.text('FARMAP INDUSTRY S.r.l. - Via Nazionale, 66 - 65012 Cepagatti (PE) - P.IVA: 02244470684 - Tel: +39 085 9774028', margin, footerY);
      
      // Colonna destra
      if (priceList.valid_from) {
        doc.text(`Listino valido dal ${new Date(priceList.valid_from).toLocaleDateString('it-IT')}`, pageWidth - margin, footerY, { align: 'right' });
      }
      if (priceList.valid_until) {
        doc.text(`fino al ${new Date(priceList.valid_until).toLocaleDateString('it-IT')}`, pageWidth - margin, footerY + 4, { align: 'right' });
      }

      // Salva il PDF temporaneamente
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Crea un link temporaneo per scaricare il PDF (con cliente e data odierna)
      const today = new Date().toLocaleDateString('it-IT').replace(/\//g, '-');
      const customerName = priceList.customer?.company_name || 'Cliente';
      const fileName = `listino_${customerName.replace(/[^a-zA-Z0-9]/g, '_')}_${today}.pdf`;
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Pulisci l'URL temporaneo
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      
      // Apri il client email con le istruzioni
      const subject = `Listino Prezzi FARMAP - ${priceList.name}`;
      const body = `Gentile ${priceList.customer.company_name},

In allegato troverete il vostro listino prezzi personalizzato.

Listino: ${priceList.name}
Data: ${new Date().toLocaleDateString('it-IT')}
Prodotti inclusi: ${priceList.price_list_items?.length || 0}

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

  const handleDownloadPDF = async () => {
    if (!priceList) return;

    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = 297;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // 1. LOGO E INTESTAZIONE (identico all'HTML)
      try {
        const logoImg = new Image();
        logoImg.src = '/logo farmap industry copy.png';
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
          if (logoImg.complete) resolve(null);
        });
        // Logo a sinistra, dimensione compatte (h-6 w-auto = circa 24mm)
        doc.addImage(logoImg, 'PNG', margin, yPosition, 24, 9);
        // Titolo centrato alla stessa altezza
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(`Listino ${priceList.customer?.company_name || 'Cliente'}`, pageWidth / 2, yPosition + 6, { align: 'center' });
        yPosition += 12;
      } catch (logoError) {
        console.warn('Logo non caricato, continuo senza logo');
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(`Listino ${priceList.customer?.company_name || 'Cliente'}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 12;
      }

      // 2. DETTAGLI LISTINO (grid 2 colonne come HTML)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Listino: ${priceList.name}`, margin, yPosition);
      doc.text(`Data Creazione: ${new Date(priceList.created_at).toLocaleDateString('it-IT')}`, margin + contentWidth/2, yPosition);
      yPosition += 8;

      // 4. CARICA IMMAGINI E GENERA TABELLA
      const tableData = await Promise.all(
        priceList.price_list_items?.map(async (item) => {
          const finalPrice = calculateFinalPrice(item.price, item.discount_percentage);
          const vatRate = item.products?.category === 'Farmaci' ? 10 : 22;
          
          let photoBase64 = '';
          if (item.products?.photo_url) {
            try {
              photoBase64 = await loadImageAsBase64(item.products.photo_url);
            } catch (error) {
              console.warn('Errore nel caricamento foto:', error);
            }
          }
          
          return {
            photo: photoBase64,
            data: [
              '', // Placeholder per foto
              item.products?.code || '',
              item.products?.name || '',
              `${item.min_quantity} ${item.products?.unit || ''}`,
              item.products?.cartone || '-',
              item.products?.pallet || '-',
              item.products?.scadenza || '-',
              item.products?.ean || '-',
              `${vatRate}%`,
              `€${finalPrice.toFixed(2)}`
            ]
          };
        }) || []
      );

      // Genera la tabella con le immagini
      autoTable(doc, {
        startY: yPosition,
        head: [['Foto', 'Codice', 'Prodotto', 'MOQ', 'Cartone', 'Pedana', 'Scadenza', 'EAN', 'IVA', 'Prezzo']],
        body: tableData.map(item => item.data),
        theme: 'grid',
        headStyles: { 
          fillColor: [220, 38, 38], 
          textColor: [255, 255, 255],
          fontSize: 8
        },
        bodyStyles: { 
          fontSize: 7
        },
        columnStyles: {
          0: { cellWidth: 20 }, // Foto
          1: { cellWidth: 25 }, // Codice
          2: { cellWidth: 80 }, // Prodotto
          3: { cellWidth: 20 }, // MOQ
          4: { cellWidth: 20 }, // Cartone
          5: { cellWidth: 20 }, // Pedana
          6: { cellWidth: 25 }, // Scadenza
          7: { cellWidth: 30 }, // EAN
          8: { cellWidth: 15 }, // IVA
          9: { cellWidth: 25 }  // Prezzo Cliente
        },
        didDrawCell: (data) => {
          // Aggiungi le immagini nella colonna Foto
          if (data.column.index === 0 && data.row.index > 0) {
            const tableIndex = data.row.index - 1;
            const photoBase64 = tableData[tableIndex]?.photo;
            if (photoBase64) {
              try {
                doc.addImage(photoBase64, 'JPEG', data.cell.x + 1, data.cell.y + 1, 18, 18);
              } catch (error) {
                console.warn('Errore nell\'inserimento immagine:', error);
              }
            }
          }
        }
      });

      // 5. CONDIZIONI DI VENDITA
      const finalY = (doc as any).lastAutoTable.finalY || yPosition + 100;
      let conditionsY = finalY + 5;
      
      // Aggiungi sezione condizioni di vendita se ci sono dati
      if (priceList.payment_conditions || priceList.shipping_conditions || 
          priceList.delivery_conditions || priceList.brand_conditions) {
        
        // Box arancione (bg-orange-50, border-orange-200)
        doc.setFillColor(255, 247, 237); // bg-orange-50
        doc.setDrawColor(251, 191, 36); // border-orange-200
        doc.setLineWidth(0.5);
        const boxHeight = 25;
        doc.roundedRect(margin, conditionsY - 5, contentWidth, boxHeight, 2, 2, 'FD');
        
        // Titolo sezione
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(154, 52, 18); // text-orange-800
        doc.text('CONDIZIONI DI VENDITA', margin + 5, conditionsY + 3);
        
        // Condizioni allineate a sinistra, Marchio allineato a destra
        doc.setFontSize(8);
        let currentX = margin + 5;
        const lineY = conditionsY + 10;
        
        if (priceList.payment_conditions) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(75, 85, 99); // text-gray-600
          doc.text('Pagamento:', currentX, lineY);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          const paymentTextWidth = doc.getTextWidth(priceList.payment_conditions);
          doc.text(priceList.payment_conditions, currentX + 20, lineY);
          currentX += 20 + paymentTextWidth + 12;
        }
        
        if (priceList.shipping_conditions) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(75, 85, 99);
          doc.text('Trasporto:', currentX, lineY);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          const shippingTextWidth = doc.getTextWidth(priceList.shipping_conditions);
          doc.text(priceList.shipping_conditions, currentX + 20, lineY);
          currentX += 20 + shippingTextWidth + 12;
        }
        
        if (priceList.delivery_conditions) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(75, 85, 99);
          doc.text('Tempi di consegna:', currentX, lineY);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          doc.text(priceList.delivery_conditions, currentX + 35, lineY);
        }
        
        // Marchio allineato a destra
        if (priceList.brand_conditions) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(75, 85, 99);
          const marchioText = `Marchio: ${priceList.brand_conditions}`;
          doc.text(marchioText, pageWidth - margin - 5, lineY, { align: 'right' });
        }
        
        conditionsY += boxHeight + 5;
      }

      // 6. CAMPO ACCETTAZIONE ORDINE
      const acceptanceY = conditionsY + 10;
      
      // Rettangolo per accettazione ordine
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(pageWidth - 60, acceptanceY, 50, 25);
      
      // Titolo del campo
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('ACCETTAZIONE ORDINE', pageWidth - 55, acceptanceY + 5);
      
      // Solo campo Data
      doc.setLineWidth(0.3);
      doc.line(pageWidth - 55, acceptanceY + 10, pageWidth - 15, acceptanceY + 10);
      doc.text('Data', pageWidth - 50, acceptanceY + 15);
      
      // Spazio bianco per firma e timbro

      // 6.5. NOTA CODICI (Card gialla con testo rosso - più piccola)
      const noteY = acceptanceY + 30;
      doc.setFillColor(255, 247, 237); // bg-yellow-50
      doc.setDrawColor(251, 191, 36); // border-yellow-200
      doc.setLineWidth(0.5);
      const noteBoxHeight = 8; // Ridotto da 12 a 8
      doc.roundedRect(margin, noteY, contentWidth, noteBoxHeight, 2, 2, 'FD');
      
      doc.setFontSize(7); // Ridotto da 9 a 7
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38); // text-red-600
      const noteText = "I codici presenti in questo listino sono ad uso interno. I codici personalizzati del cliente verranno generati automaticamente al momento dell'ordine.";
      doc.text(noteText, pageWidth / 2, noteY + 5, { align: 'center', maxWidth: contentWidth - 10 });

      // 7. FOOTER (due colonne come HTML)
      doc.setTextColor(0, 0, 0); // Reset text color to black
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128); // text-gray-500
      let footerY = noteY + noteBoxHeight + 5;
      
      // Linea separatrice
      doc.setDrawColor(209, 213, 219); // border-gray-300
      doc.setLineWidth(0.3);
      doc.line(margin, footerY, pageWidth - margin, footerY);
      
      footerY += 5;
      
      // Colonna sinistra - tutto su una riga
      doc.text('FARMAP INDUSTRY S.r.l. - Via Nazionale, 66 - 65012 Cepagatti (PE) - P.IVA: 02244470684 - Tel: +39 085 9774028', margin, footerY);
      
      // Colonna destra
      if (priceList.valid_from) {
        doc.text(`Listino valido dal ${new Date(priceList.valid_from).toLocaleDateString('it-IT')}`, pageWidth - margin, footerY, { align: 'right' });
      }
      if (priceList.valid_until) {
        doc.text(`fino al ${new Date(priceList.valid_until).toLocaleDateString('it-IT')}`, pageWidth - margin, footerY + 4, { align: 'right' });
      }

      // 8. SALVA IL FILE (con cliente e data odierna)
      const today = new Date().toLocaleDateString('it-IT').replace(/\//g, '-');
      const customerName = priceList.customer?.company_name || 'Cliente';
      const fileName = `listino_${customerName.replace(/[^a-zA-Z0-9]/g, '_')}_${today}.pdf`;
      doc.save(fileName);

      addNotification({
        type: 'success',
        title: 'PDF Generato',
        message: 'Il listino è stato scaricato come PDF'
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Errore nella generazione del PDF'
      });
    }
  };

  const calculateFinalPrice = (basePrice: number, discount: number) => {
    return basePrice * (1 - discount / 100);
  };

  const loadImageAsBase64 = async (url: string): Promise<string> => {
    try {
      // Se è già un data URL, restituiscilo direttamente
      if (url.startsWith('data:')) {
        return url;
      }

      // Usa fetch per evitare problemi CORS con Supabase Storage
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Converti PNG a JPEG per compatibilità migliore con jsPDF
          if (result.startsWith('data:image/png')) {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = img.width;
              canvas.height = img.height;
              ctx?.drawImage(img, 0, 0);
              const dataURL = canvas.toDataURL('image/jpeg', 0.85);
              resolve(dataURL);
            };
            img.onerror = () => reject(new Error('Failed to convert PNG to JPEG'));
            img.src = result;
          } else {
            resolve(result);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read image blob'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading image:', error);
      throw error;
    }
  };



  if (!isOpen) return null;

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
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
            padding: 12px 16px;
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
            <div className="print-content">
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
                    {priceList.price_list_items.map((item, index) => {
                      const finalPrice = calculateFinalPrice(item.price, item.discount_percentage);
                      const vatRate = item.products.category === 'Farmaci' ? 10 : 22; // Example VAT logic
                      
                      return (
                        <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="border border-gray-300 p-0 text-center align-top">
                            <div className="w-16 h-16 bg-gray-200 overflow-hidden">
                              {item.products.photo_url ? (
                                <img 
                                  src={item.products.photo_url} 
                                  alt={item.products.name}
                                  className="w-full h-full object-contain"
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
                    })}
                  </tbody>
                </table>

                {/* Condizioni di Vendita */}
                {(priceList.payment_conditions || priceList.shipping_conditions || 
                  priceList.delivery_conditions || priceList.brand_conditions) && (
                  <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <h3 className="text-sm font-bold text-orange-800 mb-2">CONDIZIONI DI VENDITA</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
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
                <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
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
                disabled={!priceList?.customer?.email}
              >
                <Mail className="w-4 h-4" />
                <span>Invia Email</span>
              </Button>
              <Button 
                onClick={handleDownloadPDF} 
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
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