# Aggiunta Campo "Codice Cliente"

## 📋 Panoramica

È stato aggiunto il campo `codice_cliente` alla tabella `customers` e all'interfaccia utente per permettere l'identificazione univoca dei clienti con un codice personalizzato.

## 🗄️ Modifiche Database

### Script SQL (`ADD_CODICE_CLIENTE_FIELD.sql`)

```sql
-- Aggiunge il campo codice_cliente alla tabella customers
ALTER TABLE customers 
ADD COLUMN codice_cliente VARCHAR(20) UNIQUE;

-- Aggiungi un indice per migliorare le performance delle ricerche
CREATE INDEX idx_customers_codice_cliente ON customers(codice_cliente);

-- Aggiungi un commento per documentare il campo
COMMENT ON COLUMN customers.codice_cliente IS 'Codice univoco del cliente (es. CLI001, CLI002, etc.)';
```

### Caratteristiche del Campo

- **Tipo**: `VARCHAR(20)`
- **Unicità**: `UNIQUE` constraint per garantire codici univoci
- **Indice**: Creato per ottimizzare le ricerche
- **Opzionale**: Può essere `NULL` per clienti esistenti

## 🎨 Modifiche Frontend

### 1. **Tipi TypeScript** (`src/types/database.types.ts`)

Aggiornato l'interfaccia `Database` per includere il nuovo campo:

```typescript
customers: {
  Row: {
    // ... altri campi
    codice_cliente: string | null
  }
  Insert: {
    // ... altri campi
    codice_cliente?: string | null
  }
  Update: {
    // ... altri campi
    codice_cliente?: string | null
  }
}
```

### 2. **Pagina Clienti** (`src/pages/CustomersPage.tsx`)

#### Form di Creazione/Modifica
- **Nuovo campo**: Input per `codice_cliente`
- **Validazione**: Solo lettere e numeri, massimo 20 caratteri
- **Placeholder**: "Es: CLI001"
- **Posizione**: Accanto al campo "Prefisso Codice Prodotto"

#### Visualizzazione Lista
- **Nuovo elemento**: Mostra il codice cliente in blu
- **Posizione**: Sotto la P.IVA
- **Stile**: `text-blue-600 font-medium`

#### Stato del Form
- **initialFormData**: Aggiunto `codice_cliente: ''`
- **openEditForm**: Include il valore del codice cliente esistente

### 3. **Modal Importazione** (`src/components/ImportCustomersModal.tsx`)

#### Template CSV
- **Nuovo header**: `codice_cliente`
- **Esempio**: `CLI001`
- **Posizione**: Dopo `code_prefix`, prima di `is_active`

#### Anteprima Dati
- **Nuova colonna**: "Codice" nella tabella di anteprima
- **Visualizzazione**: Mostra il codice cliente o "-" se vuoto
- **Colspan**: Aggiornato da 5 a 6 colonne

#### Processamento Dati
- **Interface**: Aggiornata `CustomerImportData`
- **Validazione**: Campo opzionale, accetta valori null
- **Import**: Include il campo nell'inserimento batch

## 🚀 Come Utilizzare

### Creazione Nuovo Cliente

1. Vai alla **Pagina Clienti**
2. Clicca **"Nuovo Cliente"**
3. Compila il form includendo il **"Codice Cliente"**
4. Esempio: `CLI001`, `AZI001`, `CUST001`
5. Salva il cliente

### Modifica Cliente Esistente

1. Clicca **"Modifica"** su un cliente esistente
2. Aggiungi o modifica il **"Codice Cliente"**
3. Salva le modifiche

### Importazione da CSV

1. Scarica il **template aggiornato**
2. Includi la colonna `codice_cliente` nel CSV
3. Importa i clienti con i codici

## 📊 Esempi di Codici

### Formati Consigliati

- **CLI001, CLI002, CLI003** - Formato sequenziale
- **AZI001, AZI002, AZI003** - Prefisso azienda
- **CUST001, CUST002, CUST003** - Prefisso cliente
- **PB001, PB002, PB003** - Prefisso personalizzato

### Regole di Validazione

- **Caratteri**: Solo lettere maiuscole e numeri
- **Lunghezza**: Massimo 20 caratteri
- **Unicità**: Ogni codice deve essere univoco
- **Opzionale**: Può essere lasciato vuoto

## 🔧 Implementazione Tecnica

### Validazione Input

```typescript
onChange={e => {
  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 20);
  setFormData({ ...formData, codice_cliente: value });
}}
```

### Visualizzazione Condizionale

```typescript
{customer.codice_cliente && (
  <p className="text-xs text-blue-600 font-medium">
    Codice: {customer.codice_cliente}
  </p>
)}
```

### Import CSV

```typescript
interface CustomerImportData {
  // ... altri campi
  codice_cliente?: string;
  // ... altri campi
}
```

## ✅ Benefici

1. **Identificazione Univoca**: Codice personalizzato per ogni cliente
2. **Ricerca Veloce**: Indice database per performance ottimali
3. **Flessibilità**: Campo opzionale per compatibilità
4. **Import/Export**: Supporto completo per operazioni batch
5. **User Experience**: Interfaccia intuitiva e validazione real-time

## 🎯 Prossimi Sviluppi

- [ ] Generazione automatica codici sequenziali
- [ ] Ricerca per codice cliente
- [ ] Filtri per codice cliente
- [ ] Esportazione con codice cliente
- [ ] Validazione unicità real-time

## 📝 Note Importanti

1. **Eseguire lo script SQL** prima di utilizzare la funzionalità
2. **Backup database** prima delle modifiche
3. **Testare l'importazione** con file di prova
4. **Verificare l'unicità** dei codici durante l'inserimento
5. **Aggiornare la documentazione** se si modificano i formati

## 🔍 Troubleshooting

### Errore "Duplicate Key"
- Verificare che il codice cliente non sia già utilizzato
- Controllare la tabella per duplicati

### Campo Non Visibile
- Verificare che lo script SQL sia stato eseguito
- Controllare i tipi TypeScript

### Import Fallito
- Verificare il formato del CSV
- Controllare la validazione dei dati

