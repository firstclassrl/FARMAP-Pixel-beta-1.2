# 🚀 Istruzioni Deploy Railway - Fix Package Lock

## Problema Risolto

Il `package-lock.json` è stato rigenerato correttamente e ora include tutte le dipendenze di `@supabase/supabase-js`.

## ✅ File Pronti per Commit

1. ✅ `server/pdf-generator/package.json` - Con `@supabase/supabase-js@^2.39.3`
2. ✅ `server/pdf-generator/package-lock.json` - Rigenerato con tutte le dipendenze
3. ✅ `server/pdf-generator/server.js` - Con modifiche CORS e nuovo endpoint

## 📋 Passi per Deploy

### 1. Commit e Push

```bash
# Dalla root del progetto
git add server/pdf-generator/package.json
git add server/pdf-generator/package-lock.json
git add server/pdf-generator/server.js
git commit -m "Fix: Aggiornato package-lock.json e aggiunto CORS per endpoint PDF"
git push
```

### 2. Verifica Deploy Railway

1. Vai su Railway Dashboard
2. Seleziona il servizio "pdf-generator-farmap"
3. Vai su "Deployments"
4. Verifica che il nuovo deploy sia in corso
5. Controlla i log per confermare che il build completi

### 3. Test Endpoint

Dopo il deploy, testa:

```bash
# Health check
curl https://pdf-generator-farmap-production.up.railway.app/health

# Test OPTIONS (CORS preflight)
curl -X OPTIONS https://pdf-generator-farmap-production.up.railway.app/api/generate-price-list-pdf \
  -H "Origin: https://pixel.farmap.it" \
  -v
```

Dovresti vedere gli header CORS nella risposta.

## 🔍 Verifica Problemi Comuni

### Se il deploy fallisce ancora:

1. **Verifica che il package-lock.json sia committato:**
   ```bash
   git status
   ```

2. **Verifica che non ci siano conflitti:**
   ```bash
   git diff server/pdf-generator/package-lock.json
   ```

3. **Controlla i log Railway** per errori specifici

## ✅ Checklist

- [ ] `package.json` contiene `@supabase/supabase-js@^2.39.3`
- [ ] `package-lock.json` è stato rigenerato
- [ ] File committati e pushati
- [ ] Railway ha fatto deploy
- [ ] Build completato senza errori
- [ ] Endpoint risponde correttamente

## 🎯 Risultato Atteso

Dopo il deploy riuscito:
- ✅ Build Railway completato
- ✅ Server online e funzionante
- ✅ Endpoint con CORS configurato correttamente
- ✅ Nessun errore "Failed to fetch"



