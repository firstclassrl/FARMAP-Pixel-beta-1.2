# Changelog

Tutte le modifiche significative a questo progetto saranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e questo progetto aderisce al [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.34] - 2025-10-30

### Aggiunto
- Script import massivo foto `scripts/upload-product-photos.mjs` e guida `README-bulk-photos.md`
- Comando npm `upload:photos`
- Filtro "Foto" (Tutte/Con foto/Senza foto) nella pagina Prodotti

### Modificato
- Modale prodotto: `strati` ora è davvero opzionale

## [1.1.0-beta] - 2025-01-17

### Aggiunto
- Pulsante "Anteprima" nella modale di modifica listino
- Integrazione con PriceListPrintView per l'anteprima dei listini
- State management per il modal di anteprima

### Modificato
- Aggiornata versione dell'applicazione a v1.1.0 Beta
- Migliorata UX con pulsante anteprima sempre visibile nel footer della modale

### Rimosso
- Pulsante "Stampa" dalla modale di modifica listino
- Funzione `handlePrint` e tutto il codice di stampa associato
- Import non utilizzati (Printer icon, formatCurrency)
- Variabili di stato non utilizzate (isItemSubmitting, products, showItemForm, editingItemId)
- Funzioni non utilizzate (handleItemFormSubmit, handleEditItem, handleAddProduct, handleCancelItemForm, handleFinishPriceList)
- Schemi Zod non utilizzati (priceListItemSchema)
- Tipi TypeScript non utilizzati (PriceListInsert, CustomerUpdate, PriceListItemFormData)

### Pulizia Codice
- Rimossi file temporanei creati per il debug del server
- Ottimizzato caricamento dati (rimosso caricamento prodotti non necessario)
- Puliti import e form hooks non utilizzati
- Ridotte ~100 righe di codice non utilizzato

### Note Tecniche
- Il pulsante anteprima è sempre visibile ma disabilitato quando non c'è un priceListId
- L'anteprima utilizza lo stesso componente PriceListPrintView dei tre puntini
- Mantenuto il pulsante "Invia Mail" nell'header della modale
- Codice più pulito e manutenibile

## [1.0.0] - 2025-01-16

### Aggiunto
- Versione iniziale del CRM Pixel per FARMAP
- Sistema di autenticazione completo
- Gestione clienti, prodotti e listini
- Sistema di ordini e richieste campioni
- Dashboard con KPI
- Sistema di notifiche
- PWA support
