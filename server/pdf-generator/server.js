import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

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

// CORS configuration - più permissiva
const corsOptions = {
  origin: '*', // Permetti tutte le origini
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type'],
  optionsSuccessStatus: 200 // Support legacy browsers
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// Handle all OPTIONS requests explicitly before other routes
// This MUST be before any route definitions
app.options('*', (req, res, next) => {
  console.log('🔵 OPTIONS request received for:', req.path);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  return res.status(200).end();
});

// Also handle OPTIONS specifically for the upload endpoint (before POST route)
app.options('/api/generate-price-list-pdf-upload', (req, res) => {
  console.log('🔵 OPTIONS preflight for /api/generate-price-list-pdf-upload');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Max-Age', '86400');
  return res.status(200).end();
});

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

const DEFAULT_SUPABASE_URL = 'https://pfpvsahrmwbhkgvjidnr.supabase.co';
const resolveStorageBaseUrl = () => {
  const explicit = process.env.SUPABASE_STORAGE_BASE_URL;
  if (explicit && explicit.trim() !== '') {
    return explicit.replace(/\/$/, '');
  }

  const baseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;

  const normalizedBase = baseUrl.replace(/\/$/, '');
  return `${normalizedBase}/storage/v1/object/public/product-photos`;
};

const STORAGE_BASE_URL = resolveStorageBaseUrl();
console.log('🔵 Storage base URL:', STORAGE_BASE_URL);

// Configure Supabase client for storage uploads
const resolveSupabaseConfig = () => {
  const supabaseUrl = process.env.SUPABASE_URL || 
                      process.env.VITE_SUPABASE_URL || 
                      DEFAULT_SUPABASE_URL;
  
  // Use service role key for backend operations (bypasses RLS)
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseKey) {
    console.warn('⚠️ Supabase service role key not found. PDF upload to bucket will not work.');
    return null;
  }
  
  return { url: supabaseUrl, key: supabaseKey };
};

const supabaseConfig = resolveSupabaseConfig();
const supabase = supabaseConfig ? createClient(supabaseConfig.url, supabaseConfig.key) : null;

if (supabase) {
  console.log('🔵 Supabase client configured for storage uploads');
} else {
  console.warn('⚠️ Supabase client not configured. Set SUPABASE_SERVICE_ROLE_KEY environment variable.');
}

