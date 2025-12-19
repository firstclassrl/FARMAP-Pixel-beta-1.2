# 📧 Template Email FARMAP - HTML Formattato

## Panoramica

Il sistema ora genera automaticamente un template HTML professionale per le email dei listini prezzi con i colori FARMAP.

## Colori FARMAP Utilizzati

- **Rosso Primario**: `#dc2626` (red-600)
- **Rosso Scuro**: `#b91c1c` (red-700)
- **Sfondo**: `#f3f4f6` (gray-100)
- **Testo**: `#374151` (gray-700)

## Struttura del Payload N8N

Quando il frontend chiama il webhook N8N, invia un payload JSON con:

```json
{
  "email": "cliente@example.com",
  "subject": "Listino Prezzi FARMAP - Nome Listino",
  "body": "Testo semplice dell'email...",
  "htmlBody": "<!DOCTYPE html>... HTML completo formattato ...",
  "pdfUrl": "https://...supabase.co/storage/v1/object/public/order-pdfs/...",
  "priceListId": "...",
  "priceListName": "...",
  "customerName": "...",
  "customerEmail": "...",
  "fileName": "..."
}
```

## Configurazione N8N

Per utilizzare l'HTML formattato in n8n, configura l'email node così:

### Opzione 1: Email HTML

1. **Node**: "Send Email" o "Gmail"
2. **Email Format**: HTML
3. **Body**: Usa `{{ $json.htmlBody }}` per il contenuto HTML
4. **Attachments**: Aggiungi `{{ $json.pdfUrl }}` come allegato (se supportato) o scarica il PDF dall'URL e allega

### Opzione 2: Email Multi-part (Raccomandato)

1. **Email Format**: HTML
2. **Body HTML**: `{{ $json.htmlBody }}`
3. **Body Text**: `{{ $json.body }}` (per client email che non supportano HTML)
4. **Attachments**: PDF dall'URL

### Esempio Workflow N8N

```
Webhook → HTTP Request (scarica PDF) → Send Email
```

Nel node "Send Email":
- **To**: `{{ $json.email }}`
- **Subject**: `{{ $json.subject }}`
- **HTML Body**: `{{ $json.htmlBody }}`
- **Text Body**: `{{ $json.body }}`
- **Attachments**: File scaricato da `{{ $json.pdfUrl }}`

## Caratteristiche del Template

- ✅ Header con logo FARMAP e gradiente rosso
- ✅ Corpo email formattato con spaziatura corretta
- ✅ Footer con informazioni azienda
- ✅ Design responsive e compatibile con client email
- ✅ Colori brand FARMAP (#dc2626)
- ✅ Font Inter (fallback a system fonts)

## Note Importanti

1. **Logo URL**: Il template usa un URL assoluto per il logo. Assicurati che il logo sia accessibile pubblicamente a `https://pixel.farmap.it/logo%20farmap%20industry.png`

2. **Compatibilità**: Il template HTML è ottimizzato per la maggior parte dei client email (Gmail, Outlook, Apple Mail, ecc.)

3. **Fallback**: Il payload include sia `body` (testo semplice) che `htmlBody` (HTML). Usa entrambi per massima compatibilità.

4. **PDF Attachment**: n8n dovrà scaricare il PDF dall'URL pubblico Supabase prima di allegarlo all'email.

## Personalizzazione

Se vuoi modificare il template HTML, edita la funzione `generateEmailHTML` in `src/pages/PriceListPrintView.tsx`.





