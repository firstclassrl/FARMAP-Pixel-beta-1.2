# 🔧 Istruzioni per le Condizioni di Vendita

## ⚠️ PROBLEMA IDENTIFICATO

Le condizioni di vendita non si salvano e non si visualizzano perché i campi non esistono ancora nel database.

## ✅ SOLUZIONE

### **STEP 1: Eseguire Script SQL**

**Eseguire questo script nel database Supabase:**

```sql
-- Aggiunge i campi per le condizioni di vendita alla tabella price_lists
-- Questi campi permetteranno di specificare pagamento, trasporto, tempi di consegna e marchio

-- Aggiungi i nuovi campi alla tabella price_lists
ALTER TABLE price_lists 
ADD COLUMN payment_conditions VARCHAR(255),
ADD COLUMN shipping_conditions VARCHAR(255),
ADD COLUMN delivery_conditions VARCHAR(255),
ADD COLUMN brand_conditions VARCHAR(255);

-- Aggiungi commenti per documentare i nuovi campi
COMMENT ON COLUMN price_lists.payment_conditions IS 'Condizioni di pagamento (es. "30 giorni", "Bonifico anticipato", "FOB")';
COMMENT ON COLUMN price_lists.shipping_conditions IS 'Condizioni di trasporto (es. "Franco fabbrica", "Porto franco", "FOB")';
COMMENT ON COLUMN price_lists.delivery_conditions IS 'Tempi di consegna (es. "15 giorni", "Su richiesta", "Immediato")';
COMMENT ON COLUMN price_lists.brand_conditions IS 'Marchio e condizioni commerciali (es. "Marchio cliente", "Marchio proprio", "White label")';

-- Imposta valori di default per i campi esistenti (opzionale)
UPDATE price_lists 
SET payment_conditions = '30 giorni',
    shipping_conditions = 'Franco fabbrica',
    delivery_conditions = 'Su richiesta',
    brand_conditions = 'Marchio proprio'
WHERE payment_conditions IS NULL;
```

### **STEP 2: Verificare l'Installazione**

Dopo aver eseguito lo script SQL:

1. **Ricaricare completamente** la pagina (F5)
2. **Testare** la creazione di un nuovo listino
3. **Compilare** i campi delle condizioni di vendita
4. **Salvare** il listino
5. **Verificare** che i dati vengano salvati
6. **Controllare** l'anteprima per vedere le condizioni

### **STEP 3: Testare le Funzionalità**

1. **Creare un nuovo listino** con condizioni di vendita
2. **Modificare un listino esistente** aggiungendo condizioni
3. **Visualizzare l'anteprima** per verificare la visualizzazione
4. **Generare il PDF** per verificare l'inclusione nel documento

## 🔍 DEBUGGING

Se le condizioni di vendita non funzionano ancora:

1. **Controllare la console** del browser per errori
2. **Verificare** che i campi esistano nella tabella `price_lists`
3. **Controllare** che i tipi TypeScript siano aggiornati
4. **Verificare** che la query di caricamento includa i nuovi campi

## 📋 CAMPI AGGIUNTI

- `payment_conditions` - Condizioni di pagamento
- `shipping_conditions` - Condizioni di trasporto  
- `delivery_conditions` - Tempi di consegna
- `brand_conditions` - Marchio e condizioni commerciali

## 🎯 RISULTATO ATTESO

Dopo l'esecuzione dello script:
- ✅ I campi delle condizioni di vendita si salvano correttamente
- ✅ Le condizioni appaiono nell'anteprima del listino
- ✅ Le condizioni sono incluse nel PDF generato
- ✅ I dati persistono tra le sessioni
