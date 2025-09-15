# 🌐 Integrazione Pixel CRM su www.farmapindustry.it

## 🎯 **Opzioni di Integrazione**

### **Opzione 1: Sottodominio (Consigliato)**
```
crm.farmapindustry.it → pixel-beta10.vercel.app
```

### **Opzione 2: Subdirectory**
```
www.farmapindustry.it/crm/
```

### **Opzione 3: Pagina Dedicata**
```
www.farmapindustry.it/pixel-crm/
```

## 🚀 **Opzione 1: Sottodominio (Migliore)**

### **Vantaggi:**
- ✅ **URL pulito**: `crm.farmapindustry.it`
- ✅ **SEO ottimizzato**
- ✅ **Facile da ricordare**
- ✅ **Separazione completa** dal sito principale

### **Configurazione DNS:**

#### **STEP 1: Configura DNS**
Nel tuo pannello DNS (Aruba, GoDaddy, etc.):

```
Tipo: CNAME
Nome: crm
Valore: pixel-beta10.vercel.app
TTL: 3600
```

#### **STEP 2: Configura Vercel**
1. **Vai su [vercel.com](https://vercel.com)**
2. **Seleziona il progetto `pixel-beta10`**
3. **Vai su "Settings" → "Domains"**
4. **Aggiungi**: `crm.farmapindustry.it`
5. **Verifica** il dominio

## 🏠 **Opzione 4: Hosting Diretto (Senza Vercel)**

### **Vantaggi:**
- ✅ **Controllo completo** del server
- ✅ **Costi ridotti** (solo hosting)
- ✅ **Personalizzazione avanzata**
- ✅ **Integrazione nativa** con il sito

### **Svantaggi:**
- ❌ **Configurazione più complessa**
- ❌ **Manutenzione server**
- ❌ **SSL da gestire manualmente**
- ❌ **Backup e sicurezza**

### **Opzioni di Hosting:**

#### **A) Hosting Condiviso (Aruba, SiteGround, etc.)**
```
www.farmapindustry.it/crm/ → Cartella del sito
```

**Configurazione:**
1. **Crea cartella**: `/public_html/crm/`
2. **Carica files**: Build dell'app React
3. **Configura .htaccess** per SPA routing
4. **SSL**: Certificato Let's Encrypt

#### **B) VPS/Cloud Server (DigitalOcean, AWS, etc.)**
```
www.farmapindustry.it/crm/ → Server dedicato
```

**Configurazione:**
1. **Server**: Ubuntu/CentOS
2. **Web Server**: Nginx/Apache
3. **SSL**: Certificato Let's Encrypt
4. **Firewall**: Configurazione sicurezza

#### **C) Hosting Statico (Netlify, GitHub Pages)**
```
www.farmapindustry.it/crm/ → Redirect a hosting statico
```

**Configurazione:**
1. **Build**: `npm run build`
2. **Upload**: Files statici
3. **DNS**: Redirect o proxy

### **Configurazione per Hosting Diretto:**

#### **STEP 1: Build dell'App**
```bash
npm run build
# Crea cartella /dist con files statici
```

#### **STEP 2: Configurazione Server**
```apache
# .htaccess per Apache
RewriteEngine On
RewriteBase /crm/
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /crm/index.html [L]
```

```nginx
# nginx.conf
location /crm/ {
    try_files $uri $uri/ /crm/index.html;
}
```

#### **STEP 3: Variabili Ambiente**
```bash
# .env.production
VITE_SUPABASE_URL=https://pfpvsahrmwbhkgvjidnr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **STEP 4: SSL e Sicurezza**
```bash
# Certificato Let's Encrypt
certbot --nginx -d farmapindustry.it -d www.farmapindustry.it
```

### **Configurazione DNS per Hosting Diretto:**

#### **Opzione A: Subdirectory**
```
www.farmapindustry.it/crm/ → Server principale
```

#### **Opzione B: Sottodominio**
```
crm.farmapindustry.it → Server dedicato
```

**DNS:**
```
Tipo: A
Nome: crm
Valore: [IP del server]
TTL: 3600
```

### **Costi Comparativi:**

| Opzione | Costo Mensile | Complessità | Controllo |
|---------|---------------|-------------|-----------|
| **Vercel** | $0-20 | Bassa | Medio |
| **Hosting Condiviso** | $5-15 | Media | Alto |
| **VPS** | $10-50 | Alta | Massimo |
| **Netlify** | $0-19 | Bassa | Basso |

### **Raccomandazione:**

**Per iniziare**: Vercel (facile e veloce)
**Per produzione**: Hosting diretto (controllo completo)

#### **STEP 3: Aggiorna il Sito Principale**
Su www.farmapindustry.it, aggiungi:

```html
<!-- Sezione CRM -->
<section class="crm-section">
    <div class="container">
        <h2>Pixel CRM</h2>
        <p>Sistema di gestione commerciale FARMAP</p>
        <a href="https://crm.farmapindustry.it" class="btn-crm">
            🚀 Accedi al CRM
        </a>
    </div>
</section>
```

## 📁 **Opzione 2: Subdirectory**

### **Configurazione:**

#### **STEP 1: Modifica vite.config.ts**
```typescript
export default defineConfig({
  base: '/crm/', // Per subdirectory
  // ... resto della configurazione
});
```

#### **STEP 2: Build e Upload**
```bash
npm run build
# Upload cartella dist/ su www.farmapindustry.it/crm/
```

#### **STEP 3: Configurazione Server**
```apache
# .htaccess per Apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /crm/index.html [L]
```

```nginx
# Configurazione Nginx
location /crm/ {
    try_files $uri $uri/ /crm/index.html;
}
```

## 🎨 **Opzione 3: Pagina Dedicata**

### **Integrazione nel Sito:**

#### **STEP 1: Crea pagina dedicata**
```html
<!-- www.farmapindustry.it/pixel-crm.html -->
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pixel CRM - FARMAP Industry</title>
    <meta name="description" content="Sistema di gestione commerciale FARMAP">
</head>
<body>
    <div class="crm-landing">
        <div class="crm-header">
            <img src="logo-farmap.png" alt="FARMAP Logo">
            <h1>Pixel CRM</h1>
            <p>Sistema di gestione commerciale completo</p>
        </div>
        
        <div class="crm-features">
            <div class="feature">
                <h3>👥 Gestione Clienti</h3>
                <p>Database clienti completo</p>
            </div>
            <div class="feature">
                <h3>📦 Gestione Prodotti</h3>
                <p>Catalogo prodotti e listini</p>
            </div>
            <div class="feature">
                <h3>📋 Ordini</h3>
                <p>Gestione ordini e fatturazione</p>
            </div>
        </div>
        
        <div class="crm-demo">
            <h2>Prova la Demo</h2>
            <p>Credenziali demo: admin@admin.it / admin123</p>
            <a href="https://crm.farmapindustry.it" class="demo-button">
                🚀 Accedi al CRM
            </a>
        </div>
    </div>
</body>
</html>
```

#### **STEP 2: CSS per la pagina**
```css
.crm-landing {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.crm-header {
    text-align: center;
    margin-bottom: 60px;
}

.crm-header img {
    width: 200px;
    height: auto;
    margin-bottom: 20px;
}

.crm-header h1 {
    color: #dc2626;
    font-size: 3rem;
    margin-bottom: 10px;
}

.crm-features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
    margin-bottom: 60px;
}

.feature {
    background: #f8f9fa;
    padding: 30px;
    border-radius: 12px;
    text-align: center;
}

.feature h3 {
    color: #333;
    margin-bottom: 15px;
}

.demo-button {
    background: #dc2626;
    color: white;
    padding: 15px 30px;
    border-radius: 8px;
    text-decoration: none;
    font-size: 18px;
    display: inline-block;
    transition: background 0.3s;
}

.demo-button:hover {
    background: #b91c1c;
}
```

## 🔧 **Configurazione Avanzata**

### **SSL e HTTPS:**
- ✅ **Vercel** fornisce SSL automatico
- ✅ **Redirect** HTTP → HTTPS
- ✅ **Certificati** automatici

### **Performance:**
```javascript
// Analytics per il CRM
gtag('config', 'GA_MEASUREMENT_ID', {
    'custom_map': {
        'custom_parameter_1': 'crm_usage'
    }
});

// Traccia accessi CRM
gtag('event', 'crm_access', {
    'event_category': 'engagement',
    'event_label': 'pixel_crm'
});
```

### **SEO Ottimizzato:**
```html
<!-- Meta tags per SEO -->
<meta name="robots" content="index, follow">
<meta property="og:title" content="Pixel CRM - FARMAP Industry">
<meta property="og:description" content="Sistema di gestione commerciale FARMAP">
<meta property="og:url" content="https://crm.farmapindustry.it">
<meta property="og:image" content="https://www.farmapindustry.it/og-image.png">
```

## 📊 **Monitoraggio**

### **Google Analytics:**
```javascript
// Traccia conversioni CRM
gtag('event', 'crm_conversion', {
    'event_category': 'business',
    'event_label': 'crm_signup'
});
```

### **Dashboard Vercel:**
- **Visite** e performance
- **Errori** e logs
- **Deploy** automatici

## 🎯 **Raccomandazione**

**Usa l'Opzione 1 (Sottodominio)** perché:
- ✅ **Più professionale**
- ✅ **Facile da configurare**
- ✅ **SEO ottimizzato**
- ✅ **Scalabile** per il futuro

## 🚀 **Prossimi Passi**

1. **Configura** il DNS per `crm.farmapindustry.it`
2. **Aggiungi** il dominio su Vercel
3. **Aggiorna** il sito principale con link al CRM
4. **Testa** l'integrazione
5. **Monitora** le performance

**Il CRM sarà disponibile su `crm.farmapindustry.it`!** 🎉
