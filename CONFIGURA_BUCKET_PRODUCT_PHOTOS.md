# 📸 Configurazione Bucket product-photos

## 🎯 Obiettivo

Configurare il bucket `product-photos` in Supabase Storage per l'upload delle foto dei prodotti.

## 🔧 Istruzioni

### **STEP 1: Creare Bucket in Supabase**

1. **Accedere a Supabase Dashboard**
2. **Andare su Storage** (menu laterale)
3. **Cliccare "New bucket"**
4. **Configurare il bucket**:
   - **Nome**: `product-photos`
   - **Public**: ✅ **SÌ** (per permettere accesso pubblico alle foto)
   - **File size limit**: 5MB (o come preferisci)
   - **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp`

### **STEP 2: Configurare Policy RLS**

Dopo aver creato il bucket, configurare le policy per permettere l'upload:

```sql
-- Policy per permettere upload delle foto
CREATE POLICY "Allow authenticated users to upload product photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-photos' 
  AND auth.role() = 'authenticated'
);

-- Policy per permettere lettura pubblica delle foto
CREATE POLICY "Allow public read access to product photos" ON storage.objects
FOR SELECT USING (bucket_id = 'product-photos');

-- Policy per permettere aggiornamento delle foto
CREATE POLICY "Allow authenticated users to update product photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-photos' 
  AND auth.role() = 'authenticated'
);

-- Policy per permettere eliminazione delle foto
CREATE POLICY "Allow authenticated users to delete product photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-photos' 
  AND auth.role() = 'authenticated'
);
```

### **STEP 3: Verificare Configurazione**

1. **Testare upload** di un'immagine di prova
2. **Verificare** che l'URL pubblico sia accessibile
3. **Controllare** che le policy funzionino correttamente

## 📋 Struttura File

Le foto verranno salvate con questa struttura:
```
product-photos/
├── [product-id-1]/
│   └── product_photo.jpg
├── [product-id-2]/
│   └── product_photo.png
└── [product-id-3]/
    └── product_photo.gif
```

## 🔗 URL Pubblico

Le foto saranno accessibili tramite URL pubblico:
```
https://[project-id].supabase.co/storage/v1/object/public/product-photos/[product-id]/product_photo.[ext]
```

## ✅ Verifica Funzionamento

Dopo aver configurato il bucket:

1. **Creare un nuovo prodotto** con foto
2. **Verificare** che la foto sia caricata nel bucket
3. **Controllare** che l'URL sia salvato nel database
4. **Testare** che la foto sia visibile pubblicamente

## 🚨 Note Importanti

- **Bucket deve essere pubblico** per permettere visualizzazione foto
- **Policy RLS** devono essere configurate correttamente
- **Formati supportati**: JPG, PNG, GIF, WebP
- **Dimensione massima**: 5MB (configurabile)

## 🎯 Risultato

Una volta configurato:
- ✅ **Upload foto** funzionante
- ✅ **URL pubblici** accessibili
- ✅ **Gestione automatica** dei file
- ✅ **Integrazione** con il form prodotto

La configurazione è completa! 🚀
