import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Load logo as base64
let LOGO_BASE64 = null;
try {
  // Logo is in public folder, which is 2 levels up from server/pdf-generator
  const logoPath = join(__dirname, '..', '..', 'public', 'logo farmap industry copy.png');
  const logoBuffer = readFileSync(logoPath);
  LOGO_BASE64 = logoBuffer.toString('base64');
  console.log('🔵 Logo loaded successfully, size:', logoBuffer.length, 'bytes');
} catch (error) {
  console.log('🔴 Error loading logo, using text fallback:', error.message);
  LOGO_BASE64 = null;
}

app.use(cors({
  origin: '*', // Permetti tutte le origini
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Helper functions
const calculateFinalPrice = (basePrice, discount) => {
  return basePrice * (1 - discount / 100);
};

const formatCurrency = (value) => {
  return `€${value.toFixed(2)}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT');
};

// Generate HTML template from price list data
const generateHTML = (priceList, options = {}) => {
  const { printByCategory = false, groupedByCategory = null, categoryOrder = [] } = options;
  
  let itemsHTML = '';
  let globalIndex = 0;
  
  if (printByCategory && groupedByCategory && categoryOrder.length > 0) {
    // Genera HTML raggruppato per categoria
    categoryOrder.forEach((category) => {
      const categoryItems = groupedByCategory[category] || [];
      
      // Intestazione categoria
      itemsHTML += `
        <tr style="background-color: #dbeafe; page-break-inside: avoid;">
          <td colspan="10" style="border: 1px solid #93c5fd; padding: 12px 16px; font-weight: bold; font-size: 13px; color: #1e40af;">
            ${category}
          </td>
        </tr>
      `;
      
      // Prodotti della categoria
      categoryItems.forEach((item) => {
    const finalPrice = calculateFinalPrice(item.price, item.discount_percentage);
    const vatRate = item.products?.category === 'Farmaci' ? 10 : 22;
    // Usa thumbnail se disponibile, altrimenti fallback a photo_url
    // photo_thumb_url potrebbe non esistere ancora per prodotti vecchi
    const photoUrl = (item.products?.photo_thumb_url && item.products.photo_thumb_url.trim() !== '') 
      ? item.products.photo_thumb_url 
      : (item.products?.photo_url || '');
        const rowBgColor = globalIndex % 2 === 0 ? '#f9fafb' : '#ffffff';
        
        itemsHTML += `
          <tr style="background-color: ${rowBgColor};">
            <td style="border: 1px solid #e5e7eb; padding: 0; text-align: center; vertical-align: top;">
              <div style="width: 48px; min-height: 48px; background-color: #e5e7eb; overflow: hidden; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                ${photoUrl ? 
                  `<img src="${photoUrl}" alt="${item.products?.name || ''}" class="product-image" data-original-src="${photoUrl}" crossOrigin="anonymous" style="max-height: 48px; max-width: 48px; width: auto; height: auto; object-fit: contain; display: block; image-rendering: auto;" loading="lazy" />` :
                  `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 10px; color: #9ca3af;">N/A</span>
                  </div>`
                }
              </div>
            </td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; font-family: monospace; font-size: 11px; vertical-align: top;">
              ${item.products?.code || ''}
            </td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; vertical-align: top;">
              <div>
                <div style="font-weight: 500; font-size: 11px;">${item.products?.name || ''}</div>
                ${item.products?.description ? 
                  `<div style="font-size: 11px; color: #6b7280; margin-top: 4px;">${item.products.description}</div>` : ''
                }
              </div>
            </td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-size: 11px; vertical-align: top;">
              ${item.min_quantity} ${item.products?.unit || ''}
            </td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-size: 11px; vertical-align: top;">
              ${item.products?.cartone || '-'}
            </td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-size: 11px; vertical-align: top;">
              ${item.products?.pallet || '-'}
            </td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-size: 11px; vertical-align: top;">
              ${item.products?.scadenza || '-'}
            </td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-size: 11px; font-family: monospace; vertical-align: top;">
              ${item.products?.ean || '-'}
            </td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-size: 11px; vertical-align: top;">
              ${vatRate}%
            </td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right; font-weight: 500; color: #dc2626; font-size: 11px; vertical-align: top;">
              ${formatCurrency(finalPrice)}
            </td>
          </tr>
        `;
        globalIndex++;
      });
    });
  } else {
    // Comportamento normale: lista piatta
    const items = priceList.price_list_items || [];
    
    itemsHTML = items.map((item, index) => {
    const finalPrice = calculateFinalPrice(item.price, item.discount_percentage);
    const vatRate = item.products?.category === 'Farmaci' ? 10 : 22;
    // Usa thumbnail se disponibile, altrimenti fallback a photo_url
    // photo_thumb_url potrebbe non esistere ancora per prodotti vecchi
    const photoUrl = (item.products?.photo_thumb_url && item.products.photo_thumb_url.trim() !== '') 
      ? item.products.photo_thumb_url 
      : (item.products?.photo_url || '');
      
      return `
        <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : '#ffffff'};">
        <td style="border: 1px solid #e5e7eb; padding: 0; text-align: center; vertical-align: top;">
          <div style="width: 48px; min-height: 48px; background-color: #e5e7eb; overflow: hidden; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            ${photoUrl ? 
              `<img src="${photoUrl}" alt="${item.products?.name || ''}" class="product-image" data-original-src="${photoUrl}" crossOrigin="anonymous" style="max-height: 48px; max-width: 48px; width: auto; height: auto; object-fit: contain; display: block; image-rendering: auto;" loading="lazy" />` :
              `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 10px; color: #9ca3af;">N/A</span>
              </div>`
            }
          </div>
        </td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; font-family: monospace; font-size: 11px; vertical-align: top;">
            ${item.products?.code || ''}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; vertical-align: top;">
            <div>
              <div style="font-weight: 500; font-size: 11px;">${item.products?.name || ''}</div>
              ${item.products?.description ? 
                `<div style="font-size: 11px; color: #6b7280; margin-top: 4px;">${item.products.description}</div>` : ''
              }
            </div>
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-size: 11px; vertical-align: top;">
            ${item.min_quantity} ${item.products?.unit || ''}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-size: 11px; vertical-align: top;">
            ${item.products?.cartone || '-'}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-size: 11px; vertical-align: top;">
            ${item.products?.pallet || '-'}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-size: 11px; vertical-align: top;">
            ${item.products?.scadenza || '-'}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-size: 11px; font-family: monospace; vertical-align: top;">
            ${item.products?.ean || '-'}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-size: 11px; vertical-align: top;">
            ${vatRate}%
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right; font-weight: 500; color: #dc2626; font-size: 11px; vertical-align: top;">
            ${formatCurrency(finalPrice)}
          </td>
        </tr>
      `;
    }).join('');
  }

  const conditionsHTML = (priceList.payment_conditions || priceList.shipping_conditions || 
    priceList.delivery_conditions || priceList.brand_conditions) ? `
    <div class="conditions-section" style="margin-top: 8px; padding: 8px; background-color: #fff7ed; border: 1px solid #fbbf24; border-radius: 4px;">
      <h3 style="font-size: 10px; font-weight: bold; color: #9a3412; margin-bottom: 4px;">CONDIZIONI DI VENDITA</h3>
      <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 16px 8px; font-size: 11px;">
        ${priceList.payment_conditions ? `
          <div>
            <span style="font-weight: bold; color: #4b5563;">Pagamento:</span>
            <span style="margin-left: 4px;">${priceList.payment_conditions}</span>
          </div>
        ` : ''}
        ${priceList.shipping_conditions ? `
          <div>
            <span style="font-weight: bold; color: #4b5563;">Trasporto:</span>
            <span style="margin-left: 4px;">${priceList.shipping_conditions}</span>
          </div>
        ` : ''}
        ${priceList.delivery_conditions ? `
          <div>
            <span style="font-weight: bold; color: #4b5563;">Tempi di consegna:</span>
            <span style="margin-left: 4px;">${priceList.delivery_conditions}</span>
          </div>
        ` : ''}
        ${priceList.brand_conditions ? `
          <div style="margin-left: auto;">
            <span style="font-weight: bold; color: #4b5563;">Marchio:</span>
            <span style="margin-left: 4px;">${priceList.brand_conditions}</span>
          </div>
        ` : ''}
      </div>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Listino ${priceList.customer?.company_name || 'Cliente'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    /* Forza rendering vettoriale - evita rasterizzazione */
    body, html {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      transform: none !important;
      will-change: auto !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: white;
      padding: 0;
      margin: 0;
    }
    @page {
      size: A4 landscape;
      margin: 10mm;
    }
    
    .print-page {
      width: 277mm; /* 297mm - 20mm (margini) */
      background: white;
      padding: 24px;
      margin: 0;
      page-break-after: auto;
      page-break-inside: auto; /* Permetti paginazione del contenuto */
    }
    .print-header {
      text-align: center;
      margin-bottom: 8px;
      border-bottom: 2px solid #dc2626;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header-content {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
    }
    .header-content img {
      height: 24px;
      width: auto;
      margin-right: 8px;
    }
    .header-content h1 {
      font-size: 18px;
      font-weight: bold;
      color: #374151;
    }
    .customer-info {
      margin-bottom: 16px;
    }
    .customer-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      font-size: 12px;
    }
    .print-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    /* Ripeti header su ogni pagina */
    .print-table thead {
      display: table-header-group;
    }
    .print-table th {
      background-color: #dc2626;
      color: white;
      font-weight: 600;
      font-size: 12px;
      padding: 12px 8px;
      border: 1px solid #e5e7eb;
    }
    .print-table td {
      border: 1px solid #e5e7eb;
      padding: 8px;
    }
    /* Elementi che devono apparire solo nell'ultima pagina */
    .conditions-section,
    .acceptance-box,
    .note-section,
    .footer {
      page-break-inside: avoid;
      page-break-before: avoid;
    }
    .note-section {
      margin-top: 16px;
      padding: 8px;
    }
    .note-text {
      font-size: 11px;
      font-weight: 500;
      color: #dc2626;
      text-align: center;
    }
    .footer {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #d1d5db;
      font-size: 11px;
      color: #6b7280;
      display: flex;
      justify-content: space-between;
    }
    
    /* Permetti paginazione della tabella mantenendo righe intere */
    .print-table {
      page-break-inside: auto;
    }
    /* Ogni riga prodotto rimane intera su una singola pagina */
    .print-table tbody tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    /* Header ripetuto su ogni pagina */
    .print-table thead {
      display: table-header-group;
    }
    .acceptance-box {
      margin-top: 8px;
      display: flex;
      justify-content: flex-end;
    }
    .acceptance-box-inner {
      border: 2px solid black;
      padding: 8px;
      width: 128px;
      height: 64px;
    }
    .acceptance-title {
      font-size: 11px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="print-page">
    <!-- Header -->
    <div class="print-header">
      <div class="header-content">
        ${LOGO_BASE64 ? 
          `<img src="data:image/png;base64,${LOGO_BASE64}" alt="Farmap Logo" style="height: 24px; width: auto; margin-right: 8px;" />` :
          `<span style="font-size: 24px; font-weight: bold; color: #dc2626; margin-right: 8px;">FARMAP</span>`
        }
        <h1>Listino ${priceList.customer?.company_name || 'Cliente'}</h1>
      </div>
    </div>

    <!-- Customer Info -->
    <div class="customer-info">
      <div class="customer-info-grid">
        <div>
          <span style="font-weight: 500; color: #4b5563;">Listino:</span>
          <span style="margin-left: 4px;">${priceList.name || ''}</span>
        </div>
        <div>
          <span style="font-weight: 500; color: #4b5563;">Data Creazione:</span>
          <span style="margin-left: 4px;">${formatDate(priceList.created_at)}</span>
        </div>
      </div>
    </div>

    <!-- Products Table -->
    <table class="print-table">
      <thead>
        <tr>
          <th style="text-align: center; width: 60px;">Foto</th>
          <th style="text-align: left; width: 80px;">Codice</th>
          <th style="text-align: left; width: 160px;">Prodotto</th>
          <th style="text-align: center; width: 64px;">MOQ</th>
          <th style="text-align: center; width: 64px;">Cartone</th>
          <th style="text-align: center; width: 64px;">Pedana</th>
          <th style="text-align: center; width: 80px;">Scadenza</th>
          <th style="text-align: center; width: 96px;">EAN</th>
          <th style="text-align: center; width: 64px;">IVA</th>
          <th style="text-align: right; width: 80px;">Prezzo</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <!-- Conditions -->
    ${conditionsHTML}

    <!-- Acceptance Box -->
    <div class="acceptance-box">
      <div class="acceptance-box-inner">
        <div class="acceptance-title">ACCETTAZIONE ORDINE</div>
        <div style="margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px;">Data:</span>
            <div style="border-bottom: 1px solid black; width: 64px;"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Note -->
    <div class="note-section">
      <p class="note-text">
        I codici presenti in questo listino sono ad uso interno. I codici personalizzati del cliente verranno generati automaticamente al momento dell'ordine.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>
        <p>FARMAP INDUSTRY S.r.l. - Via Nazionale, 66 - 65012 Cepagatti (PE) - P.IVA: 02244470684 - Tel: +39 085 9774028</p>
      </div>
      <div style="text-align: right;">
        ${priceList.valid_from ? `<p>Listino valido dal ${formatDate(priceList.valid_from)}</p>` : ''}
        ${priceList.valid_until ? `<p>fino al ${formatDate(priceList.valid_until)}</p>` : ''}
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

// Endpoint to generate PDF
app.post('/api/generate-price-list-pdf', async (req, res) => {
  try {
    console.log('🔵 PDF Request received');
    console.log('🔵 Request body keys:', Object.keys(req.body));
    console.log('🔵 priceListData exists:', !!req.body.priceListData);
    console.log('🔵 priceListData items:', req.body.priceListData?.price_list_items?.length);
    console.log('🔵 printByCategory:', req.body.printByCategory);
    console.log('🔵 groupedByCategory exists:', !!req.body.groupedByCategory);
    console.log('🔵 categoryOrder:', req.body.categoryOrder);
    
    const { priceListData, printByCategory, groupedByCategory, categoryOrder } = req.body;

    if (!priceListData) {
      console.error('🔴 Error: priceListData is missing');
      return res.status(400).json({ error: 'priceListData is required' });
    }
    
    if (!priceListData.price_list_items || priceListData.price_list_items.length === 0) {
      console.error('🔴 Error: priceListData.price_list_items is empty');
      return res.status(400).json({ error: 'priceListData must contain price_list_items' });
    }
    
    let browser;
    try {
      // Generate HTML con opzioni per raggruppamento categorie
      const html = generateHTML(priceListData, {
        printByCategory: printByCategory || false,
        groupedByCategory: groupedByCategory || null,
        categoryOrder: categoryOrder || []
      });

      // Launch Puppeteer
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
          '--single-process',
          '--no-zygote'
        ],
        timeout: 30000 // Ridotto per velocità
      });

      const page = await browser.newPage();
      
      // Set content - carica HTML (ottimizzato: non aspettare tutte le immagini)
      await page.setContent(html, { 
        waitUntil: 'domcontentloaded', // Più veloce: non aspetta tutte le immagini
        timeout: 10000 // Ridotto per velocità
      });
    
      // I thumbnail sono già ottimizzati (200x200px, qualità 0.7), quindi non serve compressione aggiuntiva
      // Semplifichiamo: aspettiamo solo che tutte le immagini siano caricate e applichiamo CSS
      await page.evaluate(async () => {
        const images = Array.from(document.querySelectorAll('img.product-image'));
        
        // Applica dimensioni CSS a tutte le immagini immediatamente
        images.forEach(img => {
          img.style.maxWidth = '48px';
          img.style.maxHeight = '48px';
          img.style.width = 'auto';
          img.style.height = 'auto';
          img.style.objectFit = 'contain';
        });
        
        // Attendi che tutte le immagini siano caricate (con timeout generoso)
        await Promise.allSettled(images.map(img => {
          return new Promise((resolve) => {
            // Se già caricata, risolvi immediatamente
            if (img.complete && img.naturalWidth > 0) {
              resolve();
              return;
            }
            
            // Timeout aumentato a 8 secondi per garantire caricamento
            const timeout = setTimeout(() => {
              console.warn(`Image load timeout for: ${img.src.substring(0, 50)}...`);
              resolve(); // Continua anche se timeout
            }, 8000);
            
            img.onload = () => {
              clearTimeout(timeout);
              resolve();
            };
            img.onerror = () => {
              clearTimeout(timeout);
              console.warn(`Image load error for: ${img.src.substring(0, 50)}...`);
              resolve(); // Continua anche se errore
            };
          });
        }));
      });
      
      // Verifica finale che tutte le immagini siano renderizzate
      await page.evaluate(() => {
        return new Promise((resolve) => {
          const images = Array.from(document.querySelectorAll('img.product-image'));
          const totalImages = images.length;
          
          if (totalImages === 0) {
            resolve();
            return;
          }
          
          // Conta quante immagini sono effettivamente caricate
          const checkImages = () => {
            const loaded = images.filter(img => img.complete && img.naturalWidth > 0).length;
            const errors = images.filter(img => img.complete && img.naturalWidth === 0).length;
            
            console.log(`Final check: ${loaded}/${totalImages} loaded, ${errors} errors`);
            
            // Risolvi quando tutte le immagini hanno completato il caricamento (successo o errore)
            if (loaded + errors >= totalImages) {
              resolve();
            }
          };
          
          // Verifica immediata
          checkImages();
          
          // Timeout di sicurezza: 15 secondi per garantire che tutto sia caricato
          setTimeout(() => {
            console.log('Final timeout reached, proceeding with PDF generation');
            resolve();
          }, 15000);
          
          // Verifica periodica ogni 500ms
          const interval = setInterval(() => {
            checkImages();
            if (images.every(img => img.complete)) {
              clearInterval(interval);
              resolve();
            }
          }, 500);
        });
      });
      
      // Attendi un momento aggiuntivo per il rendering completo del PDF
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Rimuovi solo i canvas temporanei di compressione (non le immagini convertite)
      await page.evaluate(() => {
        // Rimuovi canvas temporanei lasciati in giro (non le immagini già convertite)
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach(canvas => {
          // Rimuovi solo se non è parte di un'immagine già processata
          if (!canvas.closest('td')) {
            canvas.remove();
          }
        });
        
        // Forza stili semplici per ottimizzazione rendering
        document.body.style.transform = 'none';
        document.body.style.willChange = 'auto';
      });
      
      // Permetti paginazione naturale - rimossi limiti di altezza e page-break
      // Il contenuto può ora espandersi su più pagine A4
      
      const pdf = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: false, // CRITICO: false evita rasterizzazione sfondi
        preferCSSPageSize: true, // Usa le dimensioni CSS invece di forzare A4
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        },
        displayHeaderFooter: false,
        // Rimossa limitazione pageRanges per permettere pagine multiple
        // NON usare: scale, tagged, outline, omitBackground, tagPages
      });
      
      console.log('🔵 PDF generated - raw size:', pdf.length, 'bytes');
      console.log('🔵 PDF generated - size in MB:', (pdf.length / (1024 * 1024)).toFixed(2));
      
      // Verifica che il PDF sia valido (dovrebbe iniziare con %PDF)
      if (pdf.length === 0) {
        throw new Error('PDF generato è vuoto!');
      }
      
      // Converti in Buffer se necessario e verifica header
      const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
      const pdfHeader = pdfBuffer.slice(0, 4).toString('latin1'); // Usa latin1 per leggere byte come stringa
      
      if (pdfHeader !== '%PDF') {
        console.error('🔴 WARNING: PDF header non valido:', pdfHeader);
        console.error('🔴 PDF first bytes (hex):', pdfBuffer.slice(0, 4).toString('hex'));
        throw new Error('PDF generato non è valido! Header: ' + pdfHeader);
      }
      
      console.log('🔵 PDF header verificato:', pdfHeader);

      const pdfSizeMB = (pdf.length / (1024 * 1024)).toFixed(2);
      console.log('🔵 PDF generated - Size:', pdfSizeMB, 'MB');
      
      await browser.close();
      console.log('🔵 Browser closed');

      // Send PDF as response
      console.log('🔵 Sending PDF response - Size:', pdf.length, 'bytes');
      
      // pdfBuffer già creato sopra durante la verifica header
      // Non serve ricrearlo
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      res.setHeader('Content-Disposition', 'attachment; filename="listino.pdf"');
      res.setHeader('Cache-Control', 'no-cache');
      
      // Invia il PDF come Buffer
      res.send(pdfBuffer);
      console.log('🔵 PDF response sent successfully');
    } catch (innerError) {
      // Close browser if it was opened
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('🔴 Error closing browser:', closeError);
        }
      }
      throw innerError;
    }

  } catch (error) {
    console.error('🔴 Error generating PDF:', error);
    console.error('🔴 Error stack:', error.stack);
    console.error('🔴 Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    res.status(500).json({ 
      error: 'Error generating PDF', 
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'pdf-generator' });
});

