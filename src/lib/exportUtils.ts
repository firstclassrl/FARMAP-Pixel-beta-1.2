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
export const exportOrderToPDF = (order: any, logo: string) => {
  try {
    const doc = new jsPDF();

    // 1. AGGIUNGI IL LOGO (CON COMPRESSIONE OTTIMALE)
    // Questa è la soluzione al problema dei 14 MB.
    // 'FAST' dice a jsPDF di comprimere l'immagine.
    // Assicurati che 'logo' sia il percorso del tuo logo ottimizzato da 89kb.
    doc.addImage(logo, 'PNG', 15, 10, 50, 15, undefined, 'FAST');

    // 2. INTESTAZIONE
    doc.setFontSize(20);
    doc.text('ORDINE DI ACQUISTO', 105, 40, { align: 'center' });

    // 3. DETTAGLI ORDINE E CLIENTE
    doc.setFontSize(10);
    doc.text(`Numero Ordine: ${order.order_number}`, 15, 60);
    doc.text(`Data Ordine: ${formatDate(order.order_date)}`, 140, 60);
    doc.text(`Nome Cliente: ${order.customers.company_name}`, 15, 70);
    doc.text(`Codice Cliente: ${order.customers.id.slice(0, 8)}`, 140, 70);
    
    // 4. TABELLA PRODOTTI (usando il plugin autoTable)
    autoTable(doc, {
      startY: 85,
      head: [['Codice Prodotto', 'Nome / Descrizione', 'Quantità', 'Prezzo Unitario', 'Totale']],
      body: order.order_items.map((item: any) => [
        item.products.code,
        item.products.name,
        `${item.quantity} ${item.products.unit}`,
        formatCurrency(item.unit_price),
        formatCurrency(item.total_price)
      ]),
      theme: 'striped'
    });
    
    // 5. CALCOLO TOTALI
    const finalY = (doc as any).lastAutoTable.finalY; // Posizione dopo la tabella
    const totalAmount = formatCurrency(order.total_amount);
    const taxAmount = formatCurrency(order.tax_amount);
    const finalTotal = formatCurrency(order.total_amount + order.tax_amount);

    doc.setFontSize(12);
    doc.text('Subtotale (Imponibile):', 140, finalY + 10);
    doc.text(totalAmount, 200, finalY + 10, { align: 'right' });
    
    doc.text('IVA:', 140, finalY + 17);
    doc.text(taxAmount, 200, finalY + 17, { align: 'right' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Totale Ordine:', 140, finalY + 25);
    doc.text(finalTotal, 200, finalY + 25, { align: 'right' });

    // 6. SALVA IL FILE
    doc.save(`ordine-${order.order_number}.pdf`);

  } catch (error) {
    console.error('Error creating PDF:', error);
    // Qui potresti chiamare una notifica di errore
  }
};