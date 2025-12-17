# 🚨 URGENTE: Deploy Modifiche CORS su Railway

## Problema

L'endpoint `/api/generate-price-list-pdf` sta ricevendo errori CORS perché Railway non ha ancora deployato le modifiche con la configurazione CORS corretta.

## Modifiche Necessarie Deployate

Le seguenti modifiche sono state fatte al file `server/pdf-generator/server.js`:

1. ✅ Handler OPTIONS per `/api/generate-price-list-pdf`
2. ✅ Header CORS espliciti nelle risposte
3. ✅ Middleware CORS globale migliorato

## Azione Richiesta

### **Deploy su Railway:**

1. **Verifica che le modifiche siano committate:**
   ```bash
   git status
   git add server/pdf-generator/server.js
   git commit -m "Fix CORS per endpoint generate-price-list-pdf"
   git push
   ```

2. **Forza redeploy su Railway:**
   - Vai su Railway Dashboard
   - Seleziona il servizio PDF Generator
   - Clicca "Redeploy" o "Deploy Latest"

3. **Verifica che il deploy sia completato:**
   - Controlla i log Railway
   - Verifica che il server sia online: `curl https://pdf-generator-farmap-production.up.railway.app/health`

4. **Testa l'endpoint OPTIONS:**
   ```bash
   curl -X OPTIONS https://pdf-generator-farmap-production.up.railway.app/api/generate-price-list-pdf \
     -H "Origin: https://pixel.farmap.it" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```

   Dovresti vedere:
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: POST, OPTIONS
   ```

## Soluzione Alternativa (Già Implementata)

Se Railway continua a dare problemi, la soluzione alternativa già implementata nel frontend funziona:

- ✅ Genera PDF usando endpoint esistente
- ✅ Carica PDF dal frontend su Supabase
- ✅ Chiama webhook N8N dal frontend

Questa soluzione NON richiede deploy backend e funziona subito.

## Verifica Rapida

Dopo il deploy, testa dal browser:
1. Apri un listino
2. Clicca "Invia Email"
3. Verifica che non ci siano più errori CORS nella console




