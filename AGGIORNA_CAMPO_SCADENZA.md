# 🔄 Aggiornamento Campo Scadenza

## ✅ Modifiche Completate

Ho cambiato il campo `scadenza` da tipo `DATE` a tipo `TEXT` per permettere l'inserimento di durate come "3 anni", "2 anni", ecc.

### **Modifiche Applicate**

1. **Script SQL aggiornato**: `ADD_NEW_PRODUCT_FIELDS.sql`
2. **Form UI aggiornato**: Placeholder e descrizione cambiati
3. **Istruzioni aggiornate**: Formato anni invece di MM/YYYY

## 🔧 Istruzioni per l'Utente

### **STEP 1: Eseguire Script SQL Aggiornato**

**Eseguire questo script nel database Supabase:**

```sql
-- Aggiungere nuovi campi (incluso photo_url e scadenza come TEXT)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS cartone TEXT,
ADD COLUMN IF NOT EXISTS pallet TEXT,
ADD COLUMN IF NOT EXISTS strati INTEGER,
ADD COLUMN IF NOT EXISTS scadenza TEXT,
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
COMMENT ON COLUMN public.products.scadenza IS 'Durata di scadenza del prodotto (es. 3 anni, 2 anni)';
COMMENT ON COLUMN public.products.iva IS 'Percentuale IVA (default 22%)';
COMMENT ON COLUMN public.products.ean IS 'Codice EAN del prodotto';
COMMENT ON COLUMN public.products.photo_url IS 'URL della foto del prodotto (base64 data URL)';
COMMENT ON COLUMN public.products.weight IS 'Peso del prodotto (ora opzionale)';
```

### **STEP 2: Ricaricare la Pagina**

Dopo aver eseguito lo script SQL:
1. **Ricaricare completamente** la pagina del form prodotto (F5)
2. **Testare** la creazione di un nuovo prodotto

### **STEP 3: Testare Nuovo Formato**

1. **Aprire** il form "Nuovo Prodotto"
2. **Compilare** i campi obbligatori
3. **Nel campo "Scadenza"** inserire:
   - ✅ `3 anni`
   - ✅ `2 anni`
   - ✅ `1 anno`
   - ✅ `6 mesi`
   - ✅ `lunga durata`
4. **Selezionare una foto** (opzionale)
5. **Salvare** il prodotto

## 🎯 Risultato Atteso

Dopo l'aggiornamento:
- ✅ **Campo scadenza** accetta testo libero
- ✅ **Formato anni** funzionante (es. "3 anni")
- ✅ **Upload foto** funzionante
- ✅ **Nessun errore** di formato data

## 📋 Formato Corretto

| Campo | Formato | Esempi |
|-------|---------|--------|
| **Scadenza** | Testo libero | `3 anni`, `2 anni`, `1 anno`, `6 mesi` |
| **IVA** | Numero | `22`, `10`, `4` |
| **Strati** | Numero | `5`, `10`, `15` |
| **EAN** | Testo | `1234567890123` |

## 🚨 Note Importanti

1. **Eseguire lo script SQL** è **OBBLIGATORIO**
2. **Ricaricare la pagina** dopo aver eseguito lo script
3. **Formato scadenza** ora è testo libero
4. **Upload foto** dovrebbe funzionare correttamente

## 🎉 Test Finale

Dopo aver eseguito lo script SQL, testa:
1. **Creazione prodotto** con scadenza "3 anni"
2. **Upload foto** nel bucket `product-photos`
3. **Verifica** che tutto funzioni senza errori

La funzionalità è pronta! 🚀
