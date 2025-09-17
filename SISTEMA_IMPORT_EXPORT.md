# Sistema di Import/Export CSV

## 📋 Panoramica

Il sistema di import/export CSV permette di gestire grandi quantità di dati in modo efficiente:

- **Importazione Clienti**: Carica centinaia di clienti da file CSV
- **Importazione Prodotti**: Importa migliaia di prodotti con tutti i dettagli
- **Esportazione Ordini**: Esporta ordini con filtri avanzati in formato CSV

## 🚀 Funzionalità Implementate

### 1. Importazione Clienti (`ImportCustomersModal`)

**Posizione**: Pagina Clienti → Pulsante "Importa CSV"

**Campi supportati**:
- `company_name` (obbligatorio)
- `contact_person` (obbligatorio) 
- `email` (obbligatorio)
- `phone`
- `address`
- `city`
- `postal_code`
- `country`
- `code_prefix`
- `is_active`

**Validazioni**:
- Email formato valido
- Campi obbligatori presenti
- Controllo duplicati

**Template CSV**:
```csv
company_name,contact_person,email,phone,address,city,postal_code,country,code_prefix,is_active
Azienda Example SRL,Mario Rossi,mario.rossi@example.com,+39 123 456 7890,Via Roma 123,Milano,20100,Italia,EX,true
```

### 2. Importazione Prodotti (`ImportProductsModal`)

**Posizione**: Pagina Prodotti → Pulsante "Importa CSV"

**Campi supportati**:
- `code` (obbligatorio)
- `name` (obbligatorio)
- `description`
- `category`
- `unit` (obbligatorio)
- `base_price` (obbligatorio)
- `peso`
- `cartone`
- `pallet`
- `strati`
- `scadenza`
- `iva`
- `ean`
- `customer_id`
- `is_active`

**Validazioni**:
- Prezzo numerico valido
- Peso numerico valido
- IVA tra 0 e 100
- Customer ID esistente
- Campi obbligatori presenti

**Template CSV**:
```csv
code,name,description,category,unit,base_price,peso,cartone,pallet,strati,scadenza,iva,ean,customer_id,is_active
EX001,Prodotto Example,Descrizione del prodotto,Categoria Example,pz,10.50,1.5,12,100,5,3 anni,22,1234567890123,,true
```

### 3. Esportazione Ordini (`ExportOrdersModal`)

**Posizione**: Pagina Ordini → Pulsante "Esporta CSV"

**Filtri disponibili**:
- **Periodo**: Data inizio e fine
- **Stato**: Tutti, In Attesa, Confermato, In Elaborazione, Spedito, Consegnato, Annullato
- **Cliente**: Tutti i clienti o cliente specifico

**Dati esportati**:
- ID Ordine
- Numero Ordine
- Cliente
- Stato
- Data Creazione
- Data Aggiornamento
- Totale
- Note
- Dettagli prodotti (codice, nome, quantità, prezzo, unità)

## 🛠️ Come Utilizzare

### Importazione Clienti

1. Vai alla **Pagina Clienti**
2. Clicca su **"Importa CSV"**
3. Scarica il **template** per vedere il formato
4. Prepara il tuo file CSV seguendo il template
5. Carica il file e verifica l'anteprima
6. Clicca **"Importa"** per completare l'operazione

### Importazione Prodotti

1. Vai alla **Pagina Prodotti**
2. Clicca su **"Importa CSV"**
3. Scarica il **template** per vedere il formato
4. Prepara il tuo file CSV con tutti i prodotti
5. Carica il file e verifica l'anteprima
6. Clicca **"Importa"** per completare l'operazione

### Esportazione Ordini

1. Vai alla **Pagina Ordini**
2. Clicca su **"Esporta CSV"**
3. Seleziona il **periodo** (data inizio e fine)
4. Applica **filtri** se necessario (stato, cliente)
5. Clicca **"Esporta CSV"** per scaricare il file

## ⚡ Caratteristiche Tecniche

### Performance
- **Importazione in batch**: 50 record per volta per evitare timeout
- **Validazione real-time**: Controlli immediati durante il caricamento
- **Anteprima dati**: Visualizzazione prima dell'importazione

### Sicurezza
- **Validazione input**: Controlli rigorosi su tutti i campi
- **Gestione errori**: Report dettagliati degli errori
- **Rollback automatico**: In caso di errori, nessun dato viene salvato

### User Experience
- **Template scaricabili**: Formati predefiniti per facilitare la preparazione
- **Anteprima dati**: Visualizzazione dei dati prima dell'importazione
- **Progress feedback**: Indicatori di progresso durante le operazioni
- **Report risultati**: Statistiche dettagliate su successi ed errori

## 📊 Esempi di Utilizzo

### Scenario 1: Importazione 500 Clienti
1. Prepara file CSV con 500 clienti
2. Usa il template per assicurarti del formato corretto
3. Carica il file (operazione automatica in batch)
4. Verifica i risultati: "500 clienti importati con successo"

### Scenario 2: Importazione 2000 Prodotti
1. Prepara file CSV con tutti i prodotti
2. Includi categorie, prezzi, pesi, ecc.
3. Carica il file (operazione in batch automatica)
4. Verifica i risultati e eventuali errori

### Scenario 3: Esportazione Ordini Mensile
1. Seleziona periodo: 1° del mese - 31° del mese
2. Filtra per stato "Consegnato"
3. Esporta per analisi vendite mensili

## 🔧 Risoluzione Problemi

### Errori Comuni

**"Header mancanti"**
- Verifica che il file CSV abbia la prima riga con gli header corretti
- Usa il template per confrontare

**"Email non valida"**
- Controlla il formato delle email nel CSV
- Assicurati che non ci siano spazi extra

**"Prezzo non valido"**
- Usa il punto (.) come separatore decimale
- Non includere simboli di valuta

**"Customer ID non valido"**
- Verifica che l'ID cliente esista nel database
- Lascia vuoto se il prodotto è per tutti i clienti

### Limitazioni

- **Dimensione file**: Massimo 10MB per file CSV
- **Record per batch**: 50 record per volta (automatico)
- **Timeout**: 30 secondi per operazione di importazione

## 📈 Benefici

1. **Efficienza**: Importa migliaia di record in pochi minuti
2. **Precisione**: Validazioni automatiche riducono errori
3. **Flessibilità**: Filtri avanzati per esportazioni mirate
4. **Tracciabilità**: Report dettagliati su tutte le operazioni
5. **Scalabilità**: Gestisce grandi volumi di dati senza problemi

## 🎯 Prossimi Sviluppi

- [ ] Importazione ordini da CSV
- [ ] Esportazione clienti e prodotti
- [ ] Sincronizzazione automatica
- [ ] Template personalizzabili
- [ ] Importazione da Excel (.xlsx)

