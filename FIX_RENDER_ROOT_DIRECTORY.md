# 🔧 Fix Render Root Directory

## Problema
Render ha cambiato automaticamente `server/pdf-generator` in `/opt/render/project/src/server/pdf-generator` e non trova la directory.

## Soluzione

Render cerca il `render.yaml` nella **root del repository**. Ho spostato il file e aggiornato i comandi.

### Opzione 1: Usa il render.yaml nella root (CONSIGLIATO)

Il file `render.yaml` è ora nella root e contiene i comandi corretti con `cd server/pdf-generator`.

**Su Render Dashboard:**

1. Vai su **Settings** del servizio
2. Rimuovi completamente il campo **"Root Directory"** (lascialo vuoto)
3. Assicurati che:
   - **Build Command**: `cd server/pdf-generator && npm install`
   - **Start Command**: `cd server/pdf-generator && npm start`
4. Salva e fai **Manual Deploy**

### Opzione 2: Configura manualmente

Se Render non legge il `render.yaml`, configura manualmente:

1. **Settings** → **Build & Deploy**
2. **Root Directory**: LASCIA VUOTO o metti `/` (root repository)
3. **Build Command**: 
   ```
   cd server/pdf-generator && npm install
   ```
4. **Start Command**: 
   ```
   cd server/pdf-generator && npm start
   ```
5. Salva e fai **Manual Deploy**

### Opzione 3: Crea nuovo servizio separato

Se continua a dare problemi, crea un servizio dedicato:

1. **New +** → **Web Service**
2. Connetti repository `firstclassrl/FARMAP-Pixel-beta-1.2`
3. Imposta:
   - **Root Directory**: `server/pdf-generator` (senza prefisso)
   - **Build**: `npm install`
   - **Start**: `npm start`
4. Render dovrebbe riconoscere automaticamente il path corretto

---

## Verifica

Dopo il deploy, controlla i logs. Dovresti vedere:
```
==> cd server/pdf-generator
==> npm install
✓ Packages installed
==> npm start
PDF Generator Service running on port...
```

Se vedi ancora errori di directory mancante, prova l'Opzione 3 (nuovo servizio).

