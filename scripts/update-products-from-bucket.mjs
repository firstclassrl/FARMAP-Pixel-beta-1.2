// Script per aggiornare i prodotti con gli URL delle foto già presenti nel bucket product-photos
// Estrae l'ID prodotto dal path delle foto e aggiorna il campo photo_url

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// ---------------------- ENV ----------------------
function getSupabaseEnv() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL and key (SUPABASE_SERVICE_ROLE_KEY preferred).');
    process.exit(1);
  }
  const isServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!isServiceKey) {
    console.warn('Warning: using anon key. Ensure storage policies allow your role.');
  }
  return { url, key };
}

function csvEscape(s) {
  if (s == null) return '';
  const str = String(s);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// ---------------------- MAIN ----------------------
async function main() {
  const { url, key } = getSupabaseEnv();
  const supabase = createClient(url, key, { global: { headers: { 'X-Client-Info': 'update-products-from-bucket' } } });

  const bucket = 'product-photos';
  console.log(`🔍 Listing files in bucket: ${bucket}...`);

  // List all files in the bucket
  const { data: files, error: listError } = await supabase.storage
    .from(bucket)
    .list('', { limit: 10000, sortBy: { column: 'name', order: 'asc' } });

  if (listError) {
    console.error('❌ Error listing files:', listError);
    process.exit(1);
  }

  if (!files || files.length === 0) {
    console.log('⚠️  No files found in bucket');
    process.exit(0);
  }

  console.log(`✅ Found ${files.length} files/folders in bucket`);

  // Load all products
  console.log('🔍 Loading products...');
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, code, name');
  
  if (prodErr) {
    console.error('❌ Error loading products:', prodErr);
    process.exit(1);
  }

  const productMap = new Map();
  for (const p of products) {
    productMap.set(p.id, p);
  }
  console.log(`✅ Loaded ${products.length} products`);

  const reportRows = [['file_path', 'product_id', 'product_code', 'product_name', 'status', 'photo_url', 'message']];
  let success = 0;
  let skipped = 0;
  let errors = 0;

  // Process files - look for folders (product IDs) and main images
  for (const file of files) {
    // If it's a folder, list files inside
    if (!file.id) {
      // It's a folder (product ID)
      const productId = file.name;
      
      // Check if product exists
      if (!productMap.has(productId)) {
        reportRows.push([`${productId}/`, productId, '', '', 'skipped', '', 'product not found']);
        skipped++;
        continue;
      }

      // List files in this folder
      const { data: folderFiles, error: folderError } = await supabase.storage
        .from(bucket)
        .list(productId, { limit: 100 });

      if (folderError) {
        reportRows.push([`${productId}/`, productId, productMap.get(productId)?.code || '', productMap.get(productId)?.name || '', 'error', '', folderError.message]);
        errors++;
        continue;
      }

      // Find main image (main.webp, main.jpg, or first image)
      let mainImage = null;
      if (folderFiles) {
        mainImage = folderFiles.find(f => f.name === 'main.webp' || f.name === 'main.jpg' || f.name.startsWith('main.'));
        if (!mainImage && folderFiles.length > 0) {
          // Use first image file
          mainImage = folderFiles.find(f => f.name.match(/\.(jpg|jpeg|png|webp)$/i));
        }
      }

      if (!mainImage) {
        reportRows.push([`${productId}/`, productId, productMap.get(productId)?.code || '', productMap.get(productId)?.name || '', 'skipped', '', 'no image found']);
        skipped++;
        continue;
      }

      // Get public URL
      const imagePath = `${productId}/${mainImage.name}`;
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(imagePath);

      // Update product
      try {
        const { error: updateError } = await supabase
          .from('products')
          .update({ photo_url: urlData.publicUrl })
          .eq('id', productId);

        if (updateError) {
          reportRows.push([imagePath, productId, productMap.get(productId)?.code || '', productMap.get(productId)?.name || '', 'error', '', updateError.message]);
          errors++;
        } else {
          reportRows.push([imagePath, productId, productMap.get(productId)?.code || '', productMap.get(productId)?.name || '', 'updated', urlData.publicUrl, '']);
          success++;
        }
      } catch (e) {
        reportRows.push([imagePath, productId, productMap.get(productId)?.code || '', productMap.get(productId)?.name || '', 'error', '', e.message || String(e)]);
        errors++;
      }
    }
  }

  // Write report
  const outDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outCsv = path.join(outDir, `update_from_bucket_${Date.now()}.csv`);
  const csv = reportRows.map(r => r.map(csvEscape).join(',')).join(os.EOL);
  fs.writeFileSync(outCsv, csv);
  
  console.log(`\n📄 Report: ${outCsv}`);
  console.log(`✅ Updated: ${success}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

