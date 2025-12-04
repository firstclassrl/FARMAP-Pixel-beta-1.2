# 📄 Configurazione Bucket order-pdfs

## 🎯 Obiettivo

Configurare il bucket `order-pdfs` in Supabase Storage per l'upload dei PDF dei listini che vengono inviati via email.

## 🔧 Istruzioni

### **STEP 1: Creare Bucket in Supabase**

1. **Accedere a Supabase Dashboard**
2. **Andare su Storage** (menu laterale)
3. **Cliccare "New bucket"**
4. **Configurare il bucket**:
   - **Nome**: `order-pdfs`
   - **Public**: ✅ **SÌ** (per permettere accesso pubblico ai PDF)
   - **File size limit**: 10MB (consigliato per PDF)
   - **Allowed MIME types**: `application/pdf`

### **STEP 2: Configurare Policy RLS**

Dopo aver creato il bucket, esegui lo script SQL `CONFIGURA_BUCKET_ORDER_PDFS.sql` nel database Supabase per configurare automaticamente le policy RLS.

Oppure esegui manualmente:

```sql
-- Policy per permettere upload dei PDF
CREATE POLICY "Allow authenticated users to upload order pdfs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'order-pdfs' 
  AND auth.role() = 'authenticated'
);

-- Policy per permettere lettura pubblica dei PDF
CREATE POLICY "Allow public read access to order pdfs" ON storage.objects
FOR SELECT USING (bucket_id = 'order-pdfs');

-- Policy per permettere aggiornamento dei PDF
CREATE POLICY "Allow authenticated users to update order pdfs" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'order-pdfs' 
  AND auth.role() = 'authenticated'
);

-- Policy per permettere eliminazione dei PDF
CREATE POLICY "Allow authenticated users to delete order pdfs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'order-pdfs' 
  AND auth.role() = 'authenticated'
);
```

### **STEP 3: Verificare Configurazione**

1. **Testare upload** di un PDF di prova
2. **Verificare** che l'URL pubblico sia accessibile
3. **Controllare** che le policy funzionino correttamente

## 📋 Struttura File

I PDF verranno salvati con questa struttura:
```
order-pdfs/
├── listino_[price_list_id]_[timestamp].pdf
├── listino_[price_list_id]_[timestamp].pdf
└── ...
```

## 🔗 URL Pubblico

I PDF saranno accessibili tramite URL pubblico:
```
https://[project-id].supabase.co/storage/v1/object/public/order-pdfs/listino_[id]_[timestamp].pdf
```

## ✅ Verifica Funzionamento

Dopo aver configurato il bucket:

1. **Inviare un listino via email** dalla modale
2. **Verificare** che il PDF sia caricato nel bucket
3. **Controllare** che l'URL sia accessibile pubblicamente
4. **Testare** che il webhook N8N riceva l'URL corretto

## 🚨 Note Importanti

- **Bucket deve essere pubblico** per permettere accesso ai PDF da N8N
- **Policy RLS** devono essere configurate correttamente
- **Formato supportato**: PDF
- **Dimensione massima**: 10MB (configurabile)
- **Nome file**: `listino_[price_list_id]_[timestamp].pdf`

## 🎯 Risultato

Una volta configurato:
- ✅ **Upload PDF** funzionante
- ✅ **URL pubblici** accessibili
- ✅ **Gestione automatica** dei file
- ✅ **Integrazione** con webhook N8N per invio email

La configurazione è completa! 🚀

