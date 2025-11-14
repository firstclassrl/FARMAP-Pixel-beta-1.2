# 🚀 Deploy Rapido Servizio PDF

## ✅ Servizio Locale Attivo

Il servizio PDF è già avviato e funzionante su `http://localhost:3001`

## 📦 Deploy in Produzione - Render (5 minuti)

### Step 1: Deploy su Render

1. **Vai su**: https://render.com
2. **Crea account** (gratuito con GitHub)
3. **New +** → **Web Service**
4. **Connetti repository** GitHub del progetto
5. **Configurazione**:
   ```
   Name: pdf-generator-farmap
   Environment: Node
   Region: Frankfurt (o più vicino a te)
   Branch: main
   Root Directory: server/pdf-generator
   Build Command: npm install
   Start Command: npm start
   ```
6. **Clicca "Create Web Service"**
7. **Aspetta il deploy** (2-3 minuti)

### Step 2: Ottieni URL

Una volta deployato, Render ti darà un URL tipo:
```
https://pdf-generator-farmap.onrender.com
```

### Step 3: Configura Frontend (Netlify)

1. **Vai su Netlify Dashboard**
2. **Il tuo sito** → **Site settings** → **Environment variables**
3. **Add variable**:
   ```
   Key: VITE_PDF_GENERATOR_URL
   Value: https://pdf-generator-farmap.onrender.com
   ```
4. **Save**
5. **Trigger redeploy** (Deploys → Trigger deploy → Deploy site)

### Step 4: Test

1. Apri l'app in produzione
2. Vai su un listino
3. Clicca "Anteprima"
4. Clicca "Download PDF"
5. ✅ Dovrebbe funzionare!

---

## 🔧 Alternative: Railway (ancora più semplice)

1. Vai su https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. Seleziona repository
4. Railway rileva automaticamente il servizio
5. Configura **Root Directory**: `server/pdf-generator`
6. Deploy automatico!

---

## ⚠️ Note Importanti

- **Render Free Tier**: Sleep dopo 15 min di inattività. Primo request può essere lento (~30 sec)
- **Timeout**: 30 secondi per request. Per PDF molto grandi potrebbe servire piano a pagamento
- **Per produzione critica**: Considera piano Render a pagamento o VPS (DigitalOcean)

---

## 🐛 Troubleshooting

### PDF non si genera
- Controlla i logs su Render Dashboard
- Verifica che `VITE_PDF_GENERATOR_URL` sia configurata in Netlify
- Verifica che il servizio sia online (apri URL in browser)

### CORS Error
- Il servizio ha già CORS configurato
- Se persiste, verifica che l'URL sia corretto

### Timeout
- Render free tier ha limite 30 secondi
- Considera upgrade o alternativa

---

## ✅ Checklist Deploy

- [ ] Servizio deployato su Render/Railway
- [ ] URL del servizio copiato
- [ ] `VITE_PDF_GENERATOR_URL` configurata in Netlify
- [ ] Frontend redeployato
- [ ] Test PDF generazione in produzione
- [ ] Verifica che PDF sia leggero (< 1MB)

