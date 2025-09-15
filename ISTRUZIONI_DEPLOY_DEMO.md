# 🚀 Istruzioni Complete per Deploy Demo Pixel CRM

## ✅ **Demo Preparata con Successo!**

La demo è stata generata nella cartella `./demo/` e nell'archivio `./pixel-crm-demo.zip`.

## 📁 **File Generati**

### **Cartella Demo (`./demo/`)**
- ✅ **`index.html`** - Applicazione principale
- ✅ **`index-demo.html`** - Pagina di benvenuto con credenziali
- ✅ **`README.md`** - Documentazione demo
- ✅ **`assets/`** - File CSS, JS e risorse
- ✅ **`manifest.webmanifest`** - PWA manifest
- ✅ **Logo e immagini** - Tutti i file necessari

### **Archivio (`./pixel-crm-demo.zip`)**
- ✅ **Download completo** per hosting tradizionale
- ✅ **Pronto per upload** su qualsiasi server web

## 🔐 **Credenziali Demo**

- **Email**: `admin@admin.it`
- **Password**: `admin123`

## 🌐 **Opzioni di Deploy**

### **Opzione 1: Vercel (Consigliato)**

#### **Deploy Automatico da GitHub:**
1. **Vai su [vercel.com](https://vercel.com)**
2. **Connetti il tuo GitHub**
3. **Seleziona repository `pixel-beta`**
4. **Configura variabili ambiente:**
   ```
   VITE_SUPABASE_URL = https://pfpvsahrmwbhkgvjidnr.supabase.co
   VITE_SUPABASE_ANON_KEY = your_anon_key_here
   ```
5. **Deploy automatico**

#### **Deploy Manuale:**
```bash
# Installa Vercel CLI
npm install -g vercel

# Deploy dalla cartella demo
cd demo
vercel --prod
```

**Risultato**: `https://pixel-crm-demo.vercel.app`

### **Opzione 2: Netlify**

#### **Deploy Automatico:**
1. **Vai su [netlify.com](https://netlify.com)**
2. **Connetti GitHub**
3. **Seleziona repository**
4. **Configura build settings:**
   ```
   Build command: npm run build
   Publish directory: dist
   ```
5. **Deploy automatico**

#### **Deploy Manuale:**
```bash
# Installa Netlify CLI
npm install -g netlify-cli

# Deploy dalla cartella demo
cd demo
netlify deploy --prod --dir .
```

**Risultato**: `https://pixel-crm-demo.netlify.app`

### **Opzione 3: GitHub Pages**

```bash
# Crea branch gh-pages
git checkout --orphan gh-pages
git add demo/*
git commit -m "Deploy demo"
git push origin gh-pages
```

**Risultato**: `https://firstclassrl.github.io/pixel-beta/`

### **Opzione 4: Hosting Tradizionale**

#### **Upload su Server Web:**
1. **Scarica** `pixel-crm-demo.zip`
2. **Estrai** nella cartella web del server
3. **Configura** server web (Apache/Nginx)
4. **Abilita** HTTPS con Let's Encrypt

#### **Configurazione Apache (.htaccess):**
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Cache static files
<FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 month"
</FilesMatch>
```

#### **Configurazione Nginx:**
```nginx
location / {
    try_files $uri $uri/ /index.html;
}

location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1M;
    add_header Cache-Control "public, immutable";
}
```

## 🔗 **Integrazione con www.abruzzo.ai**

### **Opzione A: Subdirectory**
```
https://www.abruzzo.ai/pixel-crm-demo/
```

**Configurazione:**
```html
<!-- Su www.abruzzo.ai -->
<div class="demo-section">
    <h2>Demo Pixel CRM</h2>
    <p>Sistema di gestione commerciale FARMAP</p>
    <a href="/pixel-crm-demo/" class="demo-button">
        🚀 Prova la Demo
    </a>
</div>
```

### **Opzione B: Sottodominio**
```
https://demo.abruzzo.ai
```

**Configurazione DNS:**
```
demo.abruzzo.ai → CNAME → pixel-crm-demo.vercel.app
```

### **Opzione C: Pagina Dedicata**
```html
<!-- Su www.abruzzo.ai/demo.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Demo Pixel CRM - Abruzzo.ai</title>
    <meta name="description" content="Demo del sistema CRM Pixel per FARMAP">
</head>
<body>
    <div class="demo-container">
        <h1>Pixel CRM Demo</h1>
        <p>Sistema di gestione commerciale completo</p>
        
        <div class="demo-iframe">
            <iframe 
                src="https://pixel-crm-demo.vercel.app" 
                width="100%" 
                height="800px"
                frameborder="0">
            </iframe>
        </div>
        
        <div class="demo-credentials">
            <h3>Credenziali Demo</h3>
            <p><strong>Email:</strong> admin@admin.it</p>
            <p><strong>Password:</strong> admin123</p>
        </div>
    </div>
</body>
</html>
```

## 🎯 **Risultati Attesi**

### **Demo Completa:**
- ✅ **Login funzionante** con credenziali demo
- ✅ **Tutte le funzionalità** disponibili
- ✅ **Dati aziendali corretti** (FARMAP INDUSTRY S.r.l.)
- ✅ **Design responsive** per mobile e desktop
- ✅ **PWA** installabile su dispositivi

### **Integrazione con www.abruzzo.ai:**
- ✅ **Link prominente** nella homepage
- ✅ **Sezione dedicata** per demo
- ✅ **SEO ottimizzato** per "demo CRM"
- ✅ **Analytics** per tracciare visite demo

## 📊 **Monitoraggio Demo**

### **Google Analytics:**
```javascript
// Traccia visite demo
gtag('event', 'demo_visit', {
    'demo_name': 'pixel_crm',
    'demo_url': window.location.href
});
```

### **Conversioni:**
- **Visite demo** → **Contatti** → **Vendite**
- **Tasso di conversione** demo a clienti
- **Feedback** utenti demo

## 🚀 **Prossimi Passi**

1. **Scegli** la piattaforma di deploy (Vercel consigliato)
2. **Configura** le variabili ambiente Supabase
3. **Deploy** la demo
4. **Integra** con www.abruzzo.ai
5. **Monitora** le performance e conversioni

**La demo è pronta per il deploy! 🎉**
