# 📸 Configurazione Bucket sample-photos

## 🎯 Obiettivo

Configurare il bucket `sample-photos` in Supabase Storage per l'upload delle foto dei campioni inviati.

## 🔧 Istruzioni

### **STEP 1: Creare Bucket in Supabase**

1. **Accedere a Supabase Dashboard**
2. **Andare su Storage** (menu laterale)
3. **Cliccare "New bucket"**
4. **Configurare il bucket**:
   - **Nome**: `sample-photos`
   - **Public**: ✅ **SÌ** (per permettere accesso pubblico alle foto)
   - **File size limit**: 5MB (o come preferisci)
   - **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp`

### **STEP 2: Configurare Policy RLS**

Dopo aver creato il bucket, esegui lo script SQL `CONFIGURA_RLS_SAMPLE_PHOTOS.sql` nel database Supabase per configurare automaticamente le policy RLS.

**Oppure** esegui manualmente queste query:

```sql
-- Policy per permettere upload delle foto
CREATE POLICY "Allow authenticated users to upload sample photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'sample-photos' 
  AND auth.role() = 'authenticated'
);

-- Policy per permettere lettura pubblica delle foto
CREATE POLICY "Allow public read access to sample photos" ON storage.objects
FOR SELECT USING (bucket_id = 'sample-photos');

-- Policy per permettere aggiornamento delle foto
CREATE POLICY "Allow authenticated users to update sample photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'sample-photos' 
  AND auth.role() = 'authenticated'
);

-- Policy per permettere eliminazione delle foto
CREATE POLICY "Allow authenticated users to delete sample photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'sample-photos' 
  AND auth.role() = 'authenticated'
);
```

**NOTA**: Lo script SQL `CONFIGURA_RLS_SAMPLE_PHOTOS.sql` è stato creato e può essere eseguito direttamente nel SQL Editor di Supabase.

### **STEP 3: Verificare Configurazione**

1. **Testare upload** di un'immagine di prova
2. **Verificare** che l'URL pubblico sia accessibile
3. **Controllare** che le policy funzionino correttamente

## 📋 Struttura File

Le foto verranno salvate con questa struttura:
```
sample-photos/
├── [sample-request-id-1]/
│   ├── main.jpg
│   └── thumb.jpg
├── [sample-request-id-2]/
│   ├── main.jpg
│   └── thumb.jpg
└── [sample-request-id-3]/
    ├── main.jpg
    └── thumb.jpg
```

## 🔗 URL Pubblico

Le foto saranno accessibili tramite URL pubblico:
```
https://[project-id].supabase.co/storage/v1/object/public/sample-photos/[sample-request-id]/main.jpg
```

## ✅ Verifica Funzionamento

Dopo aver configurato il bucket:

1. **Creare una nuova richiesta campioni** con foto
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
- ✅ **Integrazione** con il form richiesta campioni

La configurazione è completa! 🚀

