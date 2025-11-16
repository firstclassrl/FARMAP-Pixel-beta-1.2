#!/usr/bin/env node

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import sharp from 'sharp';
import pLimit from 'p-limit';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET ||
  process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    '❌ Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const PUBLIC_STORAGE_BASE = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/product-photos`;
const BUCKET = 'product-photos';
const PAGE_SIZE = 500;
const CONCURRENCY = 4;
const THUMB_MAX_SIZE = 200;
const THUMB_QUALITY = 70;

const tempDir = path.join(process.cwd(), '.tmp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const limit = pLimit(CONCURRENCY);

const listProducts = async () => {
  const products = [];
  let from = 0;
  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('products')
      .select('id, code, photo_url, photo_thumb_url')
      .order('created_at', { ascending: true })
      .range(from, to);
    if (error) {
      throw error;
    }
    if (!data || data.length === 0) {
      break;
    }
    products.push(...data);
    if (data.length < PAGE_SIZE) {
      break;
    }
    from += PAGE_SIZE;
  }
  return products;
};

const sourceCandidates = (product) => {
  const id = product.id;
  const sources = [];
  if (id) {
    sources.push(`${PUBLIC_STORAGE_BASE}/${id}/main.webp`);
    sources.push(`${PUBLIC_STORAGE_BASE}/${id}/main.jpg`);
    sources.push(`${PUBLIC_STORAGE_BASE}/${id}/main.jpeg`);
  }
  if (product.photo_url) {
    sources.push(product.photo_url);
  }
  if (product.photo_thumb_url) {
    sources.push(product.photo_thumb_url);
  }
  return Array.from(new Set(sources.filter(Boolean)));
};

const downloadImage = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
};

const generateThumb = async (buffer) => {
  return sharp(buffer)
    .rotate()
    .resize(THUMB_MAX_SIZE, THUMB_MAX_SIZE, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: THUMB_QUALITY })
    .toBuffer();
};

const uploadThumb = async (productId, buffer) => {
  const pathKey = `${productId}/thumb.webp`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(pathKey, buffer, { upsert: true, contentType: 'image/webp' });
  if (error) {
    throw error;
  }
  const publicUrl = `${PUBLIC_STORAGE_BASE}/${pathKey}`;
  const { error: updateError } = await supabase
    .from('products')
    .update({ photo_thumb_url: publicUrl })
    .eq('id', productId);
  if (updateError) {
    throw updateError;
  }
  return publicUrl;
};

const processProduct = async (product) => {
  const sources = sourceCandidates(product);
  if (sources.length === 0) {
    return { product, status: 'skipped', reason: 'no-sources' };
  }

  for (const src of sources) {
    const buffer = await downloadImage(src);
    if (!buffer) {
      continue;
    }
    try {
      const thumb = await generateThumb(buffer);
      const publicUrl = await uploadThumb(product.id, thumb);
      return { product, status: 'success', url: publicUrl };
    } catch (error) {
      console.warn(`⚠️ Failed processing ${product.code || product.id} from ${src}:`, error.message);
    }
  }

  return { product, status: 'failed', reason: 'all-sources-failed' };
};

const main = async () => {
  console.log('🔵 Loading products...');
  const products = await listProducts();
  console.log(`🔵 Found ${products.length} products. Regenerating thumbnails...`);

  const results = await Promise.all(
    products.map((product) =>
      limit(() =>
        processProduct(product).catch((error) => ({
          product,
          status: 'failed',
          reason: error.message
        }))
      )
    )
  );

  const success = results.filter((r) => r.status === 'success').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const failed = results.filter((r) => r.status === 'failed');

  console.log(`✅ Completed. Success: ${success}, Skipped: ${skipped}, Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('❌ Failed products:');
    failed.slice(0, 20).forEach((entry) => {
      console.log(` - ${entry.product.code || entry.product.id}: ${entry.reason}`);
    });
    if (failed.length > 20) {
      console.log(`  ...and ${failed.length - 20} more`);
    }
  }

  process.exit(0);
};

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

