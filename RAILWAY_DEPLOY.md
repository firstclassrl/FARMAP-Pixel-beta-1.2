# 🚂 Deploy su Railway (PIÙ SEMPLICE)

Railway è molto più semplice di Render per questo caso!

## Step 1: Crea account Railway

1. Vai su https://railway.app
2. Sign up con GitHub (gratuito)

## Step 2: Crea nuovo progetto

1. Clicca **"New Project"**
2. Seleziona **"Deploy from GitHub repo"**
3. Autorizza Railway ad accedere a GitHub
4. Seleziona repository: `firstclassrl/FARMAP-Pixel-beta-1.2`

## Step 3: Configura servizio

Railway rileva automaticamente Node.js. Configura:

1. **Clicca sul servizio** appena creato
2. Vai su **Settings**
3. **Root Directory**: `server/pdf-generator`
4. **Start Command**: `npm start`
5. **Build Command**: (lascia vuoto, Railway esegue automaticamente `npm install`)

## Step 4: Ottieni URL

1. Vai su **Settings** → **Networking**
2. Clicca **"Generate Domain"** o usa quello automatico
3. Copia l'URL (es. `https://pdf-generator-production.up.railway.app`)

## Step 5: Configura Netlify

1. Vai su Netlify Dashboard
2. Environment Variables
3. Aggiungi: `VITE_PDF_GENERATOR_URL` = `<url-railway>`
4. Trigger redeploy

## ✅ FATTO!

Railway gestisce tutto automaticamente, niente problemi di path!

