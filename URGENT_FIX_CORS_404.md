# 🚨 URGENTE: Fix CORS 404 Error

## Problema

La richiesta OPTIONS (preflight) sta ricevendo un **404 Not Found** invece di una risposta 200 con gli header CORS. Questo significa che l'endpoint non viene trovato o il routing non funziona correttamente.

## Cause Possibili

1. **Railway non ha deployato le nuove modifiche** - Il codice potrebbe non essere aggiornato
2. **Ordine delle route** - L'handler OPTIONS potrebbe non essere raggiunto
3. **Configurazione Railway** - Potrebbe esserci un problema con il routing

## Soluzione Immediata

### 1. Verifica Deploy su Railway

Controlla se il codice è stato deployato:
- Vai su Railway Dashboard
- Controlla i log del deploy
- Verifica che l'ultimo deploy sia avvenuto dopo le modifiche

### 2. Test Endpoint OPTIONS Manualmente

Testa l'endpoint direttamente:

```bash
curl -X OPTIONS https://pdf-generator-farmap-production.up.railway.app/api/generate-price-list-pdf-upload \
  -H "Origin: https://pixel.farmap.it" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

Se ricevi ancora 404, il problema è nel deploy o nella configurazione Railway.

### 3. Verifica Configurazione Express

L'handler OPTIONS globale dovrebbe catturare tutte le richieste:

```javascript
app.options('*', (req, res) => {
  // Questo dovrebbe gestire TUTTE le richieste OPTIONS
});
```

### 4. Deploy Manuale Forzato

Se Railway non sta facendo deploy automatico:

1. **Forza un nuovo deploy:**
   - Vai su Railway Dashboard
   - Trova il servizio PDF Generator
   - Clicca "Redeploy" o "Deploy Latest"

2. **Verifica variabili ambiente:**
   - Assicurati che `SUPABASE_SERVICE_ROLE_KEY` sia configurata
   - Verifica che `N8N_PRICELIST_WEBHOOK_URL` sia configurata

### 5. Test Endpoint Health

Prima di tutto, verifica che il server risponda:

```bash
curl https://pdf-generator-farmap-production.up.railway.app/health
```

Dovrebbe restituire: `{"status":"ok","service":"pdf-generator"}`

Se questo fallisce, il server non è online.

## Soluzione Alternativa Temporanea

Se il problema persiste, possiamo usare un approccio diverso:

1. **Invia il PDF dal frontend** invece di caricarlo dal backend
2. **Usa il vecchio endpoint** per generare il PDF
3. **Carica il PDF dal frontend** direttamente su Supabase Storage

Questo bypassa completamente il problema CORS.

## Prossimi Passi

1. ✅ Verifica che il codice sia stato deployato su Railway
2. ✅ Testa l'endpoint OPTIONS manualmente
3. ✅ Controlla i log Railway per errori
4. ✅ Se necessario, forza un redeploy
5. ✅ Se il problema persiste, considera la soluzione alternativa

## Debug

Aggiungi questi log nel server per vedere cosa succede:

```javascript
app.use((req, res, next) => {
  console.log('📥 Request:', req.method, req.path);
  next();
});
```

Questo ti aiuterà a vedere se le richieste arrivano al server.



