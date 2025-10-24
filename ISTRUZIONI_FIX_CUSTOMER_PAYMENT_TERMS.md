# 🔧 Fix Errore Termini di Pagamento Cliente

## ⚠️ PROBLEMA IDENTIFICATO

L'errore `invalid input syntax for type integer: "riba"` indica che il campo `payment_terms` nella tabella `customers` è ancora di tipo `INTEGER` nel database, ma il frontend sta inviando stringhe alfanumeriche.

## ✅ SOLUZIONE

### **STEP 1: Eseguire Script SQL**

**Eseguire questo script nel database Supabase:**

```sql
-- Corregge il campo payment_terms nella tabella customers da INTEGER a VARCHAR
-- Questo risolve l'errore "invalid input syntax for type integer" quando si inserisce testo libero

-- Prima, aggiorna i dati esistenti convertendo i numeri in stringhe
UPDATE customers 
SET payment_terms = payment_terms::text || ' giorni'
WHERE payment_terms IS NOT NULL 
AND payment_terms::text ~ '^[0-9]+$';

-- Modifica il tipo di colonna da INTEGER a VARCHAR
ALTER TABLE customers 
ALTER COLUMN payment_terms TYPE VARCHAR(50);

-- Aggiungi un commento per documentare il cambio
COMMENT ON COLUMN customers.payment_terms IS 'Termini di pagamento in formato alfanumerico (es. "30 giorni", "FOB", "CIF", "Contanti")';

-- Opzionale: Aggiorna i valori NULL con un valore di default
UPDATE customers 
SET payment_terms = '30 giorni'
WHERE payment_terms IS NULL;
```

### **STEP 2: Verificare la Correzione**

Dopo aver eseguito lo script SQL:

1. **Ricaricare completamente** la pagina (F5)
2. **Aprire** la modale di modifica cliente
3. **Inserire** testo libero nel campo "Termini di Pagamento" (es. "30 giorni", "FOB", "Contanti")
4. **Salvare** il cliente
5. **Verificare** che non ci siano più errori nella console

### **STEP 3: Testare le Funzionalità**

1. **Creare un nuovo cliente** con termini di pagamento alfanumerici
2. **Modificare un cliente esistente** cambiando i termini di pagamento
3. **Verificare** che i dati vengano salvati correttamente
4. **Controllare** che non ci siano errori nella console del browser

## 🔍 DEBUGGING

Se l'errore persiste dopo l'esecuzione dello script:

1. **Controllare la console** del browser per errori
2. **Verificare** che il campo `payment_terms` sia di tipo `VARCHAR(50)` nella tabella `customers`
3. **Controllare** che i tipi TypeScript siano aggiornati
4. **Verificare** che non ci siano conversioni numeriche nel codice

## 📋 CAMPO CORRETTO

- **Tipo**: `VARCHAR(50)` (era `INTEGER`)
- **Lunghezza**: Massimo 50 caratteri
- **Valore Default**: "30 giorni"
- **Compatibilità**: Conversione automatica dei valori esistenti

## 🎯 RISULTATO ATTESO

Dopo l'esecuzione dello script:
- ✅ Il campo accetta testo alfanumerico libero
- ✅ Non ci sono più errori di tipo "invalid input syntax for type integer"
- ✅ I termini di pagamento vengono salvati correttamente
- ✅ I dati persistono tra le sessioni
