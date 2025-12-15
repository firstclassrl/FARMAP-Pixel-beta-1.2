# ✅ Checklist Deploy CORS su Railway

## 🚨 Problema Attuale

L'endpoint `/api/generate-price-list-pdf` sta ricevendo errori CORS perché Railway non ha ancora deployato le modifiche.

## ✅ Modifiche Fatte (da Deployare)

### File: `server/pdf-generator/server.js`

1. **Middleware CORS globale** (righe 38-50)
   - ✅ Configurato per tutte le origini
   - ✅ Gestisce OPTIONS, GET, POST

2. **Handler OPTIONS globale** (righe 42-50)
   - ✅ Cattura tutte le richieste OPTIONS
   - ✅ Restituisce header CORS corretti

3. **Handler OPTIONS specifico per `/api/generate-price-list-pdf`** (righe 547-553)
   - ✅ Gestisce preflight per questo endpoint

4. **Header CORS espliciti nell'endpoint POST** (righe 806-808)
   - ✅ Aggiunti header CORS nelle risposte PDF
   - ✅ Aggiunti anche nelle risposte di errore

## 📋 Azioni Richieste

### 1. Verifica Modifiche Locali

```bash
cd server/pdf-generator
git status
```

Dovresti vedere `server.js` modificato.

### 2. Commit e Push

```bash
git add server/pdf-generator/server.js
git commit -m "Fix CORS per tutti gli endpoint PDF"
git push
```

### 3. Deploy su Railway

**Opzione A: Deploy Automatico (se configurato)**
- Railway dovrebbe fare deploy automatico dopo il push
- Verifica i log Railway per conferma

**Opzione B: Deploy Manuale**
1. Vai su Railway Dashboard
2. Seleziona servizio "PDF Generator"
3. Clicca "Redeploy" o "Deploy Latest"
4. Attendi completamento deploy

### 4. Verifica Deploy

**Test Health Check:**
```bash
curl https://pdf-generator-farmap-production.up.railway.app/health
```

Dovrebbe restituire: `{"status":"ok","service":"pdf-generator"}`

**Test OPTIONS:**
```bash
curl -X OPTIONS https://pdf-generator-farmap-production.up.railway.app/api/generate-price-list-pdf \
  -H "Origin: https://pixel.farmap.it" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

Dovresti vedere:
- Status: `200 OK`
- Header: `Access-Control-Allow-Origin: *`
- Header: `Access-Control-Allow-Methods: POST, OPTIONS`

### 5. Test dal Browser

1. Apri `https://pixel.farmap.it`
2. Vai su un listino
3. Clicca "Invia Email"
4. Verifica che NON ci siano più errori CORS nella console

## 🔍 Troubleshooting

### Se CORS continua a dare problemi:

1. **Verifica che Railway abbia fatto deploy:**
   - Controlla i log Railway
   - Verifica timestamp ultimo deploy

2. **Verifica che il server sia online:**
   ```bash
   curl https://pdf-generator-farmap-production.up.railway.app/health
   ```

3. **Controlla i log Railway per errori:**
   - Vai su Railway Dashboard → Logs
   - Cerca errori di startup o runtime

4. **Test diretto endpoint:**
   ```bash
   curl -X POST https://pdf-generator-farmap-production.up.railway.app/api/generate-price-list-pdf \
     -H "Content-Type: application/json" \
     -H "Origin: https://pixel.farmap.it" \
     -d '{"priceListData": {"id": "test"}}' \
     -v
   ```

## ⚠️ Nota Importante

Se Railway continua a dare problemi CORS anche dopo il deploy, la **soluzione alternativa già implementata** (upload PDF dal frontend) funziona comunque e bypassa completamente il problema CORS.



