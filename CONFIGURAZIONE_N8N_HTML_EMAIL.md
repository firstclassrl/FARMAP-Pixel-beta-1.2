# 📧 Configurazione N8N per Email HTML Formattate

## ⚠️ IMPORTANTE: Usare l'HTML invece del testo semplice

Il webhook riceve **DUE** versioni dell'email:
- `body`: Testo semplice (solo per fallback)
- `htmlBody`: **HTML formattato con colori FARMAP** ⬅️ **USA QUESTO!**

## 🔧 Configurazione Nodemailer/Gmail in N8N

### Opzione 1: Nodemailer (Raccomandato)

1. **Aggiungi il nodo "Nodemailer" dopo il webhook**

2. **Configurazione Base:**
   - **Host**: Il tuo SMTP (es. smtp.gmail.com)
   - **Port**: 587 (o 465 per SSL)
   - **User**: La tua email
   - **Password**: Password app o token
   - **From Email**: La tua email FARMAP
   - **From Name**: FARMAP Industry

3. **Configurazione Email:**
   - **To**: `{{ $json.email }}`
   - **Subject**: `{{ $json.subject }}`
   - **Text**: `{{ $json.body }}` (fallback per client email vecchi)
   - **HTML**: `{{ $json.htmlBody }}` ⬅️ **IMPORTANTE: Usa htmlBody!**

4. **Attachments (PDF):**
   - Crea un nodo **"HTTP Request"** prima di Nodemailer per scaricare il PDF:
     - **Method**: GET
     - **URL**: `{{ $json.pdfUrl }}`
     - **Response Format**: File
   - In Nodemailer, aggiungi l'attachment:
     - **Name**: `{{ $json.fileName }}`
     - **File**: Output del nodo HTTP Request

### Opzione 2: Gmail Node

1. **Aggiungi il nodo "Gmail" dopo il webhook**

2. **Configurazione:**
   - **To**: `{{ $json.email }}`
   - **Subject**: `{{ $json.subject }}`
   - **Message Type**: HTML
   - **Message**: `{{ $json.htmlBody }}` ⬅️ **Usa htmlBody!**

3. **Attachments:**
   - Stesso processo: HTTP Request per scaricare PDF, poi allega

## 📋 Esempio Workflow Completo

```
Webhook (riceve payload)
  ↓
HTTP Request (scarica PDF da pdfUrl)
  ↓
Nodemailer/Gmail
  - To: {{ $json.email }}
  - Subject: {{ $json.subject }}
  - HTML: {{ $json.htmlBody }}  ← IMPORTANTE!
  - Text: {{ $json.body }}      ← Fallback
  - Attachment: PDF scaricato
```

## 🎨 Struttura Payload Ricevuto

```json
{
  "email": "cliente@example.com",
  "subject": "Listino Prezzi FARMAP - Nome Listino",
  "body": "Testo semplice...",           ← NON USARE (solo fallback)
  "htmlBody": "<!DOCTYPE html>...",      ← USA QUESTO! ✅
  "pdfUrl": "https://...supabase.co/...",
  "priceListId": "...",
  "priceListName": "...",
  "customerName": "...",
  "customerEmail": "...",
  "fileName": "listino_xxx_timestamp.pdf"
}
```

## ✅ Checklist Configurazione

- [ ] Nodo email configurato per usare HTML
- [ ] Campo `htmlBody` usato invece di `body`
- [ ] PDF scaricato via HTTP Request
- [ ] PDF allegato all'email
- [ ] Test inviato con successo

## 🔍 Debug

Se le email arrivano senza formattazione:

1. **Verifica che stai usando `htmlBody`**: Controlla nel nodo email che il campo HTML sia `{{ $json.htmlBody }}` e NON `{{ $json.body }}`

2. **Verifica il payload**: Aggiungi un nodo "Set" dopo il webhook per vedere cosa ricevi:
   ```
   htmlBody length: {{ $json.htmlBody.length }}
   ```

3. **Testa l'HTML**: Copia `htmlBody` dal payload e aprilo in un browser per vedere se l'HTML è corretto

## 🎯 Risultato Atteso

Dopo la configurazione corretta, le email inviate avranno:
- ✅ Header rosso FARMAP con logo
- ✅ Corpo email formattato professionalmente
- ✅ Footer con informazioni azienda
- ✅ PDF allegato

## 📞 Supporto

Se hai problemi, verifica:
1. Il payload contiene `htmlBody` con HTML completo
2. Il nodo email è configurato per HTML (non testo)
3. Il campo HTML nel nodo usa `{{ $json.htmlBody }}`

