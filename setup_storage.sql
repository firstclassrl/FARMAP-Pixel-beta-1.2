-- Create storage buckets for Garden product features

-- Bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Bucket for product documents (ST, SDS)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-documents',
  'product-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf']
);

-- RLS policies for product-images bucket
CREATE POLICY "Public read access for product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
  AND (
    -- Admin can upload any image
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR
    -- Production can upload images
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'production'
    )
  )
);

CREATE POLICY "Authenticated users can update product images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
  AND (
    -- Admin can update any image
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR
    -- Production can update images
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'production'
    )
  )
);

CREATE POLICY "Authenticated users can delete product images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
  AND (
    -- Admin can delete any image
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR
    -- Production can delete images
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'production'
    )
  )
);

-- RLS policies for product-documents bucket
CREATE POLICY "Authenticated users can read product documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'product-documents' 
  AND auth.role() = 'authenticated'
  AND (
    -- Admin can read any document
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR
    -- Customer users can read documents
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'customer_user'
    )
  )
);

CREATE POLICY "Admin can upload product documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-documents' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admin can update product documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-documents' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admin can delete product documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-documents' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
