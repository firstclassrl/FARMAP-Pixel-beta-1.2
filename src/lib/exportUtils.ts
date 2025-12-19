import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExportColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

type SortField = 'code' | 'name';
type SortDirection = 'asc' | 'desc';

type PriceListExcelProduct = {
  id?: string;
  code?: string;
  name?: string;
  description?: string | null;
  category?: string | null;
  unit?: string | null;
  photo_url?: string | null;
  photo_thumb_url?: string | null;
  cartone?: string | null;
  pallet?: string | null;
  ean?: string | null;
  scadenza?: string | null;
};

type PriceListExcelItem = {
  id?: string;
  price: number;
  discount_percentage: number;
  min_quantity: number;
  products: PriceListExcelProduct;
};

type PriceListExcelData = {
  id?: string;
  name: string;
  created_at: string;
  valid_from?: string | null;
  valid_until?: string | null;
  print_conditions?: boolean | null;
  payment_conditions?: string | null;
  shipping_conditions?: string | null;
  delivery_conditions?: string | null;
  brand_conditions?: string | null;
  customer?: { company_name?: string | null } | null;
  price_list_items: PriceListExcelItem[];
};

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

export const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return '';

  // Gestione stringhe nel formato ISO (yyyy-mm-dd) o con time
  let d: Date;
  if (date instanceof Date) {
    d = date;
  } else if (typeof date === 'string') {
    // Se è già nel formato gg/mm/aaaa la restituiamo così com'è
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      return date;
    }
    d = new Date(date);
  } else {
    return '';
  }

  if (Number.isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  // Formato italiano richiesto: GG/MM/AAAA
  return `${day}/${month}/${year}`;
};

export const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '€0,00';
  }
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatBoolean = (value: boolean) => {
  return value ? 'Sì' : 'No';
};

const escapeHtml = (value: unknown) => {
  const str = String(value ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const resolveAbsoluteUrl = (url?: string | null) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  // relative path
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
  }
  return trimmed;
};

const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image blob'));
    reader.readAsDataURL(blob);
  });
};

const tryResizeImageToJpegDataUrl = async (
  blob: Blob,
  maxSize = 120,
  quality = 0.75
): Promise<string | null> => {
  try {
    // Convert blob to data URL first
    const dataUrl = await blobToDataUrl(blob);
    const img = new Image();
    img.decoding = 'async';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image for resizing'));
      img.src = dataUrl;
    });

    let width = img.width || maxSize;
    let height = img.height || maxSize;
    if (width <= 0 || height <= 0) {
      width = maxSize;
      height = maxSize;
    }

    // Maintain aspect ratio
    if (width > height) {
      if (width > maxSize) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      }
    } else {
      if (height > maxSize) {
        width = Math.round((width * maxSize) / height);
        height = maxSize;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, width, height);

    const outBlob: Blob | null = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
    });
    if (!outBlob) return null;

    return await blobToDataUrl(outBlob);
  } catch {
    return null;
  }
};

const asyncPool = async <T, R>(
  poolLimit: number,
  items: T[],
  iteratorFn: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  const ret: Promise<R>[] = [];
  const executing: Promise<void>[] = [];
  for (let i = 0; i < items.length; i++) {
    const p = Promise.resolve().then(() => iteratorFn(items[i], i));
    ret.push(p);

    if (poolLimit <= items.length) {
      const e: Promise<void> = p.then(() => undefined, () => undefined);
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
        // remove settled
        for (let j = executing.length - 1; j >= 0; j--) {
          // best-effort cleanup: settled promises won't block race anyway
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          executing[j].then(() => {}, () => {});
        }
      }
    }
  }
  return Promise.all(ret);
};

const computeFinalPrice = (basePrice: number, discount: number) => {
  return basePrice * (1 - discount / 100);
};

const sortItems = (items: PriceListExcelItem[], sortField: SortField, sortDirection: SortDirection) => {
  const sorted = [...items].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'code') {
      comparison = (a.products.code || '').localeCompare(b.products.code || '');
    } else {
      comparison = (a.products.name || '').localeCompare(b.products.name || '');
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  return sorted;
};

