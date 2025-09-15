# 🔧 Fix Vercel - Variabili Ambiente

## 🚨 **Problema Identificato**

L'app non parte su Vercel perché mancano le variabili ambiente Supabase:
- ❌ `VITE_SUPABASE_URL missing`
- ❌ `VITE_SUPABASE_ANON_KEY missing`

## ✅ **Soluzione**

### **STEP 1: Ottieni le Chiavi Supabase**

1. **Vai su [supabase.com](https://supabase.com)**
2. **Seleziona il tuo progetto**
3. **Vai su "Settings" → "API"**
4. **Copia:**
   - **Project URL**: `https://pfpvsahrmwbhkgvjidnr.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **STEP 2: Configura Vercel**

1. **Vai su [vercel.com](https://vercel.com)**
2. **Seleziona il progetto `pixel-beta10`**
3. **Clicca "Settings"**
4. **Vai su "Environment Variables"**
5. **Aggiungi:**

```
Name: VITE_SUPABASE_URL
Value: https://pfpvsahrmwbhkgvjidnr.supabase.co
Environment: Production, Preview, Development

Name: VITE_SUPABASE_ANON_KEY
Value: [la tua chiave anonima completa]
Environment: Production, Preview, Development
```

### **STEP 3: Redeploy**

1. **Clicca "Deployments"**
2. **Clicca sui tre puntini del deployment più recente**
3. **Seleziona "Redeploy"**
4. **Aspetta il completamento**

## 🎯 **Risultato Atteso**

Dopo il redeploy:
- ✅ **App funzionante** su Vercel
- ✅ **Login** con credenziali demo
- ✅ **Tutte le funzionalità** operative

## 🔍 **Verifica**

1. **Vai su** `https://pixel-beta10.vercel.app`
2. **Controlla** che non ci siano errori nella console
3. **Prova** il login con `admin@admin.it` / `admin123`

## 🚨 **Se Persiste il Problema**

### **Controlla il file .env**
Crea un file `.env.local` nella root del progetto:

```env
VITE_SUPABASE_URL=https://pfpvsahrmwbhkgvjidnr.supabase.co
VITE_SUPABASE_ANON_KEY=la_tua_chiave_anonima
```

### **Redeploy da GitHub**
1. **Push** le modifiche su GitHub
2. **Vercel** farà il redeploy automatico
