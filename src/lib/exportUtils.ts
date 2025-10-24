import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExportColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

export const exportToExcel = <T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
) => {
  try {
    // Prepare data for export
    const exportData = data.map(item => {
      const row: Record<string, any> = {};
      columns.forEach(col => {
        const value = item[col.key];
        row[col.label] = col.format ? col.format(value) : value;
      });
      return row;
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Auto-size columns
    const colWidths = columns.map(col => ({
      wch: Math.max(col.label.length, 15)
    }));
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Data');

    // Generate Excel file and download
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    saveAs(blob, `${filename}.xlsx`);
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
};

export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
) => {
  try {
    // Prepare CSV headers
    const headers = columns.map(col => col.label).join(',');
    
    // Prepare CSV rows
    const rows = data.map(item => {
      return columns.map(col => {
        const value = item[col.key];
        const formattedValue = col.format ? col.format(value) : value;
        // Escape commas and quotes in CSV
        return `"${String(formattedValue || '').replace(/"/g, '""')}"`;
      }).join(',');
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
    return true;
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return false;
  }
};

export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('it-IT');
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

export const formatBoolean = (value: boolean) => {
  return value ? 'Sì' : 'No';
};
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// Assicurati che 'jspdf' e 'jspdf-autotable' siano importati in cima al file.

// ... (le tue funzioni exportToExcel, exportToCSV, etc. rimangono qui) ...


// NUOVA FUNZIONE PER ESPORTARE L'ORDINE IN PDF
export const exportOrderToPDF = (order: any) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // 1. LOGO ORIGINALE FARMAP (senza compressione per qualità)
    try {
      // Carica il logo originale senza compressione
      const logoImg = new Image();
      logoImg.src = '/logo_farmap industry.jpg';
      doc.addImage(logoImg, 'JPEG', margin, yPosition, 40, 12);
      yPosition += 20;
    } catch (logoError) {
      console.warn('Logo non caricato, continuo senza logo');
      yPosition += 10;
    }

    // 2. INTESTAZIONE
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDINE DI ACQUISTO', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // 3. DETTAGLI ORDINE E CLIENTE (layout compatto)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Dettagli ordine e cliente in due colonne
    doc.text(`Numero Ordine: ${order.order_number}`, margin, yPosition);
    doc.text(`Data Ordine: ${formatDate(order.order_date)}`, margin + contentWidth/2, yPosition);
    yPosition += 6;
    
    doc.text(`Cliente: ${order.customers.company_name}`, margin, yPosition);
    doc.text(`Codice: ${order.customers.id.slice(0, 8)}`, margin + contentWidth/2, yPosition);
    yPosition += 6;
    
    doc.text(`Contatto: ${order.customers.contact_person}`, margin, yPosition);
    doc.text(`Telefono: ${order.customers.phone}`, margin + contentWidth/2, yPosition);
    yPosition += 6;
    
    doc.text(`Indirizzo: ${order.customers.address}`, margin, yPosition);
    yPosition += 10;
    
    // 4. TABELLA PRODOTTI (con griglia nera)
    autoTable(doc, {
      startY: yPosition,
      head: [['Codice', 'Prodotto', 'Quantità', 'Prezzo', 'Totale']],
      body: order.order_items.map((item: any) => [
        item.products.code,
        item.products.name,
        `${item.quantity} ${item.products.unit}`,
        formatCurrency(item.unit_price),
        formatCurrency(item.total_price)
      ]),
      theme: 'grid',
      headStyles: { 
        fillColor: [0, 0, 0], 
        textColor: [255, 255, 255],
        lineColor: [0, 0, 0],
        lineWidth: 0.5
      },
      bodyStyles: { 
        lineColor: [0, 0, 0],
        lineWidth: 0.5
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 60 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 }
      }
    });
    
    // 5. TOTALI IN UNA RIGA (layout compatto)
    const finalY = (doc as any).lastAutoTable.finalY + 5;
    const totalAmount = formatCurrency(order.total_amount);
    const taxAmount = formatCurrency(order.tax_amount);
    const finalTotal = formatCurrency(order.total_amount + order.tax_amount);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotale: ${totalAmount} | IVA: ${taxAmount} | TOTALE: ${finalTotal}`, margin, finalY);
    
    // 6. NOTE (se presenti)
    if (order.notes) {
      yPosition = finalY + 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTE:', margin, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(order.notes, contentWidth);
      doc.text(splitNotes, margin, yPosition);
    }

    // 7. SALVA IL FILE
    doc.save(`ordine-${order.order_number}.pdf`);

  } catch (error) {
    console.error('Error creating PDF:', error);
    throw error;
  }
};