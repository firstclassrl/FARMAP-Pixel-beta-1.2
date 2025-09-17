# 🚨 URGENTE: Fix Campo photo_url

## ❌ Problema Identificato

L'errore è chiarissimo dalla console:
```
"Could not find the 'photo_url' column of 'products' in the schema cache"
```

**Il campo `photo_url` non esiste nel database!**

## ✅ Soluzione

### **STEP 1: Eseguire Script SQL Aggiornato**

Il file `ADD_NEW_PRODUCT_FIELDS.sql` è stato aggiornato per includere il campo `photo_url`.

**Eseguire questo script nel database Supabase:**

```sql
-- Aggiungere nuovi campi
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS cartone TEXT,
ADD COLUMN IF NOT EXISTS pallet TEXT,
ADD COLUMN IF NOT EXISTS strati INTEGER,
ADD COLUMN IF NOT EXISTS scadenza DATE,
ADD COLUMN IF NOT EXISTS iva DECIMAL(5,2) DEFAULT 22.00,
ADD COLUMN IF NOT EXISTS ean TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Rendere il campo peso opzionale (rimuovere NOT NULL se presente)
ALTER TABLE public.products 
ALTER COLUMN weight DROP NOT NULL;

-- Aggiungere commenti per documentare i nuovi campi
COMMENT ON COLUMN public.products.cartone IS 'Tipo di cartone/imballaggio del prodotto';
COMMENT ON COLUMN public.products.pallet IS 'Informazioni sul pallet';
COMMENT ON COLUMN public.products.strati IS 'Numero di strati nel pallet';
COMMENT ON COLUMN public.products.scadenza IS 'Data di scadenza del prodotto';
COMMENT ON COLUMN public.products.iva IS 'Percentuale IVA (default 22%)';
COMMENT ON COLUMN public.products.ean IS 'Codice EAN del prodotto';
COMMENT ON COLUMN public.products.photo_url IS 'URL della foto del prodotto (base64 data URL)';
COMMENT ON COLUMN public.products.weight IS 'Peso del prodotto (ora opzionale)';
```

### **STEP 2: Verificare Struttura Database**

Dopo aver eseguito lo script, verificare che il campo sia stato aggiunto:

```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

### **STEP 3: Testare Upload Foto**

1. **Ricaricare la pagina** del form prodotto
2. **Selezionare una foto**
3. **Salvare il prodotto**
4. **Verificare** che non ci siano più errori

## 🎯 Risultato Atteso

Dopo aver eseguito lo script SQL:
- ✅ **Campo `photo_url`** aggiunto al database
- ✅ **Upload foto** funzionante
- ✅ **Nessun errore** nella console
- ✅ **Foto salvata** come base64 nel database

## 🚨 Note Importanti

1. **Eseguire lo script SQL** è **OBBLIGATORIO**
2. **Il campo `photo_url`** deve esistere nel database
3. **Ricaricare la pagina** dopo aver eseguito lo script
4. **Testare** immediatamente dopo la modifica

## 📞 Se il Problema Persiste

Se dopo aver eseguito lo script SQL il problema persiste:
1. **Verificare** che lo script sia stato eseguito correttamente
2. **Controllare** che il campo `photo_url` sia presente nella tabella
3. **Ricaricare** completamente la pagina
4. **Pulire** la cache del browser

La soluzione è semplice: **eseguire lo script SQL aggiornato!** 🚀
