# 🔍 Debug Upload Foto

## ✅ Log di Debug Aggiunti

Ho aggiunto dei log di debug per tracciare il processo di upload delle foto:

### **Log Console**
1. **Selezione Foto**: `🔄 Converting photo to base64...` (per anteprima)
2. **Dati Prodotto**: `📦 Product data to save:` (senza foto)
3. **Salvataggio DB**: `💾 Saving product to database...`
4. **Prodotto Salvato**: `✅ Product saved successfully: [ID]`
5. **Upload Foto**: `📸 Uploading photo to bucket...`
6. **Upload Riuscito**: `✅ Photo uploaded successfully: [URL]`
7. **Aggiornamento DB**: `✅ Photo URL updated in database`

## 🔧 Come Testare

### **STEP 1: Aprire Console Browser**
1. Aprire la pagina Prodotti
2. Premere `F12` per aprire Developer Tools
3. Andare su tab "Console"

### **STEP 2: Testare Upload Foto**
1. Cliccare "Nuovo Prodotto"
2. Compilare i campi obbligatori
3. **Selezionare una foto** (JPG, PNG, GIF)
4. Cliccare "Crea Prodotto"
5. **Osservare i log** nella console

### **STEP 3: Verificare Log**
Dovresti vedere questa sequenza:
```
🔄 Converting photo to base64... nome-foto.jpg
📦 Product data to save: { code: "PB0001", name: "Prodotto", ... }
💾 Saving product to database...
✅ Product saved successfully: [UUID]
📸 Uploading photo to bucket...
📁 Uploading to bucket product-photos with path: [UUID]/product_photo.jpg
✅ Photo uploaded successfully: https://[project].supabase.co/storage/v1/object/public/product-photos/[UUID]/product_photo.jpg
✅ Photo URL updated in database
```

## 🚨 Possibili Problemi

### **Problema 1: Foto non selezionata**
- **Sintomo**: Nessun log di conversione
- **Causa**: File non selezionato correttamente
- **Soluzione**: Verificare che il file sia valido

### **Problema 2: Errore conversione**
- **Sintomo**: `❌ Error converting photo: [errore]`
- **Causa**: File corrotto o formato non supportato
- **Soluzione**: Provare con un'altra immagine

### **Problema 3: Errore database**
- **Sintomo**: `❌ Database error: [errore]`
- **Causa**: Campo `photo_url` non esiste nel database
- **Soluzione**: Eseguire script SQL per aggiungere il campo

### **Problema 4: Errore upload bucket**
- **Sintomo**: `❌ Upload error: [errore]`
- **Causa**: Bucket `product-photos` non esiste o non è configurato
- **Soluzione**: Creare bucket e configurare policy RLS

### **Problema 5: Foto non salvata**
- **Sintomo**: `✅ Photo uploaded successfully` ma nessun aggiornamento DB
- **Causa**: Errore nell'aggiornamento del campo `photo_url`
- **Soluzione**: Verificare struttura database e policy

## 📋 Checklist Debug

- [ ] **Console aperta** durante il test
- [ ] **Foto selezionata** correttamente
- [ ] **Log di conversione** visibili
- [ ] **Log di salvataggio** visibili
- [ ] **Foto presente** nel database
- [ ] **Nessun errore** nella console

## 🎯 Risultato Atteso

Se tutto funziona correttamente:
1. ✅ Foto selezionata → Anteprima visibile
2. ✅ Conversione base64 → Log di successo
3. ✅ Salvataggio database → Prodotto creato
4. ✅ Foto salvata → Campo `photo_url` popolato

## 📞 Supporto

Se il problema persiste, condividere:
1. **Log della console** (screenshot o testo)
2. **Tipo di file** utilizzato (JPG, PNG, GIF)
3. **Dimensione file** (MB)
4. **Messaggi di errore** specifici

La funzionalità dovrebbe ora funzionare correttamente! 🚀
