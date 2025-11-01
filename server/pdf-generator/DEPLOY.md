# Deploy PDF Generator Service

## Opzione 1: Render (Consigliato)

### Setup su Render

1. Vai su [render.com](https://render.com) e crea un account
2. Clicca su "New +" → "Web Service"
3. Connetti il repository GitHub
4. Configurazione:
   - **Name**: `pdf-generator` (o qualsiasi nome)
   - **Environment**: `Node`
   - **Build Command**: `cd server/pdf-generator && npm install`
   - **Start Command**: `cd server/pdf-generator && npm start`
   - **Root Directory**: `server/pdf-generator`
   - **Plan**: Free tier va bene per iniziare

5. Variabili d'ambiente:
   - `NODE_ENV=production`
   - `PORT` (Render lo imposta automaticamente)

6. Clicca "Create Web Service"

7. Una volta deployato, copia l'URL del servizio (es. `https://pdf-generator-xyz.onrender.com`)

8. Configura nel frontend (Netlify):
   - Aggiungi variabile d'ambiente: `VITE_PDF_GENERATOR_URL=https://pdf-generator-xyz.onrender.com`

---

## Opzione 2: Railway

### Setup su Railway

1. Vai su [railway.app](https://railway.app) e crea un account
2. "New Project" → "Deploy from GitHub repo"
3. Seleziona il repository
4. Railway rileverà automaticamente il servizio Node.js
5. Configurazione:
   - **Root Directory**: `/server/pdf-generator`
   - **Start Command**: `npm start`
   
6. Variabili d'ambiente:
   - `PORT` (Railway lo imposta automaticamente)
   - `NODE_ENV=production`

7. Una volta deployato, copia l'URL pubblico

8. Configura nel frontend:
   - Aggiungi variabile d'ambiente: `VITE_PDF_GENERATOR_URL=<url-railway>`

---

## Opzione 3: Heroku

### Setup su Heroku

```bash
# Installa Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

cd server/pdf-generator

# Login
heroku login

# Crea app
heroku create pdf-generator-farmap

# Deploy
git subtree push --prefix server/pdf-generator heroku main

# Oppure usa Procfile e fai git push heroku main dalla root
```

---

## Configurazione Frontend (Netlify)

1. Vai su Netlify Dashboard → Il tuo sito → Site settings → Environment variables
2. Aggiungi:
   - Key: `VITE_PDF_GENERATOR_URL`
   - Value: `https://<url-del-servizio-deployato>`
3. Fai rebuild del sito

---

## Test Locale

```bash
# Terminal 1: Avvia servizio PDF
cd server/pdf-generator
npm start

# Terminal 2: Avvia frontend
npm run dev
```

Il frontend userà automaticamente `http://localhost:3001` se `VITE_PDF_GENERATOR_URL` non è impostata.

---

## Troubleshooting

### Servizio non risponde
- Verifica che il servizio sia online
- Controlla i logs su Render/Railway
- Verifica che la porta sia configurata correttamente

### CORS errors
- Il servizio ha già CORS configurato per accettare tutte le origini
- Se hai problemi, modifica `server.js` per specificare l'origine

### PDF troppo grandi
- Puppeteer genera PDF ottimizzati automaticamente
- Le immagini vengono caricate direttamente, non convertite in base64
- Il file dovrebbe essere molto più leggero di prima

---

## Note Importanti

1. **Timeout**: Render free tier ha timeout di 30 secondi. Per PDF complessi potrebbe servire un piano superiore
2. **Sleep**: Render free tier mette a sleep i servizi dopo 15 minuti di inattività. Il primo request può essere lento
3. **Alternative**: Per produzione critica, considera un VPS (DigitalOcean, AWS EC2, etc.)

