# 🔍 Fix Visibilità Listini nel Modal

## 🚨 **Problema Identificato**

I listini esistono nel database ma non si vedono nel modal "Nuovo Ordine da Listino" perché il modal filtra i listini e mostra solo quelli che hanno:

1. ✅ **`is_active = true`**
2. ✅ **Un cliente associato** (`price_list_id` nella tabella customers)
3. ✅ **Almeno un prodotto** (prodotti nella tabella `price_list_items`)

## 🔧 **Soluzione**

### **STEP 1: Verifica e Correggi i Listini Esistenti**

**Esegui questo SQL in Supabase:**

1. **Vai a Supabase Dashboard**
2. **Apri "SQL Editor"**
3. **Copia e incolla** tutto il contenuto di `VERIFICA_E_FIX_LISTINI.sql`
4. **Clicca "Run"**

**Questo SQL:**
- ✅ **Verifica** tutti i listini esistenti
- ✅ **Verifica** i clienti associati
- ✅ **Verifica** i prodotti nei listini
- ✅ **Corregge** i listini impostandoli come attivi
- ✅ **Associa** i listini ai clienti
- ✅ **Aggiunge** prodotti di test ai listini
- ✅ **Mostra** i listini che dovrebbero apparire nel modal

## 🎯 **Cosa Risolverà il Fix**

### **Prima del Fix:**
- ❌ **Listini esistenti** ma non visibili nel modal
- ❌ **"Nessun listino disponibile"** nel modal
- ❌ **Listini senza clienti associati**
- ❌ **Listini senza prodotti**

### **Dopo il Fix:**
- ✅ **Listini attivi** e visibili
- ✅ **Clienti associati** ai listini
- ✅ **Prodotti aggiunti** ai listini
- ✅ **Modal funzionante** con listini visibili

## 🔍 **Verifica del Fix**

### **Controlla i Risultati del SQL:**
Il SQL ti mostrerà:
- **Listini esistenti** nel database
- **Clienti associati** ai listini
- **Prodotti nei listini**
- **Listini che dovrebbero apparire** nel modal

### **Testa l'Applicazione:**
1. **Ricarica** la pagina Ordini
2. **Clicca "Nuovo Ordine da Listino"**
3. **Verifica** che i listini siano visibili nel dropdown
4. **Seleziona** un listino e verifica che funzioni

## 📋 **Checklist di Verifica**

- [ ] **SQL VERIFICA_E_FIX_LISTINI.sql** eseguito con successo
- [ ] **Listini mostrati** nei risultati del SQL
- [ ] **Clienti associati** ai listini
- [ ] **Prodotti aggiunti** ai listini
- [ ] **Modal "Nuovo Ordine da Listino"** mostra i listini
- [ ] **Selezione listino** funziona correttamente

## 🆘 **Se Qualcosa Non Funziona**

### **Errore "Table does not exist"**
- Le tabelle non esistono nel database
- Esegui prima le migrazioni del database

### **Errore "Permission denied"**
- Problema con le politiche RLS
- Verifica che l'utente abbia il ruolo `admin`

### **Listini ancora non visibili**
- Verifica che il SQL sia stato eseguito correttamente
- Controlla che non ci siano errori nel SQL Editor
- Verifica che i listini abbiano clienti e prodotti associati

## 🎉 **Risultato Atteso**

Dopo aver eseguito il fix:
- ✅ **Listini esistenti** visibili nel modal
- ✅ **Dropdown popolato** con i listini disponibili
- ✅ **Selezione listino** funzionante
- ✅ **Creazione ordine** da listino funzionante

## 📝 **Note Importanti**

- **Il SQL verifica** tutti i listini esistenti
- **I listini vengono corretti** automaticamente
- **I prodotti di test** vengono aggiunti se necessario
- **Le associazioni cliente-listino** vengono create

**ESEGUI IL SQL `VERIFICA_E_FIX_LISTINI.sql` PER RISOLVERE IL PROBLEMA DI VISIBILITÀ!**
