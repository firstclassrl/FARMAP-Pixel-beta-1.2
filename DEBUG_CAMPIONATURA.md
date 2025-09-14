# 🔍 Debug Campionatura - Dropdown Clienti Vuoto

## 🚨 **Problema**

Nella modal "Nuova Richiesta Campioni" il dropdown "Cliente" mostra "Seleziona cliente" ma non carica i clienti disponibili.

## 🔧 **Debug Aggiunto**

Ho aggiunto dei log di debug nella pagina campionatura per identificare il problema:

### **Log Aggiunti:**
1. **Caricamento clienti** - Mostra i dati e eventuali errori
2. **Caricamento prodotti** - Mostra i dati e eventuali errori  
3. **Conteggio finale** - Mostra quanti clienti/prodotti sono stati caricati
4. **Fallback UI** - Mostra "Nessun cliente attivo disponibile" se non ci sono clienti

## 🔍 **Come Debuggare**

### **STEP 1: Apri la Console del Browser**

1. **Vai alla pagina Campionatura**
2. **Apri Developer Tools** (F12 o Cmd+Option+I)
3. **Vai alla tab "Console"**
4. **Clicca "Nuova Richiesta Campioni"**

### **STEP 2: Controlla i Log**

Dovresti vedere questi log nella console:

```
Campionatura - Caricamento clienti: { customersData: [...], customersError: null }
Campionatura - Caricamento prodotti: { productsData: [...], productsError: null }
Campionatura - Dati caricati: { customersCount: X, productsCount: Y, sampleRequestsCount: Z }
```

### **STEP 3: Analizza i Risultati**

#### **Se customersData è vuoto []:**
- **Problema**: Non ci sono clienti attivi nel database
- **Soluzione**: Aggiungi clienti di test o verifica che i clienti esistenti abbiano `is_active = true`

#### **Se customersError non è null:**
- **Problema**: Errore nella query SQL
- **Soluzione**: Controlla l'errore specifico e risolvi

#### **Se customersCount è 0:**
- **Problema**: La query non restituisce risultati
- **Soluzione**: Verifica che ci siano clienti nel database

## 🛠️ **Possibili Cause e Soluzioni**

### **Causa 1: Nessun Cliente Attivo**
```sql
-- Verifica se ci sono clienti attivi
SELECT id, company_name, is_active FROM customers WHERE is_active = true;
```

**Se il risultato è vuoto:**
```sql
-- Attiva tutti i clienti esistenti
UPDATE customers SET is_active = true WHERE is_active IS NULL OR is_active = false;
```

### **Causa 2: Errore nella Query**
Controlla la console per errori specifici come:
- `column "is_active" does not exist` → La colonna manca
- `permission denied` → Problema RLS
- `relation "customers" does not exist` → La tabella manca

### **Causa 3: Problema RLS**
Se vedi errori di permessi:
```sql
-- Disabilita temporaneamente RLS per test
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
```

### **Causa 4: Clienti Esistenti ma Non Attivi**
```sql
-- Conta tutti i clienti
SELECT COUNT(*) as total_customers FROM customers;

-- Conta clienti attivi
SELECT COUNT(*) as active_customers FROM customers WHERE is_active = true;
```

## 📋 **Checklist di Debug**

- [ ] **Console aperta** e log visibili
- [ ] **Log "Caricamento clienti"** eseguito senza errori
- [ ] **customersData** contiene array di clienti
- [ ] **customersError** è null
- [ ] **customersCount** > 0
- [ ] **Dropdown** mostra i clienti disponibili

## 🎯 **Test Rapido**

### **Test 1: Verifica Database**
```sql
SELECT id, company_name, is_active FROM customers LIMIT 5;
```

### **Test 2: Verifica Query Frontend**
La query frontend è:
```sql
SELECT id, company_name, contact_person 
FROM customers 
WHERE is_active = true 
ORDER BY company_name;
```

### **Test 3: Test Manuale**
1. **Apri Console**
2. **Vai a Campionatura**
3. **Clicca "Nuova Richiesta Campioni"**
4. **Controlla i log**
5. **Verifica il dropdown**

## 🚨 **Se Niente Funziona**

### **Soluzione di Emergenza:**
```sql
-- Crea un cliente di test
INSERT INTO customers (id, company_name, contact_person, is_active, created_by)
VALUES (
  gen_random_uuid(),
  'Cliente Test Campionatura',
  'Test Contact',
  true,
  (SELECT id FROM auth.users LIMIT 1)
);
```

## 📝 **Report del Debug**

Dopo aver eseguito il debug, riporta:

1. **Log della console** (copia e incolla)
2. **Numero di clienti** nel database
3. **Numero di clienti attivi** nel database
4. **Eventuali errori** specifici
5. **Comportamento del dropdown** (vuoto, errore, etc.)

**ESEGUI IL DEBUG E RIPORTA I RISULTATI DELLA CONSOLE!**
