# 🌐 Deploy Demo su Netlify

## ✅ **Vantaggi Netlify**
- **Gratuito** per progetti personali
- **Deploy automatico** da GitHub
- **Form handling** integrato
- **Serverless functions**
- **HTTPS automatico**

## 📋 **Preparazione**

### **STEP 1: Crea netlify.toml**
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### **STEP 2: Configura Variabili Ambiente**
Nel dashboard Netlify:
```
VITE_SUPABASE_URL = https://pfpvsahrmwbhkgvjidnr.supabase.co
VITE_SUPABASE_ANON_KEY = your_anon_key_here
```

### **STEP 3: Deploy**

1. **Vai su [netlify.com](https://netlify.com)**
2. **Connetti GitHub**
3. **Seleziona repository**
4. **Deploy automatico**

## 🎯 **Risultato**
- **URL Demo**: `https://pixel-crm-demo.netlify.app`
- **URL Personalizzato**: `https://demo.abruzzo.ai`