export async function exportPriceListToXlsHtml(args: {
  priceList: PriceListExcelData;
  filename: string;
  sortField?: SortField;
  sortDirection?: SortDirection;
  selectedCategory?: string;
  printByCategory?: boolean;
}): Promise<boolean> {
  try {
    const {
      priceList,
      filename,
      sortField = 'name',
      sortDirection = 'asc',
      selectedCategory = 'all',
      printByCategory = false,
    } = args;

    const items = Array.isArray(priceList.price_list_items) ? priceList.price_list_items : [];

    // Filter
    const filteredItems = items.filter((item) => {
      if (selectedCategory === 'all') return true;
      return (item.products.category || '') === selectedCategory;
    });

    // Image prefetch (unique URLs) with caching
    const urlByKey = new Map<string, string>();
    for (const item of filteredItems) {
      const url = item.products.photo_thumb_url || item.products.photo_url;
      if (url) {
        const abs = resolveAbsoluteUrl(url);
        if (abs) urlByKey.set(abs, abs);
      }
    }

    const uniqueUrls = Array.from(urlByKey.values());
    const dataUrlCache = new Map<string, string | null>();

    await asyncPool(6, uniqueUrls, async (url) => {
      try {
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) {
          dataUrlCache.set(url, null);
          return null;
        }
        const blob = await res.blob();
        // Resize to keep file lightweight
        const resized = await tryResizeImageToJpegDataUrl(blob, 120, 0.75);
        dataUrlCache.set(url, resized);
        return resized;
      } catch {
        dataUrlCache.set(url, null);
        return null;
      }
    });

    // Optional logo
    let logoDataUrl: string | null = null;
    try {
      const logoUrl = resolveAbsoluteUrl('/logo farmap industry copy.png');
      const res = await fetch(logoUrl, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        logoDataUrl = await tryResizeImageToJpegDataUrl(blob, 180, 0.85);
      }
    } catch {
      logoDataUrl = null;
    }

    const customerName = priceList.customer?.company_name || 'Cliente';
    const createdAt = new Date(priceList.created_at).toLocaleDateString('it-IT');
    const validFrom = priceList.valid_from ? new Date(priceList.valid_from).toLocaleDateString('it-IT') : '';
    const validUntil = priceList.valid_until ? new Date(priceList.valid_until).toLocaleDateString('it-IT') : '';

    const palette = [
      '#DBEAFE', // blue-100
      '#DCFCE7', // green-100
      '#FEF9C3', // yellow-100
      '#F3E8FF', // purple-100
      '#FCE7F3', // pink-100
      '#E0E7FF', // indigo-100
      '#CCFBF1', // teal-100
      '#FFEDD5', // orange-100
    ];

    const headerHtml = `
      <table border="0" cellpadding="0" cellspacing="0" style="width:100%; margin-bottom:8px;">
        <tr>
          <td style="text-align:center; padding:6px 0;">
            ${logoDataUrl ? `<img src="${logoDataUrl}" alt="Farmap" style="height:26px; vertical-align:middle; margin-right:8px;" />` : ''}
            <span style="font-size:18px; font-weight:bold; color:#374151; vertical-align:middle;">
              Listino ${escapeHtml(customerName)}
            </span>
          </td>
        </tr>
      </table>
      <table border="0" cellpadding="0" cellspacing="0" style="width:100%; margin-bottom:10px;">
        <tr>
          <td style="font-size:12px; color:#374151; padding:2px 0;">
            <b style="color:#4B5563;">Listino:</b> ${escapeHtml(priceList.name)}
          </td>
          <td style="font-size:12px; color:#374151; padding:2px 0; text-align:right;">
            <b style="color:#4B5563;">Data Creazione:</b> ${escapeHtml(createdAt)}
          </td>
        </tr>
      </table>
    `;

    const tableHeader = `
      <tr style="background:#dc2626; color:#ffffff; font-weight:600;">
        <th style="border:1px solid #d1d5db; padding:6px 8px; text-align:center; width:90px;">Foto</th>
        <th style="border:1px solid #d1d5db; padding:6px 8px; text-align:left; width:90px;">Codice</th>
        <th style="border:1px solid #d1d5db; padding:6px 8px; text-align:left; width:320px;">Prodotto</th>
        <th style="border:1px solid #d1d5db; padding:6px 8px; text-align:center; width:80px;">MOQ</th>
        <th style="border:1px solid #d1d5db; padding:6px 8px; text-align:center; width:80px;">Cartone</th>
        <th style="border:1px solid #d1d5db; padding:6px 8px; text-align:center; width:80px;">Pedana</th>
        <th style="border:1px solid #d1d5db; padding:6px 8px; text-align:center; width:100px;">Scadenza</th>
        <th style="border:1px solid #d1d5db; padding:6px 8px; text-align:center; width:140px;">EAN</th>
        <th style="border:1px solid #d1d5db; padding:6px 8px; text-align:center; width:70px;">IVA</th>
        <th style="border:1px solid #d1d5db; padding:6px 8px; text-align:right; width:90px;">Prezzo</th>
      </tr>
    `;

    let bodyRows = '';
    let rowIndex = 0;

    const renderItemRow = (item: PriceListExcelItem, idx: number) => {
      const p = item.products || ({} as PriceListExcelProduct);
      const finalPrice = computeFinalPrice(item.price, item.discount_percentage);
      const vatRate = (p.category || '') === 'Farmaci' ? 10 : 22;
      const imgUrl = p.photo_thumb_url || p.photo_url;
      const abs = resolveAbsoluteUrl(imgUrl);
      const imgDataUrl = abs ? dataUrlCache.get(abs) : null;
      const bg = idx % 2 === 0 ? '#f9fafb' : '#ffffff';

      const imgCell = imgDataUrl
        ? `<img src="${imgDataUrl}" alt="${escapeHtml(p.name || '')}" style="width:64px; height:64px; object-fit:contain; display:block; margin:0 auto;" />`
        : `<div style="width:64px; height:64px; display:flex; align-items:center; justify-content:center; color:#9ca3af; font-size:11px; margin:0 auto;">N/A</div>`;

      const desc = p.description ? `<div style="color:#6b7280; font-size:11px; margin-top:2px;">${escapeHtml(p.description)}</div>` : '';

      return `
        <tr style="background:${bg};">
          <td style="border:1px solid #d1d5db; padding:0; text-align:center; vertical-align:top;">${imgCell}</td>
          <td style="border:1px solid #d1d5db; padding:6px 8px; font-family:monospace; font-size:12px; vertical-align:top;">${escapeHtml(p.code || '')}</td>
          <td style="border:1px solid #d1d5db; padding:6px 8px; font-size:12px; vertical-align:top;">
            <div style="font-weight:600;">${escapeHtml(p.name || '')}</div>
            ${desc}
          </td>
          <td style="border:1px solid #d1d5db; padding:6px 8px; text-align:center; font-size:12px; vertical-align:top;">
            ${escapeHtml(item.min_quantity)} ${escapeHtml(p.unit || '')}
          </td>
          <td style="border:1px solid #d1d5db; padding:6px 8px; text-align:center; font-size:12px; vertical-align:top;">${escapeHtml(p.cartone || '-')}</td>
          <td style="border:1px solid #d1d5db; padding:6px 8px; text-align:center; font-size:12px; vertical-align:top;">${escapeHtml(p.pallet || '-')}</td>
          <td style="border:1px solid #d1d5db; padding:6px 8px; text-align:center; font-size:12px; vertical-align:top;">${escapeHtml(p.scadenza || '-')}</td>
          <td style="border:1px solid #d1d5db; padding:6px 8px; text-align:center; font-family:monospace; font-size:12px; vertical-align:top;">${escapeHtml(p.ean || '-')}</td>
          <td style="border:1px solid #d1d5db; padding:6px 8px; text-align:center; font-size:12px; vertical-align:top;">${escapeHtml(vatRate)}%</td>
          <td style="border:1px solid #d1d5db; padding:6px 8px; text-align:right; font-size:12px; font-weight:600; color:#dc2626; vertical-align:top;">
            ${escapeHtml(formatCurrency(finalPrice))}
          </td>
        </tr>
      `;
    };

    if (printByCategory) {
      const grouped = filteredItems.reduce<Record<string, PriceListExcelItem[]>>((acc, it) => {
        const cat = it.products.category || 'Senza categoria';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(it);
        return acc;
      }, {});
      const categories = Object.keys(grouped).sort();
      for (const [catIndex, cat] of categories.entries()) {
        const color = palette[catIndex % palette.length];
        bodyRows += `
          <tr style="background:${color};">
            <td colspan="10" style="border:1px solid #d1d5db; padding:4px 8px; font-weight:700; font-size:12px; color:#111827;">
              ${escapeHtml(cat)}
            </td>
          </tr>
        `;
        const sorted = sortItems(grouped[cat], sortField, sortDirection);
        for (const it of sorted) {
          bodyRows += renderItemRow(it, rowIndex++);
        }
      }
    } else {
      const sorted = sortItems(filteredItems, sortField, sortDirection);
      for (const it of sorted) {
        bodyRows += renderItemRow(it, rowIndex++);
      }
    }

    // Conditions block
    const shouldPrintConditions = priceList.print_conditions !== false;
    const hasConditions =
      !!(priceList.payment_conditions || priceList.shipping_conditions || priceList.delivery_conditions || priceList.brand_conditions);

    const conditionsHtml =
      shouldPrintConditions && hasConditions
        ? `
        <table border="0" cellpadding="0" cellspacing="0" style="width:100%; margin-top:10px;">
          <tr>
            <td style="background:#fff7ed; border:1px solid #fed7aa; padding:8px; font-size:12px;">
              <div style="font-weight:700; color:#92400e; margin-bottom:6px;">CONDIZIONI DI VENDITA</div>
              <div style="color:#374151;">
                ${priceList.payment_conditions ? `<b>Pagamento:</b> ${escapeHtml(priceList.payment_conditions)}&nbsp;&nbsp;&nbsp;` : ''}
                ${priceList.shipping_conditions ? `<b>Trasporto:</b> ${escapeHtml(priceList.shipping_conditions)}&nbsp;&nbsp;&nbsp;` : ''}
                ${priceList.delivery_conditions ? `<b>Tempi di consegna:</b> ${escapeHtml(priceList.delivery_conditions)}&nbsp;&nbsp;&nbsp;` : ''}
                ${priceList.brand_conditions ? `<b>Marchio:</b> ${escapeHtml(priceList.brand_conditions)}` : ''}
              </div>
            </td>
          </tr>
        </table>
      `
        : '';

    const noteHtml = `
      <table border="0" cellpadding="0" cellspacing="0" style="width:100%; margin-top:14px;">
        <tr>
          <td style="text-align:center; color:#dc2626; font-weight:600; font-size:12px;">
            I codici presenti in questo listino sono ad uso interno. I codici personalizzati del cliente verranno generati automaticamente al momento dell'ordine.
          </td>
        </tr>
      </table>
    `;

    const footerHtml = `
      <table border="0" cellpadding="0" cellspacing="0" style="width:100%; margin-top:12px;">
        <tr>
          <td style="border-top:1px solid #d1d5db; padding-top:8px; font-size:11px; color:#6b7280;">
            FARMAP INDUSTRY S.r.l. - Via Nazionale, 66 - 65012 Cepagatti (PE) - P.IVA: 02244470684 - Tel: +39 085 9774028
          </td>
          <td style="border-top:1px solid #d1d5db; padding-top:8px; font-size:11px; color:#6b7280; text-align:right;">
            ${validFrom ? `Listino valido dal ${escapeHtml(validFrom)}<br/>` : ''}
            ${validUntil ? `fino al ${escapeHtml(validUntil)}` : ''}
          </td>
        </tr>
      </table>
    `;

    // IMPORTANT: for Excel to recognize HTML-as-XLS, the document must:
    // - start at byte 0 with <html ...> (no indentation/newlines before it)
    // - include Excel namespaces + the MSO conditional XML workbook block
    const worksheetName = 'Listino';
    const html =
      '\ufeff' +
      `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:x="urn:schemas-microsoft-com:office:excel"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<!--[if gte mso 9]><xml>
<x:ExcelWorkbook>
  <x:ExcelWorksheets>
    <x:ExcelWorksheet>
      <x:Name>${escapeHtml(worksheetName)}</x:Name>
      <x:WorksheetOptions>
        <x:DisplayGridlines/>
      </x:WorksheetOptions>
    </x:ExcelWorksheet>
  </x:ExcelWorksheets>
</x:ExcelWorkbook>
</xml><![endif]-->
<style>
table { border-collapse: collapse; }
</style>
</head>
<body>
${headerHtml}
<table border="0" cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse;">
${tableHeader}
${bodyRows}
</table>
${conditionsHtml}
${noteHtml}
${footerHtml}
</body>
</html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    saveAs(blob, `${filename}.xls`);
    return true;
  } catch (error) {
    console.error('Error exporting price list to XLS HTML:', error);
    return false;
  }
}

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