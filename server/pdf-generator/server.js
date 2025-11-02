import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
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
const generateHTML = (priceList) => {
  const items = priceList.price_list_items || [];
  
  const itemsHTML = items.map((item, index) => {
    const finalPrice = calculateFinalPrice(item.price, item.discount_percentage);
    const vatRate = item.products?.category === 'Farmaci' ? 10 : 22;
    const photoUrl = item.products?.photo_url || '';
    
    return `
      <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : '#ffffff'};">
        <td style="border: 1px solid #e5e7eb; padding: 0; text-align: center; vertical-align: top;">
          <div style="width: 64px; min-height: 64px; background-color: #e5e7eb; overflow: hidden; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            ${photoUrl ? 
              `<img src="${photoUrl}" alt="${item.products?.name || ''}" class="product-image" data-original-src="${photoUrl}" style="max-height: 64px; max-width: 64px; width: auto; height: auto; object-fit: contain; display: block;" />` :
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

  const conditionsHTML = (priceList.payment_conditions || priceList.shipping_conditions || 
    priceList.delivery_conditions || priceList.brand_conditions) ? `
    <div style="margin-top: 8px; padding: 8px; background-color: #fff7ed; border: 1px solid #fbbf24; border-radius: 4px;">
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
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: white;
      padding: 24px;
    }
    .print-page {
      width: 297mm;
      min-height: 210mm;
      background: white;
      padding: 24px;
      margin: 0 auto;
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
        <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjMwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiNkYzI2MjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5GQVJNQVA8L3RleHQ+PC9zdmc+" alt="Farmap Logo" />
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
          <th style="text-align: center; width: 80px;">Foto</th>
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
    const { priceListData } = req.body;

    if (!priceListData) {
      return res.status(400).json({ error: 'priceListData is required' });
    }

    // Generate HTML
    const html = generateHTML(priceListData);

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set content
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Ottimizza immagini: ridimensiona e comprimi usando Canvas API del browser
    const optimizationResult = await page.evaluate(() => {
      const images = document.querySelectorAll('img.product-image');
      console.log('🔵 Found images to optimize:', images.length);
      return Promise.all(Array.from(images).map(async (img) => {
        try {
          // Attendi che l'immagine originale sia caricata
          if (!img.complete || img.naturalWidth === 0) {
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });
          }
          
          const maxSize = 64;
          let width = img.naturalWidth;
          let height = img.naturalHeight;
          
          // Calcola dimensioni mantenendo aspect ratio
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          
          // Crea canvas e ridisegna
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          // Disegna immagine ridimensionata
          ctx.drawImage(img, 0, 0, width, height);
          
          // Converti in JPEG compresso (qualità 0.5 per file molto più piccoli)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.5);
          const originalSize = img.src.length;
          const compressedSize = compressedDataUrl.length;
          console.log(`🔵 Image optimized: ${originalSize} -> ${compressedSize} bytes (${((1 - compressedSize/originalSize) * 100).toFixed(1)}% reduction)`);
          img.src = compressedDataUrl;
          
          return { optimized: true, originalSize, compressedSize };
        } catch (error) {
          console.error('Error optimizing image:', error);
          return { optimized: false, error: error.message };
        }
      }));
    });
    
    console.log('🔵 Image optimization result:', optimizationResult);
    
    // Attendi che le immagini ottimizzate siano caricate
    await page.waitForTimeout(1000);

    // Generate PDF con compressione
    console.log('🔵 Generating PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      // Opzioni per ridurre dimensione file
      displayHeaderFooter: false,
      // Puppeteer usa compressione di default, ma possiamo forzarla
    });

    const pdfSizeMB = (pdf.length / (1024 * 1024)).toFixed(2);
    console.log('🔵 PDF generated - Size:', pdfSizeMB, 'MB');
    
    await browser.close();

    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="listino.pdf"');
    res.send(pdf);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ 
      error: 'Error generating PDF', 
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'pdf-generator' });
});

app.listen(PORT, () => {
  console.log(`PDF Generator Service running on port ${PORT}`);
});

