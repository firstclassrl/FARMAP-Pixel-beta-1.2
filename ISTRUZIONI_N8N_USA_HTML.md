# ⚠️ IMPORTANTE: Configura N8N per Usare l'HTML dell'Email

## 🎯 Problema

Se le email vengono inviate come testo semplice invece che HTML formattato, significa che n8n sta usando il campo `body` invece di `htmlBody`.

## ✅ Soluzione

Il payload inviato contiene **MULTIPLI campi HTML** per facilitare la configurazione:

### Campi HTML Disponibili nel Payload:

```json
{
  "email": "cliente@example.com",
  "subject": "Listino Prezzi FARMAP - Nome",
  "body": "Testo semplice...",              ← ⚠️ NON USARE (solo fallback)
  "htmlBody": "<!DOCTYPE html>...",         ← ✅ USA QUESTO
  "html": "<!DOCTYPE html>...",             ← ✅ OPPURE QUESTO (alias)
  "emailHtml": "<!DOCTYPE html>...",        ← ✅ OPPURE QUESTO (alias)
  "hasHtml": true,                          ← Flag che indica presenza HTML
  "emailFormat": "html",                    ← Indica formato HTML
  "pdfUrl": "...",
  ...
}
```

## 🔧 Configurazione N8N

### Metodo 1: Gmail Node

1. **Aggiungi nodo "Gmail"** dopo il webhook
2. **Configura così:**
   - **To**: `{{ $json.email }}`
   - **Subject**: `{{ $json.subject }}`
   - **Message Type**: **HTML** ⬅️ IMPORTANTE!
   - **Message**: `{{ $json.htmlBody }}` ⬅️ USA htmlBody, NON body!

### Metodo 2: Nodemailer

1. **Aggiungi nodo "Nodemailer"**
2. **Configura così:**
   - **To**: `{{ $json.email }}`
   - **Subject**: `{{ $json.subject }}`
   - **Text**: `{{ $json.body }}` (solo come fallback)
   - **HTML**: `{{ $json.htmlBody }}` ⬅️ **QUESTO è il campo importante!**

### Metodo 3: HTTP Request + Send Email

Se usi un servizio esterno:

```json
{
  "to": "{{ $json.email }}",
  "subject": "{{ $json.subject }}",
  "html": "{{ $json.htmlBody }}",  ← USA htmlBody
  "text": "{{ $json.body }}"       ← Fallback opzionale
}
```

## 📋 Checklist Configurazione

- [ ] Nodo email configurato per **HTML** (non testo)
- [ ] Campo **HTML** del nodo usa `{{ $json.htmlBody }}` 
- [ ] **NON** usare `{{ $json.body }}` per il contenuto principale
- [ ] `body` può essere usato solo come fallback per client email vecchi
- [ ] Test email inviata e verificata

## 🧪 Test Rapido

1. **Invia una email di test** dal sistema
2. **Controlla il payload ricevuto** nel webhook n8n
3. **Verifica** che `htmlBody` contenga HTML completo
4. **Configura** il nodo email per usare `htmlBody`
5. **Invia** un'altra email di test
6. **Verifica** che l'email ricevuta sia formattata con colori FARMAP

## 🎨 Cosa Vedrai nell'Email HTML

- ✅ Header rosso FARMAP con logo
- ✅ Gradiente rosso (#dc2626)
- ✅ Corpo email ben formattato
- ✅ Footer con informazioni azienda
- ✅ Design professionale

## ❌ Cosa NON Fare

- ❌ **NON** usare `{{ $json.body }}` come contenuto principale
- ❌ **NON** impostare il formato come "Text"
- ❌ **NON** ignorare il campo `htmlBody`

## ✅ Cosa Fare

- ✅ Usare `{{ $json.htmlBody }}` o `{{ $json.html }}` o `{{ $json.emailHtml }}`
- ✅ Impostare formato email come **HTML**
- ✅ Verificare che l'anteprima mostri l'HTML formattato

## 🔍 Debug

Se ancora non funziona:

1. **Aggiungi un nodo "Set"** dopo il webhook per loggare:
   ```
   htmlLength: {{ $json.htmlBody.length }}
   hasHtml: {{ $json.hasHtml }}
   ```

2. **Verifica** che `htmlBody` non sia vuoto o undefined

3. **Copia** il contenuto di `htmlBody` e aprilo in un browser per vedere se l'HTML è corretto

## 📞 Esempio Workflow Completo

```
Webhook (riceve payload)
  ↓
Set (log debug)
  - htmlLength: {{ $json.htmlBody.length }}
  ↓
HTTP Request (scarica PDF)
  - URL: {{ $json.pdfUrl }}
  - Response: File
  ↓
Nodemailer/Gmail
  - To: {{ $json.email }}
  - Subject: {{ $json.subject }}
  - HTML: {{ $json.htmlBody }}  ← QUESTO!
  - Text: {{ $json.body }}      ← Fallback
  - Attachment: PDF scaricato
```

## 🎯 Risultato Finale

Dopo la configurazione corretta:
- ✅ Email belle e formattate con colori FARMAP
- ✅ Logo e header rosso visibili
- ✅ Design professionale
- ✅ PDF allegato correttamente





