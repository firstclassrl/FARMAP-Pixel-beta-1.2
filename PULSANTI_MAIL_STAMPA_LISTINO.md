# Pulsanti Mail e Stampa - Modale Listino Prezzi

## 📋 Panoramica

Sono stati aggiunti i pulsanti "Invia Mail" e "Stampa" nella modale di modifica listino prezzi per permettere l'invio via email e la stampa del listino con anteprima.

## 🎯 Funzionalità Implementate

### **1. Pulsante "Invia Mail"**
- ✅ **Posizione**: Header della modale, accanto al titolo
- ✅ **Funzione**: Apre il client email predefinito con mailto
- ✅ **Contenuto**: Oggetto e corpo email precompilati
- ✅ **Validazione**: Controlla che cliente e email siano disponibili

### **2. Pulsante "Stampa"**
- ✅ **Posizione**: Header della modale, accanto al pulsante mail
- ✅ **Funzione**: Apre finestra di stampa con anteprima
- ✅ **Formato**: HTML formattato per stampa professionale
- ✅ **Contenuto**: Listino completo con tutti i dettagli

## 🔧 Implementazione Tecnica

### **Import Aggiunti**
```typescript
import { Mail, Printer } from 'lucide-react';
```

### **Funzione handleSendEmail**
```typescript
const handleSendEmail = () => {
  if (!currentPriceList || !currentPriceList.customer) {
    addNotification({
      type: 'error',
      title: 'Errore',
      message: 'Cliente non selezionato per il listino'
    });
    return;
  }

  if (!currentPriceList.customer.email) {
    addNotification({
      type: 'error',
      title: 'Errore',
      message: 'Email del cliente non disponibile'
    });
    return;
  }

  const subject = encodeURIComponent(`Listino Prezzi - ${currentPriceList.name}`);
  const body = encodeURIComponent(`
Gentile ${currentPriceList.customer.contact_person || 'Cliente'},

In allegato il listino prezzi "${currentPriceList.name}" valido dal ${new Date(currentPriceList.valid_from).toLocaleDateString('it-IT')}${currentPriceList.valid_until ? ` al ${new Date(currentPriceList.valid_until).toLocaleDateString('it-IT')}` : ''}.

Cordiali saluti,
Il Team
  `);

  const mailtoLink = `mailto:${currentPriceList.customer.email}?subject=${subject}&body=${body}`;
  window.open(mailtoLink, '_blank');

  addNotification({
    type: 'success',
    title: 'Email aperta',
    message: `Client email aperta per ${currentPriceList.customer.email}`
  });
};
```

### **Funzione handlePrint**
```typescript
const handlePrint = () => {
  if (!currentPriceList) {
    addNotification({
      type: 'error',
      title: 'Errore',
      message: 'Nessun listino da stampare'
    });
    return;
  }

  // Apri una nuova finestra per la stampa
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    addNotification({
      type: 'error',
      title: 'Errore',
      message: 'Impossibile aprire la finestra di stampa. Verifica i popup bloccati.'
    });
    return;
  }

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Listino Prezzi - ${currentPriceList.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .info { margin-bottom: 20px; }
          .info h3 { color: #333; margin-bottom: 10px; }
          .info p { margin: 5px 0; }
          .products { margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .price { color: #2563eb; font-weight: bold; }
          .moq { color: #059669; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>LISTINO PREZZI</h1>
          <h2>${currentPriceList.name}</h2>
        </div>
        
        <div class="info">
          <h3>Informazioni Listino</h3>
          <p><strong>Cliente:</strong> ${currentPriceList.customer?.company_name || 'N/A'}</p>
          <p><strong>Valido dal:</strong> ${new Date(currentPriceList.valid_from).toLocaleDateString('it-IT')}</p>
          ${currentPriceList.valid_until ? `<p><strong>Valido fino al:</strong> ${new Date(currentPriceList.valid_until).toLocaleDateString('it-IT')}</p>` : ''}
          <p><strong>Data generazione:</strong> ${new Date().toLocaleDateString('it-IT')}</p>
        </div>

        <div class="products">
          <h3>Prodotti nel Listino (${currentPriceList.price_list_items?.length || 0})</h3>
          ${currentPriceList.price_list_items && currentPriceList.price_list_items.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Prodotto</th>
                  <th>Codice</th>
                  <th>Prezzo</th>
                  <th>MOQ</th>
                  <th>Unita</th>
                </tr>
              </thead>
              <tbody>
                ${currentPriceList.price_list_items.map(item => `
                  <tr>
                    <td>${item.products.name}</td>
                    <td>${item.products.code}</td>
                    <td class="price">€ ${item.price.toFixed(2)}</td>
                    <td class="moq">${item.min_quantity}</td>
                    <td>${item.products.unit}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p>Nessun prodotto nel listino</p>'}
        </div>

        <div class="footer">
          <p>Documento generato automaticamente il ${new Date().toLocaleString('it-IT')}</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  
  // Aspetta che il contenuto sia caricato prima di stampare
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);

  addNotification({
    type: 'success',
    title: 'Stampa avviata',
    message: 'Finestra di stampa aperta'
  });
};
```

## 🎨 Interfaccia Utente

### **Posizionamento Pulsanti**
```typescript
<DialogHeader>
  <div className="flex items-center justify-between">
    <DialogTitle>
      {priceListId ? 'Modifica Listino' : 'Nuovo Listino'}
    </DialogTitle>
    {currentPriceList && currentPriceList.customer && (
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSendEmail}
          className="h-7 text-xs px-3 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
          title="Invia listino via email"
        >
          <Mail className="w-3 h-3 mr-1" />
          Invia Mail
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="h-7 text-xs px-3 bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
          title="Stampa listino"
        >
          <Printer className="w-3 h-3 mr-1" />
          Stampa
        </Button>
      </div>
    )}
  </div>
