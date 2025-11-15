import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import sharp from 'npm:sharp';
import { Buffer } from 'node:buffer';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

interface StorageObjectRecord {
  bucket_id: string;
  id: string;
  name: string;
  metadata?: {
    mimetype?: string;
  };
  created_at?: string;
  updated_at?: string;
  size?: number;
}

interface StorageWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  record: StorageObjectRecord;
  old_record?: StorageObjectRecord | null;
}

const TARGET_BUCKET = 'product-photos';
const THUMB_PREFIX = 'thumbs';
const THUMB_SIZE = 150;

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

Deno.serve(async (req: Request) => {
  if (req.method === 'GET') {
    return jsonResponse({ ok: true, message: 'product-photo-thumb ready' });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Method not allowed' }, 405);
  }

  let payload: StorageWebhookPayload;
  try {
    payload = await req.json();
  } catch (error) {
    console.error('Invalid payload', error);
    return jsonResponse({ ok: false, message: 'Invalid payload' }, 400);
  }

  if (!payload?.record) {
    return jsonResponse({ ok: false, message: 'Missing record' }, 400);
  }

  const record = payload.record;

  if (record.bucket_id !== TARGET_BUCKET) {
    return jsonResponse({ ok: true, message: 'Ignoring different bucket' });
  }

  if (payload.type !== 'INSERT' && payload.type !== 'UPDATE') {
    return jsonResponse({ ok: true, message: 'Ignoring event type' });
  }

  const objectPath = record.name;
  if (!objectPath) {
    return jsonResponse({ ok: false, message: 'Missing object path' }, 400);
  }

  // Avoid infinite loops
  if (objectPath.startsWith(`${THUMB_PREFIX}/`) || objectPath.includes('/thumb')) {
    return jsonResponse({ ok: true, message: 'Skipping thumbnail object' });
  }

  const mimetype = record.metadata?.mimetype || '';
  if (!mimetype.startsWith('image/')) {
    return jsonResponse({ ok: true, message: 'Skipping non-image upload' });
  }

  try {
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from(TARGET_BUCKET)
      .download(objectPath);

    if (downloadError || !downloadData) {
      console.error('Download error', downloadError);
      return jsonResponse({ ok: false, message: 'Failed to download image' }, 500);
    }

    const arrayBuffer = await downloadData.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    const thumbBuffer = await sharp(imageBuffer)
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer();

    const thumbPath = `${THUMB_PREFIX}/${objectPath.replace(/\\/g, '/')}`;

    const { error: uploadError } = await supabase.storage
      .from(TARGET_BUCKET)
      .upload(thumbPath, thumbBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('Thumbnail upload error', uploadError);
      return jsonResponse({ ok: false, message: 'Failed to upload thumbnail' }, 500);
    }

    const { data: publicUrlData } = supabase.storage
      .from(TARGET_BUCKET)
      .getPublicUrl(thumbPath);

    const thumbUrl = publicUrlData?.publicUrl || null;

    const productId = objectPath.split('/')[0];
    if (productId && thumbUrl) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ photo_thumb_url: thumbUrl })
        .eq('id', productId);

      if (updateError) {
        console.error('Failed updating product thumbnail URL', updateError);
      }
    }

    return jsonResponse({
      ok: true,
      thumbPath,
      thumbUrl
    });
  } catch (error) {
    console.error('Unexpected error generating thumbnail', error);
    return jsonResponse({ ok: false, message: 'Unexpected error' }, 500);
  }
});