// Generate HTML template from price list data
const generateHTML = (priceList, options = {}) => {
  const {
    printByCategory = false,
    groupedByCategory = null,
    categoryOrder = [],
    storageBaseUrl = STORAGE_BASE_URL
  } = options;
  
  let itemsHTML = '';
  let globalIndex = 0;
  const IMAGE_DISPLAY_SIZE = 72;

  const getProductImageSources = (product) => {
    if (!product) return [];
    const sources = [];
    if (product.id && storageBaseUrl) {
      sources.push(`${storageBaseUrl}/${product.id}/thumb.webp`);
      sources.push(`${storageBaseUrl}/${product.id}/main.webp`);
      sources.push(`${storageBaseUrl}/${product.id}/thumb.jpg`);
      sources.push(`${storageBaseUrl}/${product.id}/main.jpg`);
    }
    if (product.photo_thumb_url && product.photo_thumb_url.trim() !== '') {
      sources.push(product.photo_thumb_url.trim());
    }
    if (product.photo_url && product.photo_url.trim() !== '') {
      sources.push(product.photo_url.trim());
    }
    return Array.from(new Set(sources));
  };
  
  if (printByCategory && groupedByCategory && categoryOrder.length > 0) {
    // Genera HTML raggruppato per categoria
    const palette = [
      { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' }, // blue
      { bg: '#dcfce7', text: '#14532d', border: '#86efac' }, // green
      { bg: '#fef9c3', text: '#713f12', border: '#fde68a' }, // yellow
      { bg: '#ede9fe', text: '#4c1d95', border: '#c4b5fd' }, // purple
      { bg: '#ffe4e6', text: '#9f1239', border: '#fecdd3' }, // pink
      { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' }, // indigo
      { bg: '#ccfbf1', text: '#115e59', border: '#99f6e4' }, // teal
      { bg: '#ffedd5', text: '#9a3412', border: '#fed7aa' }, // orange
    ];
    categoryOrder.forEach((category, idx) => {
      const categoryItems = groupedByCategory[category] || [];
      const color = palette[idx % palette.length];
      
      // Intestazione categoria
      itemsHTML += `
        <tr style="background-color: ${color.bg}; page-break-inside: avoid;">
          <td colspan="10" style="border: 1px solid ${color.border}; padding: 2px 8px; font-weight: 600; font-size: 11px; color: ${color.text};">
            ${category}
          </td>
        </tr>
      `;
      
      // Prodotti della categoria
      categoryItems.forEach((item) => {
    const finalPrice = calculateFinalPrice(item.price, item.discount_percentage);
    const vatRate = item.products?.category === 'Farmaci' ? 10 : 22;
    const imageSources = getProductImageSources(item.products);
    const sourcesAttr =
      imageSources.length > 0
        ? JSON.stringify(imageSources).replace(/"/g, '&quot;')
        : '';
    const primarySrc = imageSources[0] || '';
        const rowBgColor = globalIndex % 2 === 0 ? '#f9fafb' : '#ffffff';
        
        itemsHTML += `
          <tr style="background-color: ${rowBgColor};">
            <td style="border: 1px solid #e5e7eb; padding: 0; text-align: center; vertical-align: top;">
              <div style="width: ${IMAGE_DISPLAY_SIZE}px; min-height: ${IMAGE_DISPLAY_SIZE}px; background-color: #e5e7eb; overflow: hidden; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                ${primarySrc ? 
                  `<img src="${primarySrc}" alt="${item.products?.name || ''}" class="product-image" data-image-sources="${sourcesAttr}" data-product-id="${item.products?.id || ''}" data-product-code="${item.products?.code || ''}" style="max-height: ${IMAGE_DISPLAY_SIZE}px; max-width: ${IMAGE_DISPLAY_SIZE}px; width: auto; height: auto; object-fit: contain; display: block; image-rendering: auto;" />` :
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
    const imageSources = getProductImageSources(item.products);
    const sourcesAttr =
      imageSources.length > 0
        ? JSON.stringify(imageSources).replace(/"/g, '&quot;')
        : '';
    const primarySrc = imageSources[0] || '';
      
      return `
        <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : '#ffffff'};">
        <td style="border: 1px solid #e5e7eb; padding: 0; text-align: center; vertical-align: top;">
          <div style="width: ${IMAGE_DISPLAY_SIZE}px; min-height: ${IMAGE_DISPLAY_SIZE}px; background-color: #e5e7eb; overflow: hidden; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            ${primarySrc ? 
              `<img src="${primarySrc}" alt="${item.products?.name || ''}" class="product-image" data-image-sources="${sourcesAttr}" data-product-id="${item.products?.id || ''}" data-product-code="${item.products?.code || ''}" style="max-height: ${IMAGE_DISPLAY_SIZE}px; max-width: ${IMAGE_DISPLAY_SIZE}px; width: auto; height: auto; object-fit: contain; display: block; image-rendering: auto;" />` :
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

  const conditionsHTML = (priceList.print_conditions !== false) && (priceList.payment_conditions || priceList.shipping_conditions || 
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
      padding: 6px 6px; /* thinner header row */
      border: 1px solid #e5e7eb;
    }
    .print-table td {
      border: 1px solid #e5e7eb;
      padding: 8px;
    }
    /* Elementi che devono apparire solo nell'ultima pagina */
    .conditions-section,
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
          <th style="text-align: center; width: 90px;">Foto</th>
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
        categoryOrder: categoryOrder || [],
        storageBaseUrl: STORAGE_BASE_URL
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
      
      // Set content - immagini embeddate inline per evitare problemi di caricamento
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 15000
      });

      // Assicurati che tutte le immagini siano caricate o abbiano provato i fallback
      const imageLoadResults = await page.evaluate(async () => {
        const timeoutPerImage = 8000;
        const maxTotalTime = 30000;
        const startTime = Date.now();
        const summary = [];

        const loadSource = (img, src) => {
          return new Promise((resolve) => {
            if (!src) {
              resolve({ success: false, src: null, reason: 'empty-src' });
              return;
            }

            let timer;
            const cleanup = (success, detail = {}) => {
              if (timer) {
                clearTimeout(timer);
              }
              img.removeEventListener('load', onLoad);
              img.removeEventListener('error', onError);
              resolve({ success, src, ...detail });
            };

            const onLoad = () => cleanup(true);

            const onError = () => cleanup(false, { reason: 'error' });

            img.addEventListener('load', onLoad, { once: true });
            img.addEventListener('error', onError, { once: true });

            if (img.src !== src) {
              img.src = src;
            } else if (img.complete) {
              cleanup(img.naturalWidth > 0);
              return;
            }

            if (img.complete) {
              cleanup(img.naturalWidth > 0);
              return;
            }

            timer = setTimeout(() => {
              cleanup(img.complete && img.naturalWidth > 0, { reason: 'timeout' });
            }, timeoutPerImage);
          });
        };

        const loadImageWithFallback = async (img) => {
          const data = img.getAttribute('data-image-sources');
          let sources = [];
          if (data) {
            try {
              sources = JSON.parse(data);
            } catch (error) {
              sources = [];
            }
          }
          if (!Array.isArray(sources) || sources.length === 0) {
            if (img.src) {
              sources = [img.src];
            } else {
              return {
                productId: img.getAttribute('data-product-id'),
                productCode: img.getAttribute('data-product-code'),
                success: false,
                attempts: [],
                reason: 'no-sources'
              };
            }
          } else if (!img.src && sources.length > 0) {
            img.src = sources[0];
          }

          const attempts = [];
          for (let index = 0; index < sources.length; index++) {
            if (Date.now() - startTime > maxTotalTime) {
              return {
                productId: img.getAttribute('data-product-id'),
                productCode: img.getAttribute('data-product-code'),
                success: false,
                attempts,
                reason: 'global-timeout'
              };
            }
            const result = await loadSource(img, sources[index]);
            attempts.push(result);
            if (result.success) {
              return {
                productId: img.getAttribute('data-product-id'),
                productCode: img.getAttribute('data-product-code'),
                success: true,
                attempts
              };
            }
          }

          return {
            productId: img.getAttribute('data-product-id'),
            productCode: img.getAttribute('data-product-code'),
            success: false,
            attempts,
            reason: 'all-failed'
          };
        };

        const images = Array.from(document.querySelectorAll('img.product-image'));
        for (const img of images) {
          const result = await loadImageWithFallback(img);
          summary.push(result);
          if (Date.now() - startTime > maxTotalTime) {
            summary.push({
              productId: 'GLOBAL',
              productCode: 'GLOBAL',
              success: false,
              reason: 'global-timeout'
            });
            break;
          }
        }

        return summary;
      });

      const failedImages = imageLoadResults.filter((result) => !result.success);
      if (failedImages.length > 0) {
        console.warn(
          '⚠️ Some images failed to load:',
          failedImages.slice(0, 10).map((entry) => ({
            productId: entry.productId,
            productCode: entry.productCode,
            attempts: entry.attempts,
            reason: entry.reason
          }))
        );
      }
    
      // Breve attesa per garantire il rendering completo della pagina prima della stampa
      await new Promise((resolve) => setTimeout(resolve, 500));
      
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

// New endpoint: Generate PDF and upload to Supabase Storage bucket
// OPTIONS handler is already defined above in the global handler
app.post('/api/generate-price-list-pdf-upload', cors(corsOptions), async (req, res) => {
  try {
    console.log('🔵 PDF Upload Request received');
    
    // Set CORS headers explicitly
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    const { 
      priceListData, 
      printByCategory, 
      groupedByCategory, 
      categoryOrder, 
      uploadToBucket, 
      bucketName,
      // Email data for webhook
      email,
      subject,
      body
    } = req.body;

    if (!priceListData) {
      return res.status(400).json({ error: 'priceListData is required' });
    }

    if (!priceListData.price_list_items || priceListData.price_list_items.length === 0) {
      return res.status(400).json({ error: 'priceListData must contain price_list_items' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client not configured. Set SUPABASE_SERVICE_ROLE_KEY environment variable.' });
    }

    // Generate PDF (same logic as existing endpoint)
    const html = generateHTML(priceListData, {
      printByCategory: printByCategory || false,
      groupedByCategory: groupedByCategory || null,
      categoryOrder: categoryOrder || [],
      storageBaseUrl: STORAGE_BASE_URL
    });

    let browser;
    try {
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
        timeout: 30000
      });

      const page = await browser.newPage();
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 15000
      });

      // Wait for images to load (same logic as existing endpoint)
      await page.evaluate(async () => {
        const images = Array.from(document.querySelectorAll('img.product-image'));
        const loadPromises = images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 8000); // timeout per immagine
          });
        });
        await Promise.all(loadPromises);
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const pdf = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: false,
        preferCSSPageSize: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        },
        displayHeaderFooter: false
      });

      await browser.close();

      // Verify PDF is valid
      const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
      if (pdfBuffer.length === 0) {
        throw new Error('PDF generato è vuoto!');
      }

      const pdfHeader = pdfBuffer.slice(0, 4).toString('latin1');
      if (pdfHeader !== '%PDF') {
        throw new Error('PDF generato non è valido!');
      }

      console.log('🔵 PDF generated successfully, size:', pdfBuffer.length, 'bytes');

      // Upload to Supabase Storage if requested
      if (uploadToBucket && bucketName) {
        const targetBucket = bucketName || 'order-pdfs';
        const priceListId = priceListData.id || 'unknown';
        const timestamp = Date.now();
        const fileName = `listino_${priceListId}_${timestamp}.pdf`;
        const filePath = fileName;

        console.log(`🔵 Uploading PDF to bucket: ${targetBucket}, path: ${filePath}`);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(targetBucket)
          .upload(filePath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: false
          });

        if (uploadError) {
          console.error('🔴 Error uploading PDF to bucket:', uploadError);
          throw new Error(`Failed to upload PDF to bucket: ${uploadError.message}`);
        }

        console.log('🔵 PDF uploaded successfully to bucket');

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(targetBucket)
          .getPublicUrl(filePath);

        const publicUrl = urlData?.publicUrl;

        if (!publicUrl) {
          throw new Error('Failed to get public URL for uploaded PDF');
        }

        console.log('🔵 PDF public URL:', publicUrl);

        // Call N8N webhook if email data is provided
        if (email && subject && body) {
          const webhookUrl = process.env.N8N_PRICELIST_WEBHOOK_URL;
          if (webhookUrl) {
            try {
              console.log('🔵 Calling N8N webhook for email delivery');
              
              const webhookPayload = {
                email: email,
                subject: subject,
                body: body,
                pdfUrl: publicUrl,
                priceListId: priceListData.id,
                priceListName: priceListData.name,
                customerName: priceListData.customer?.company_name || 'Cliente',
                customerEmail: priceListData.customer?.email || email,
                fileName: fileName
              };

              const webhookResponse = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(webhookPayload)
              });

              if (!webhookResponse.ok) {
                const errorText = await webhookResponse.text();
                console.error('🔴 N8N webhook error:', errorText);
                // Don't fail the request if webhook fails, just log it
                // The PDF is already uploaded successfully
              } else {
                console.log('🔵 N8N webhook called successfully');
              }
            } catch (webhookError) {
              console.error('🔴 Error calling N8N webhook:', webhookError);
              // Don't fail the request if webhook fails
            }
          } else {
            console.warn('⚠️ N8N_PRICELIST_WEBHOOK_URL not configured. Skipping webhook call.');
          }
        }

        // Return JSON response with PDF URL and metadata
        res.header('Access-Control-Allow-Origin', '*');
        return res.json({
          success: true,
          pdfUrl: publicUrl,
          fileName: fileName,
          fileSize: pdfBuffer.length,
          bucketName: targetBucket
        });
      } else {
        // If upload not requested, return PDF as blob (for backward compatibility)
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdfBuffer.length.toString());
        res.setHeader('Content-Disposition', 'attachment; filename="listino.pdf"');
        res.setHeader('Cache-Control', 'no-cache');
        res.send(pdfBuffer);
      }
    } catch (innerError) {
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
    console.error('🔴 Error in PDF upload endpoint:', error);
    res.header('Access-Control-Allow-Origin', '*');
    res.status(500).json({
      error: 'Error generating or uploading PDF',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'pdf-generator' });
});

// Test CORS endpoint
app.get('/api/test-cors', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.json({ 
    message: 'CORS test successful',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin 
  });
});

app.options('/api/test-cors', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
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

