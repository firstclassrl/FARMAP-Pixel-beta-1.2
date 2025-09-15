# 🚀 Deploy Demo su Vercel

## ✅ **Vantaggi Vercel**
- **Gratuito** per progetti personali
- **Deploy automatico** da GitHub
- **CDN globale** per performance
- **HTTPS automatico**
- **Dominio personalizzabile**

## 📋 **Preparazione**

### **STEP 1: Configura Variabili Ambiente**
Crea un file `.env.production`:

```env
VITE_SUPABASE_URL=https://pfpvsahrmwbhkgvjidnr.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### **STEP 2: Modifica vite.config.ts per Demo**
```typescript
export default defineConfig({
  base: '/pixel-crm-demo/', // Per deploy su subdirectory
  plugins: [
    react(),
    VitePWA({
      // ... configurazione esistente
    })
  ],
  // ... resto della configurazione
});
```

### **STEP 3: Deploy su Vercel**

1. **Vai su [vercel.com](https://vercel.com)**
2. **Connetti il tuo GitHub**
3. **Seleziona il repository `pixel-beta`**
4. **Configura le variabili ambiente**
5. **Deploy automatico**

## 🎯 **Risultato**
- **URL Demo**: `https://pixel-crm-demo.vercel.app`
- **URL Personalizzato**: `https://demo.abruzzo.ai`

## 📱 **Integrazione con www.abruzzo.ai**

### **Opzione A: Subdirectory**
```html
<!-- Su www.abruzzo.ai -->
<a href="https://pixel-crm-demo.vercel.app" target="_blank">
  Demo Pixel CRM
</a>
```

### **Opzione B: Sottodominio**
```html
<!-- Su www.abruzzo.ai -->
<a href="https://demo.abruzzo.ai" target="_blank">
  Demo Pixel CRM
</a>
```
