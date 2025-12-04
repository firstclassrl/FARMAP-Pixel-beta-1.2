# 🔗 Configurazione Webhook N8N per Invio Email Listini

## 🎯 Obiettivo

Configurare il webhook N8N per l'invio automatico delle email con allegato PDF dei listini.

## 🔧 Configurazione Variabili Ambiente

### **Backend PDF Generator (Railway o servizio deployato)**

Il backend PDF generator deve avere configurata la seguente variabile d'ambiente:

```
N8N_PRICELIST_WEBHOOK_URL=https://thermostatically-proliferous-doyle.ngrok-free.dev/webhook/pixel
```

#### **Come Configurare su Railway:**

1. **Accedere a Railway Dashboard**
2. **Selezionare il servizio PDF Generator**
3. **Andare su "Variables"**
4. **Aggiungere variabile d'ambiente:**
   - **Nome**: `N8N_PRICELIST_WEBHOOK_URL`
   - **Valore**: `https://thermostatically-proliferous-doyle.ngrok-free.dev/webhook/pixel`
5. **Salvare e ridepoyare il servizio** (se necessario)

#### **Come Configurare su Altri Servizi:**

- **Heroku**: Settings → Config Vars → Add
- **Render**: Environment → Add Environment Variable
- **Vercel/Netlify Functions**: Environment Variables nella dashboard

### **Variabili Supabase per Backend**

Il backend necessita anche delle credenziali Supabase per caricare i PDF nel bucket:

```
SUPABASE_URL=https://pfpvsahrmwbhkgvjidnr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

⚠️ **IMPORTANTE**: Usare la **Service Role Key** (non l'anon key) per permettere upload senza autenticazione RLS.

#### **Come Ottenere la Service Role Key:**

1. **Accedere a Supabase Dashboard**
2. **Andare su Settings → API**
3. **Copiare la "service_role" key** (non la "anon public" key)
4. **Aggiungere come variabile d'ambiente nel backend**

## 📋 Payload Webhook

Il backend invia al webhook N8N il seguente payload JSON:

```json
{
  "email": "cliente@example.com",
  "subject": "Listino Prezzi FARMAP - Nome Listino",
  "body": "Corpo dell'email...",
  "pdfUrl": "https://...supabase.co/storage/v1/object/public/order-pdfs/listino_[id]_[timestamp].pdf",
  "priceListId": "uuid-del-listino",
  "priceListName": "Nome Listino",
  "customerName": "Nome Cliente",
  "customerEmail": "cliente@example.com",
  "fileName": "listino_[id]_[timestamp].pdf"
}
```

## 🔄 Flusso Completo

1. **Utente clicca "Invia Email"** nella modale listino
2. **Frontend apre modale** con email/soggetto/corpo precompilati
3. **Utente modifica e conferma**
4. **Frontend chiama backend** `/api/generate-price-list-pdf-upload` con:
   - Dati listino per generare PDF
   - Email, soggetto, corpo
5. **Backend genera PDF** usando Puppeteer
6. **Backend carica PDF** nel bucket Supabase `order-pdfs`
7. **Backend ottiene URL pubblico** del PDF
8. **Backend chiama webhook N8N** con tutti i dati
9. **N8N invia email** automaticamente con PDF allegato
10. **Utente riceve conferma** di invio riuscito

## ✅ Verifica Configurazione

### **Test Endpoint Backend:**

```bash
curl -X POST https://your-backend-url/api/generate-price-list-pdf-upload \
  -H "Content-Type: application/json" \
  -d '{
    "priceListData": {...},
    "uploadToBucket": true,
    "bucketName": "order-pdfs",
    "email": "test@example.com",
    "subject": "Test",
    "body": "Test body"
  }'
```

### **Verifica Webhook N8N:**

1. **Controllare log N8N** per vedere se riceve le chiamate
2. **Verificare payload** ricevuto dal webhook
3. **Testare invio email** di prova

## 🚨 Note Importanti

- **Webhook URL**: Deve essere accessibile pubblicamente (ngrok o dominio pubblico)
- **Service Role Key**: Non condividere pubblicamente, usare solo nel backend
- **Bucket Supabase**: Deve essere pubblico per permettere accesso ai PDF
- **Timeout**: Il webhook N8N deve rispondere entro il timeout del backend (default: 30s)

## 📝 Troubleshooting

### **Errore: "Supabase client not configured"**

- Verificare che `SUPABASE_SERVICE_ROLE_KEY` sia configurata
- Verificare che `SUPABASE_URL` sia corretto

### **Errore: "Failed to upload PDF to bucket"**

- Verificare che il bucket `order-pdfs` esista
- Verificare le policy RLS del bucket
- Verificare che il bucket sia pubblico

### **Errore: "N8N webhook error"**

- Verificare che `N8N_PRICELIST_WEBHOOK_URL` sia configurata
- Verificare che l'URL del webhook sia accessibile
- Controllare i log N8N per dettagli

## 🎯 Risultato

Una volta configurato correttamente:
- ✅ **PDF generati** e caricati automaticamente
- ✅ **Email inviate** automaticamente via N8N
- ✅ **PDF allegati** automaticamente alle email
- ✅ **Flusso completamente automatizzato**

La configurazione è completa! 🚀

