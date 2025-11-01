# ⚡ Deploy VELOCE su Railway

## 3 MINUTI - SOLO 4 STEP

### 1️⃣ Vai su Railway
👉 https://railway.app
- Login con GitHub
- Clicca **"New Project"**

### 2️⃣ Connetti Repository
- **"Deploy from GitHub repo"**
- Seleziona: `firstclassrl/FARMAP-Pixel-beta-1.2`
- Railway crea automaticamente il servizio

### 3️⃣ Configura (IMPORTANTE!)
Clicca sul servizio → **Settings**:
- **Root Directory**: `server/pdf-generator`
- **Start Command**: `npm start`
- Lascia tutto il resto di default

### 4️⃣ Ottieni URL e Configura Netlify
- **Settings** → **Networking** → Copia URL
- Netlify → Env Variables → `VITE_PDF_GENERATOR_URL` = `<url-railway>`

## 🎉 FINITO!

Railway è 10x più semplice di Render per questo!

---

## 🐛 Se Railway non trova la directory

1. **Settings** → **Service Source**
2. Verifica che il **Path** sia: `server/pdf-generator`
3. Se non c'è, aggiungi manualmente nel campo **Root Directory**

---

## 💡 Alternative se ancora problemi

**Opzione B: Vercel Serverless Functions** (più complesso, ma funziona)
**Opzione C: DigitalOcean App Platform** (simile a Railway)
**Opzione D: Render ma con repository separato** (più lavoro)

Prova prima Railway, è il più semplice! 🚂

