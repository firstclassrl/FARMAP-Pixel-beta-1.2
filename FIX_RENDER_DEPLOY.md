# 🔧 Fix Deploy Render - Root Directory

## Problema
Render sta cercando `/opt/render/project/src/server/pdf-generator` ma la directory non esiste.

## Soluzione

### Step 1: Correggi Root Directory su Render

1. Vai su Render Dashboard → Il tuo servizio "FARMAP-Pixel-beta-1.2"
2. Clicca su **Settings** (icona ingranaggio in alto)
3. Scorri fino a **"Root Directory"**
4. **Cambia** da:
   ```
   /opt/render/project/src/server/pdf-generator
   ```
   A:
   ```
   server/pdf-generator
   ```
5. **Salva** le modifiche

### Step 2: Verifica altre impostazioni

Assicurati che siano configurati così:

- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment**: `Node`
- **Node Version**: `18` o `20` (se disponibile)

### Step 3: Manual Deploy

1. Clicca su **"Manual Deploy"** in alto a destra
2. Seleziona **"Deploy latest commit"**
3. Aspetta il deploy

---

## Alternativa: Crea un nuovo servizio

Se hai problemi, è più veloce creare un nuovo servizio:

1. **Cancella** il servizio attuale (Settings → Delete)
2. **Crea nuovo servizio**:
   - Name: `pdf-generator-farmap`
   - Environment: `Node`
   - Root Directory: `server/pdf-generator` ⚠️ IMPORTANTE: senza `/opt/render/project/src/`
   - Build: `npm install`
   - Start: `npm start`
3. Connetti lo stesso repository

---

## Verifica struttura repository

Assicurati che sul repository GitHub ci sia:
```
FARMAP-Pixel-beta-1.2/
  ├── server/
  │   └── pdf-generator/
  │       ├── server.js
  │       ├── package.json
  │       └── ...
  └── ...
```

Se manca, fai commit e push:
```bash
git add server/pdf-generator
git commit -m "Add PDF generator service"
git push
```