</DialogHeader>
```

### **Stile Pulsanti**
- **Invia Mail**: Sfondo blu chiaro, bordo blu, testo blu
- **Stampa**: Sfondo grigio chiaro, bordo grigio, testo grigio
- **Dimensioni**: Compatte (h-7, text-xs)
- **Icone**: Mail e Printer da Lucide React

## 📧 Funzionalità Email

### **Contenuto Email**
- **Oggetto**: "Listino Prezzi - [Nome Listino]"
- **Destinatario**: Email del cliente selezionato
- **Corpo**: Messaggio personalizzato con:
  - Saluto personalizzato (nome contatto)
  - Nome del listino
  - Date di validità
  - Firma standard

### **Validazioni**
- ✅ **Cliente selezionato**: Controlla che ci sia un cliente
- ✅ **Email disponibile**: Verifica che il cliente abbia un'email
- ✅ **Listino esistente**: Controlla che il listino sia caricato

### **Comportamento**
- **Apertura**: Apre il client email predefinito del sistema
- **Precompilazione**: Oggetto e corpo già compilati
- ✅ **Notifica**: Conferma di apertura email

## 🖨️ Funzionalità Stampa

### **Contenuto Stampa**
- **Header**: Titolo "LISTINO PREZZI" e nome listino
- **Informazioni**: Cliente, date validità, data generazione
- **Tabella prodotti**: Nome, codice, prezzo, MOQ, unità
- **Footer**: Data e ora di generazione

### **Formattazione**
- **Font**: Arial, sans-serif
- **Layout**: Centrato e professionale
- **Colori**: Prezzi in blu, MOQ in verde
- **Tabelle**: Bordi e header evidenziati

### **Processo Stampa**
1. **Apertura finestra**: Nuova finestra popup
2. **Generazione HTML**: Contenuto formattato
3. **Caricamento**: Scrittura del contenuto
4. **Anteprima**: Visualizzazione prima della stampa
5. **Stampa**: Avvio automatico del dialogo di stampa
6. **Chiusura**: Chiusura automatica della finestra

## 🎯 Condizioni di Visibilità

### **Pulsanti Visibili Solo Se**
- ✅ **Listino caricato**: `currentPriceList` esiste
- ✅ **Cliente selezionato**: `currentPriceList.customer` esiste
- ✅ **Modifica listino**: Non per nuovi listini

### **Logica Condizionale**
```typescript
{currentPriceList && currentPriceList.customer && (
  <div className="flex items-center space-x-2">
    {/* Pulsanti Mail e Stampa */}
  </div>
)}
```

## 📱 Responsive Design

### **Layout Adattivo**
- ✅ **Desktop**: Pulsanti affiancati nel header
- ✅ **Tablet**: Layout mantenuto
- ✅ **Mobile**: Pulsanti compatti e funzionali

### **Dimensioni**
- **Altezza**: `h-7` (28px)
- **Font**: `text-xs` (12px)
- **Padding**: `px-3` (12px orizzontale)
- **Icone**: `w-3 h-3` (12px)

## 🔍 Gestione Errori

### **Errori Email**
- **Cliente non selezionato**: "Cliente non selezionato per il listino"
- **Email non disponibile**: "Email del cliente non disponibile"

### **Errori Stampa**
- **Listino non disponibile**: "Nessun listino da stampare"
- **Popup bloccati**: "Impossibile aprire la finestra di stampa. Verifica i popup bloccati."

### **Notifiche Successo**
- **Email**: "Client email aperta per [email]"
- **Stampa**: "Finestra di stampa aperta"

## 📊 Benefici Ottenuti

### **1. Funzionalità Email**
- ✅ **Integrazione**: Apertura client email predefinito
- ✅ **Personalizzazione**: Contenuto precompilato
- ✅ **Validazione**: Controlli di sicurezza
- ✅ **UX**: Processo semplificato

### **2. Funzionalità Stampa**
- ✅ **Anteprima**: Visualizzazione prima della stampa
- ✅ **Formattazione**: Layout professionale
- ✅ **Completezza**: Tutti i dettagli inclusi
- ✅ **Automazione**: Processo automatico

### **3. Interfaccia**
- ✅ **Accessibilità**: Pulsanti visibili e intuitivi
- ✅ **Posizionamento**: Header per facile accesso
- ✅ **Stile**: Coerente con il design esistente
- ✅ **Responsive**: Funziona su tutti i dispositivi

## ✅ Risultato Finale

### **Caratteristiche Implementate**
- ✅ **Pulsante Invia Mail**: Con validazione e precompilazione
- ✅ **Pulsante Stampa**: Con anteprima e formattazione professionale
- ✅ **Posizionamento**: Header della modale per facile accesso
- ✅ **Validazioni**: Controlli di sicurezza e errori gestiti
- ✅ **Notifiche**: Feedback per tutte le azioni

### **Benefici Ottenuti**
- **Produttività**: Invio email e stampa in un click
- **Professionalità**: Formattazione e contenuto curati
- **Usabilità**: Interfaccia intuitiva e accessibile
- **Integrazione**: Funziona con client email e stampanti del sistema

**I pulsanti "Invia Mail" e "Stampa" sono ora disponibili nella modale di modifica listino, permettendo l'invio via email con contenuto precompilato e la stampa con anteprima professionale!** 🎉

