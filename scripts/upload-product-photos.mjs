// Bulk upload product photos from a local folder to Supabase Storage
// - Generates main.webp and thumb.webp
// - Matches files to products by leading code in filename (e.g., EN0461 ... .png -> code EN0461)
// - Updates products.photo_url (and optionally products.photo_thumb_url if present)

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import fg from 'fast-glob';
import pLimit from 'p-limit';
import sharp from 'sharp';

// ---------------------- CLI ARGS ----------------------
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    dir: process.env.PHOTOS_DIR || '',
    bucket: process.env.PHOTOS_BUCKET || 'product-photos',
    dryRun: false,
    filter: '',
    concurrency: Number(process.env.PHOTOS_CONCURRENCY || 4),
    updateThumbField: process.env.UPDATE_THUMB_FIELD === 'true',
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dir') opts.dir = args[++i];
    else if (a === '--bucket') opts.bucket = args[++i];
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--filter') opts.filter = args[++i];
    else if (a === '--concurrency') opts.concurrency = Number(args[++i]);
    else if (a === '--thumb-field') opts.updateThumbField = true;
  }

  if (!opts.dir) {
    console.error('Missing --dir <local_images_folder>');
    process.exit(1);
  }
  return opts;
}

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
    console.warn('Warning: using anon key. Ensure storage insert/update policies allow your role.');
  }
  return { url, key };
}

// ---------------------- HELPERS ----------------------
function extractCodeFromFilename(filePath) {
  const base = path.basename(filePath);
  const m = base.match(/^([A-Za-z0-9]+)/);
  return m ? m[1].toUpperCase() : null;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

async function generateImages(inputPath) {
  const img = sharp(inputPath, { failOn: 'none' });
  // Ridotte drasticamente qualità e dimensioni per ridurre il peso del catalogo
  const main = await img.clone().rotate().resize({ width: 600, withoutEnlargement: true }).webp({ quality: 35 }).toBuffer();
  const thumb = await img.clone().rotate().resize({ width: 200, withoutEnlargement: true }).webp({ quality: 25 }).toBuffer();
  return { main, thumb };
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
  const opts = parseArgs();
  const { url, key } = getSupabaseEnv();
  const supabase = createClient(url, key, { global: { headers: { 'X-Client-Info': 'bulk-photo-import' } } });

  console.log('🔍 Loading products (id, code)...');
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, code')
    .not('code', 'is', null);
  if (prodErr) throw prodErr;

  const codeToProduct = new Map();
  for (const p of products) {
    if (p.code) codeToProduct.set(String(p.code).toUpperCase(), p);
  }
  console.log(`✅ Loaded ${products.length} products with code.`);

  const exts = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
  const patterns = exts.map(e => path.join(opts.dir, `**/*.${e}`));
  const files = await fg(patterns, { dot: false, caseSensitiveMatch: false, onlyFiles: true });
  const filtered = opts.filter ? files.filter(f => path.basename(f).toUpperCase().startsWith(opts.filter.toUpperCase())) : files;
  console.log(`🖼️ Found ${filtered.length} image files to process` + (opts.filter ? ` (filtered by ${opts.filter})` : ''));

  const limit = pLimit(Math.max(1, opts.concurrency));
  const reportRows = [['file', 'code', 'product_id', 'status', 'public_main_url', 'public_thumb_url', 'message']];

  let success = 0;
  let matched = 0;

  await Promise.all(
    filtered.map(file => limit(async () => {
      const code = extractCodeFromFilename(file);
      if (!code) {
        reportRows.push([file, '', '', 'skipped', '', '', 'no code in filename']);
        return;
      }

      const product = codeToProduct.get(code);
      if (!product) {
        reportRows.push([file, code, '', 'unmatched', '', '', 'no product with this code']);
        return;
      }

      matched++;
      const id = product.id;

      try {
        if (opts.dryRun) {
          reportRows.push([file, code, id, 'dry-run', '', '', '']);
          return;
        }

        const { main, thumb } = await generateImages(file);

        const mainPath = `${id}/main.webp`;
        const thumbPath = `${id}/thumb.webp`;

        const up1 = await supabase.storage.from(opts.bucket).upload(mainPath, main, { contentType: 'image/webp', upsert: true });
        if (up1.error) throw up1.error;
        const up2 = await supabase.storage.from(opts.bucket).upload(thumbPath, thumb, { contentType: 'image/webp', upsert: true });
        if (up2.error) throw up2.error;

        const { data: pubMain } = supabase.storage.from(opts.bucket).getPublicUrl(mainPath);
        const { data: pubThumb } = supabase.storage.from(opts.bucket).getPublicUrl(thumbPath);

        // Try updating product with both fields; if thumb column missing, retry with photo_url only
        let updated = false;
        let lastErr = null;
        if (opts.updateThumbField) {
          const upd = await supabase.from('products').update({ photo_url: pubMain.publicUrl, photo_thumb_url: pubThumb.publicUrl }).eq('id', id);
          if (!upd.error) {
            updated = true;
          } else {
            lastErr = upd.error;
          }
        }
        if (!updated) {
          const upd2 = await supabase.from('products').update({ photo_url: pubMain.publicUrl }).eq('id', id);
          if (upd2.error) throw upd2.error;
        }

        success++;
        reportRows.push([file, code, id, 'uploaded', pubMain.publicUrl, pubThumb?.publicUrl || '', '']);
      } catch (e) {
        reportRows.push([file, code, id, 'error', '', '', e.message || String(e)]);
      }
    }))
  );

  // Write report
  const outDir = path.join(process.cwd(), 'reports');
  ensureDir(outDir);
  const outCsv = path.join(outDir, `bulk_upload_report_${Date.now()}.csv`);
  const csv = reportRows.map(r => r.map(csvEscape).join(',')).join(os.EOL);
  fs.writeFileSync(outCsv, csv);
  console.log(`\n📄 Report: ${outCsv}`);
  console.log(`Matched files: ${matched}/${filtered.length}, Successful uploads: ${success}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});