// Debug endpoint per testare PDF semplice senza immagini
app.post('/api/test-simple-pdf', async (req, res) => {
  let browser;
  try {
    console.log('🔵 Test simple PDF - starting...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // HTML molto semplice - solo testo
    const simpleHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial; padding: 20px; }
          h1 { color: #333; }
          table { border-collapse: collapse; width: 100%; }
          td { border: 1px solid #ccc; padding: 8px; }
        </style>
      </head>
      <body>
        <h1>Test PDF</h1>
        <table>
          <tr><td>Prodotto 1</td><td>€10.00</td></tr>
          <tr><td>Prodotto 2</td><td>€20.00</td></tr>
        </table>
      </body>
      </html>
    `;
    
    await page.setContent(simpleHTML, { waitUntil: 'load' });
    
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: false,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });
    
    await browser.close();
    
    const sizeMB = (pdf.length / (1024 * 1024)).toFixed(2);
    console.log('🔵 Test simple PDF - Size:', sizeMB, 'MB');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdf.length);
    res.send(pdf);
    
  } catch (error) {
    console.error('🔴 Test simple PDF error:', error);
    if (browser) await browser.close();
    res.status(500).json({ error: error.message });
  }
});

// Test Puppeteer endpoint
app.get('/test-puppeteer', async (req, res) => {
  let browser;
  try {
    console.log('🔵 Testing Puppeteer...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--single-process',
        '--no-zygote'
      ],
      timeout: 60000
    });
    console.log('🔵 Puppeteer test: Browser launched successfully');
    
    const page = await browser.newPage();
    await page.setContent('<html><body><h1>Test</h1></body></html>');
    const pdf = await page.pdf({ format: 'A4' });
    await browser.close();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  } catch (error) {
    console.error('🔴 Puppeteer test failed:', error);
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('🔴 Error closing browser:', e);
      }
    }
    res.status(500).json({ 
      error: 'Puppeteer test failed', 
      message: error.message,
      stack: error.stack
    });
  }
});

app.listen(PORT, () => {
  console.log(`PDF Generator Service running on port ${PORT}`);
});

