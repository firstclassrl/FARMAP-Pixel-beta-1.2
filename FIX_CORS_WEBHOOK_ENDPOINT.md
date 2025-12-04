# 🔧 Fix CORS per Endpoint Webhook PDF Upload

## 🐛 Problema Identificato

L'errore CORS si verifica quando il frontend (`https://pixel.farmap.it`) tenta di chiamare il nuovo endpoint backend (`/api/generate-price-list-pdf-upload`) su Railway.

Errore:
```
Access to fetch at 'https://pdf-generator-farmap-production.up.railway.app/api/generate-price-list-pdf-upload' 
from origin 'https://pixel.farmap.it' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ Soluzione Applicata

Sono state apportate le seguenti modifiche al file `server/pdf-generator/server.js`:

### 1. **Configurazione CORS Migliorata**

```javascript
const corsOptions = {
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type'],
  optionsSuccessStatus: 200
};
```

### 2. **Handler Esplicito per Richieste OPTIONS**

Aggiunto handler globale per gestire tutte le richieste preflight (OPTIONS):

```javascript
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(200);
});
```

### 3. **Header CORS Espliciti nell'Endpoint**

Aggiunti header CORS espliciti nelle risposte dell'endpoint:

```javascript
res.header('Access-Control-Allow-Origin', '*');
res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
```

## 📋 Verifica Configurazione

### **Test Locale:**

1. **Avvia il server backend localmente:**
   ```bash
   cd server/pdf-generator
   npm install
   npm run dev
   ```

2. **Testa l'endpoint con curl:**
   ```bash
   curl -X OPTIONS http://localhost:3001/api/generate-price-list-pdf-upload \
     -H "Origin: https://pixel.farmap.it" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```

   Dovresti vedere gli header CORS nella risposta:
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE
   Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
   ```

### **Test Endpoint Completo:**

```bash
curl -X POST http://localhost:3001/api/generate-price-list-pdf-upload \
  -H "Content-Type: application/json" \
  -H "Origin: https://pixel.farmap.it" \
  -d '{
    "priceListData": {...},
    "uploadToBucket": true,
    "bucketName": "order-pdfs"
  }' \
  -v
```

## 🚀 Deploy su Railway

Dopo le modifiche:

1. **Commit e push le modifiche:**
   ```bash
   git add server/pdf-generator/server.js
   git commit -m "Fix CORS configuration for PDF upload endpoint"
   git push
   ```

2. **Railway dovrebbe fare il redeploy automaticamente**

3. **Verifica che il servizio sia online:**
   ```bash
   curl https://pdf-generator-farmap-production.up.railway.app/health
   ```

4. **Testa l'endpoint OPTIONS:**
   ```bash
   curl -X OPTIONS https://pdf-generator-farmap-production.up.railway.app/api/generate-price-list-pdf-upload \
     -H "Origin: https://pixel.farmap.it" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```

## 🔍 Troubleshooting

### **Se CORS continua a dare problemi:**

1. **Verifica che Railway non stia bloccando OPTIONS:**
   - Controlla i log Railway per vedere se le richieste OPTIONS arrivano
   - Verifica che non ci siano regole firewall o proxy che bloccano OPTIONS

2. **Verifica configurazione Railway:**
   - Assicurati che il servizio sia esposto pubblicamente
   - Controlla che non ci siano limitazioni sul dominio

3. **Test diretto con fetch nel browser console:**
   ```javascript
   fetch('https://pdf-generator-farmap-production.up.railway.app/api/generate-price-list-pdf-upload', {
     method: 'OPTIONS',
     headers: {
       'Origin': 'https://pixel.farmap.it',
       'Access-Control-Request-Method': 'POST'
     }
   }).then(r => console.log(r.headers))
   ```

4. **Verifica header nella risposta:**
   - Apri Network tab nel DevTools
   - Cerca la richiesta OPTIONS (preflight)
   - Verifica che la risposta abbia status 200 e gli header CORS corretti

## 📝 Note Importanti

- Il middleware CORS deve essere configurato **prima** di altri middleware
- Le richieste OPTIONS (preflight) devono essere gestite **prima** delle richieste POST
- Gli header CORS devono essere presenti sia nella risposta OPTIONS che nella risposta POST
- Railway potrebbe richiedere alcuni minuti per propagare le modifiche

## ✅ Verifica Finale

Dopo il deploy:

1. Apri `https://pixel.farmap.it`
2. Vai alla pagina listini
3. Clicca "Invia Email" su un listino
4. Verifica che la modale si apra correttamente
5. Compila e invia l'email
6. Controlla la console del browser - non dovrebbero esserci più errori CORS

Se persistono problemi, controlla i log Railway per vedere eventuali errori lato server.

