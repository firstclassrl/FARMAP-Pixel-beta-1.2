# Modifiche Modal Clienti

## 📋 Panoramica

Sono state apportate modifiche alla modal clienti per riorganizzare i campi e modificare il campo "termini di pagamento" da numerico a alfanumerico.

## 🎨 Modifiche Interfaccia

### 1. **Riorganizzazione Campi**

#### **Prima Riga: Codice Cliente - Ragione Sociale**
- **Campo 1**: Codice Cliente
  - Validazione: Solo lettere e numeri, max 20 caratteri
  - Placeholder: "Es: CLI001"
  - Descrizione: "Codice univoco del cliente (es: CLI001, CLI002)"

- **Campo 2**: Ragione Sociale *
  - Campo obbligatorio
  - Placeholder: "Nome dell'azienda"

#### **Seconda Riga: Prefisso Codice Prodotto - Persona di Contatto**
- **Campo 1**: Prefisso Codice Prodotto
  - Validazione: Solo lettere, max 2 caratteri
  - Placeholder: "Es: PB"
  - Descrizione: "Due lettere per identificare i prodotti di questo cliente (es: PB0001)"

- **Campo 2**: Persona di Contatto
  - Placeholder: "Nome del referente"

### 2. **Campo Termini di Pagamento**

#### **Modifiche Apportate**
- **Tipo**: Da `number` a `text` (alfanumerico)
- **Validazione**: Rimosso controllo numerico
- **Placeholder**: "Es: 30 giorni, FOB, CIF, Contanti"
- **Valore Default**: "30 giorni" (invece di 30)
- **Descrizione**: "Termini di pagamento in formato alfanumerico"

#### **Esempi di Valori Supportati**
- `30 giorni`
- `60 giorni`
- `FOB`
- `CIF`
- `Contanti`
- `Bonifico anticipato`
- `Rimessa diretta`

## 🗄️ Modifiche Database

### Script SQL (`MODIFICA_PAYMENT_TERMS_FIELD.sql`)

```sql
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

### Caratteristiche del Campo

- **Tipo**: `VARCHAR(50)`
- **Lunghezza**: Massimo 50 caratteri
- **Valore Default**: "30 giorni"
- **Compatibilità**: Conversione automatica dei valori esistenti

## 🔧 Modifiche Tecniche

### 1. **Tipi TypeScript** (`src/types/database.types.ts`)

```typescript
// Prima
payment_terms: number

// Dopo
payment_terms: string
```

### 2. **Stato del Form** (`src/pages/CustomersPage.tsx`)

```typescript
// Prima
payment_terms: 30

// Dopo
payment_terms: '30 giorni'
```

### 3. **Input Field**

```typescript
// Prima
<Input
  type="number"
  min="0"
  value={formData.payment_terms}
  onChange={e => setFormData({ ...formData, payment_terms: parseInt(e.target.value) || 30 })}
  placeholder="30"
/>

// Dopo
<Input
  value={formData.payment_terms}
  onChange={e => setFormData({ ...formData, payment_terms: e.target.value })}
  placeholder="Es: 30 giorni, FOB, CIF, Contanti"
/>
```

### 4. **Import CSV** (`src/components/ImportCustomersModal.tsx`)

```typescript
// Aggiunto al template CSV
'payment_terms'

// Esempio nel template
'30 giorni'
```

## 📊 Layout Finale Modal

### **Prima Riga**
```
[ Codice Cliente        ] [ Ragione Sociale *        ]
```

### **Seconda Riga**
```
[ Prefisso Codice Prod. ] [ Persona di Contatto      ]
```

### **Terza Riga**
```
[ Email                 ] [ Telefono                 ]
```

### **Quarta Riga**
```
[ Indirizzo             ] [ Città                    ]
```

### **Quinta Riga**
```
[ CAP                   ] [ Provincia                ]
```

### **Sesta Riga**
```
[ Paese                 ] [ Partita IVA              ]
```

### **Settima Riga**
```
[ Codice Fiscale        ] [ Termini di Pagamento     ]
```

### **Ottava Riga**
```
[ Sconto Predefinito %  ] [ Note                     ]
```

## 🚀 Come Utilizzare

### Creazione Nuovo Cliente

1. **Codice Cliente**: Inserisci un codice univoco (es: CLI001)
2. **Ragione Sociale**: Nome dell'azienda (obbligatorio)
3. **Prefisso Codice Prodotto**: Due lettere per i prodotti (es: PB)
4. **Termini di Pagamento**: Inserisci in formato alfanumerico (es: "30 giorni")

### Modifica Cliente Esistente

1. I termini di pagamento esistenti vengono convertiti automaticamente
2. Puoi modificare il formato da numerico ad alfanumerico
3. Esempio: da "30" a "30 giorni"

### Importazione da CSV

1. Scarica il template aggiornato
2. Includi la colonna `payment_terms` con valori alfanumerici
3. Esempi: "30 giorni", "FOB", "CIF", "Contanti"

## ✅ Benefici

1. **Flessibilità**: Termini di pagamento più descrittivi
2. **Chiarezza**: Formato alfanumerico più comprensibile
3. **Compatibilità**: Conversione automatica dei dati esistenti
4. **Organizzazione**: Layout più logico dei campi
5. **User Experience**: Interfaccia più intuitiva

## 🔍 Esempi Pratici

### Termini di Pagamento Supportati

- **Temporali**: "30 giorni", "60 giorni", "90 giorni"
- **Modalità**: "FOB", "CIF", "EXW", "DDP"
- **Metodi**: "Contanti", "Bonifico", "Assegno"
- **Combinati**: "30 giorni FOB", "Bonifico anticipato"

### Layout Campi

```
┌─────────────────────────────────────────────────────────┐
│ Codice Cliente    │ Ragione Sociale *                   │
├───────────────────┼─────────────────────────────────────┤
│ Prefisso Codice   │ Persona di Contatto                 │
├───────────────────┼─────────────────────────────────────┤
│ Email             │ Telefono                            │
├───────────────────┼─────────────────────────────────────┤
│ Indirizzo         │ Città                               │
├───────────────────┼─────────────────────────────────────┤
│ CAP               │ Provincia                           │
├───────────────────┼─────────────────────────────────────┤
│ Paese             │ Partita IVA                         │
├───────────────────┼─────────────────────────────────────┤
│ Codice Fiscale    │ Termini di Pagamento                │
├───────────────────┼─────────────────────────────────────┤
│ Sconto Predefinito│ Note                                │
└───────────────────┴─────────────────────────────────────┘
```

## 📝 Note Importanti

1. **Eseguire lo script SQL** prima di utilizzare le modifiche
2. **Backup database** prima delle modifiche
3. **Conversione automatica** dei valori esistenti
4. **Validazione rimossa** per il campo termini di pagamento
5. **Template CSV aggiornato** per l'importazione

## 🔧 Troubleshooting

### Errore "Invalid Input"
- Verificare che lo script SQL sia stato eseguito
- Controllare i tipi TypeScript

### Valori Non Convertiti
- Eseguire manualmente l'UPDATE per i valori numerici
- Verificare il formato dei dati esistenti

### Import Fallito
- Verificare il formato del CSV
- Controllare che il campo payment_terms sia incluso

