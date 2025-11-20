## Product Photo Thumbnail Automation

This project now includes a Supabase Edge Function (`product-photo-thumb`) that
creates lightweight thumbnails every time a file is uploaded to the
`product-photos` bucket. The thumbnails are ~150 px (longest edge) JPGs with
quality ≈70 %, sized to keep twelve images per A4 price list page lightweight.

### Deployment Steps

1. **Deploy the function**  

   ```bash
   supabase functions deploy product-photo-thumb --no-verify-jwt
   ```

   The function relies on `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, which
   are already provided by the Supabase environment in production.

2. **Register the storage webhook**

   - Open Supabase → Storage → `product-photos` → *Add webhook*
   - Target Edge Function: `product-photo-thumb`
   - Events: `INSERT` and `UPDATE`
   - Leave “Verify JWT” disabled (the function is protected via service role)

### What the Function Does

1. Skips non-image uploads and any paths already containing `thumbs/`.
2. Downloads the original object via service-role credentials.
3. Generates a 150 × 150 px thumbnail (fit inside, no upscaling) via `sharp`.
4. Stores the thumbnail at `thumbs/<original-path>` inside the same bucket.
5. Makes the thumbnail public and writes the URL to `products.photo_thumb_url`
   by inferring the product ID from the leading folder in the path
   (`<productId>/<file>`).

### Frontend Usage

- `PriceListPrintView.tsx` and other product views already prefer
  `photo_thumb_url` and fall back to `photo_url`.
- Existing manual thumbnail creation (e.g. inside `ProductFormModal`) continues
  to work; automatic thumbnails keep legacy data compatible.

### Troubleshooting

- **No thumbnail is produced** → confirm the object lives in `product-photos`
  and the webhook targets the deployed Edge Function.
- **Product thumbnail URL not updated** → verify the uploaded path begins with
  the product ID (e.g. `abc123/main.jpg`). Otherwise the function cannot link
  the file to a product row.

This automation keeps listino PDFs lightweight without changing existing upload
workflows.***




