# 🏠 Hosting Diretto Pixel CRM (Senza Vercel)

## 🎯 **Opzioni di Hosting Diretto**

### **Opzione A: Hosting Condiviso (Aruba)**
```
www.farmapindustry.it/crm/ → Cartella del sito
```

### **Opzione B: VPS/Cloud Server**
```
crm.farmapindustry.it → Server dedicato
```

### **Opzione C: Hosting Statico**
```
www.farmapindustry.it/crm/ → Redirect a hosting statico
```

## 🚀 **Opzione A: Hosting Condiviso (Aruba)**

### **Vantaggi:**
- ✅ **Costo basso** (€5-15/mese)
- ✅ **Facile da configurare**
- ✅ **SSL incluso**
- ✅ **Backup automatico**

### **Configurazione:**

#### **STEP 1: Build dell'App**
```bash
# Nel tuo progetto
npm run build
# Crea cartella /dist con files statici
```

#### **STEP 2: Upload su Aruba**
1. **Accedi al pannello Aruba**
2. **Vai su "File Manager"**
3. **Crea cartella**: `/public_html/crm/`
4. **Carica tutti i files** dalla cartella `/dist`

#### **STEP 3: Configura .htaccess**
Crea file `.htaccess` in `/public_html/crm/`:

```apache
RewriteEngine On
RewriteBase /crm/
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /crm/index.html [L]

# Compressione
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
</IfModule>

# Sicurezza
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
```

#### **STEP 4: Variabili Ambiente**
Crea file `.env.production` in `/public_html/crm/`:

```bash
VITE_SUPABASE_URL=https://pfpvsahrmwbhkgvjidnr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **STEP 5: Test**
- **URL**: `https://www.farmapindustry.it/crm/`
- **Verifica**: Login e funzionalità

## 🖥️ **Opzione B: VPS/Cloud Server**

### **Vantaggi:**
- ✅ **Controllo completo**
- ✅ **Performance ottimale**
- ✅ **Scalabilità**
- ✅ **Personalizzazione avanzata**

### **Configurazione:**

#### **STEP 1: Server Setup**
```bash
# Ubuntu 20.04 LTS
sudo apt update
sudo apt install nginx nodejs npm certbot python3-certbot-nginx
```

#### **STEP 2: Nginx Configuration**
```nginx
# /etc/nginx/sites-available/crm.farmapindustry.it
server {
    listen 80;
    server_name crm.farmapindustry.it;
    
    root /var/www/crm;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### **STEP 3: SSL Certificate**
```bash
sudo certbot --nginx -d crm.farmapindustry.it
```

#### **STEP 4: Deploy App**
```bash
# Crea directory
sudo mkdir -p /var/www/crm
sudo chown -R $USER:$USER /var/www/crm

# Build e deploy
npm run build
sudo cp -r dist/* /var/www/crm/

# Restart nginx
sudo systemctl restart nginx
```

## 📁 **Opzione C: Hosting Statico**

### **Vantaggi:**
- ✅ **Gratuito** (Netlify, GitHub Pages)
- ✅ **CDN globale**
- ✅ **SSL automatico**
- ✅ **Deploy automatico**

### **Configurazione:**

#### **STEP 1: Netlify**
1. **Vai su [netlify.com](https://netlify.com)**
2. **Connetti repository GitHub**
3. **Build settings**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. **Environment variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

#### **STEP 2: Custom Domain**
1. **Vai su "Domain settings"**
2. **Aggiungi**: `crm.farmapindustry.it`
3. **Configura DNS**:
   ```
   Tipo: CNAME
   Nome: crm
   Valore: [netlify-subdomain].netlify.app
   ```

## 🔧 **Configurazione Avanzata**

### **Docker Deployment**
```dockerfile
# Dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  crm:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_SUPABASE_URL=https://pfpvsahrmwbhkgvjidnr.supabase.co
      - VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **CI/CD Pipeline**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/crm
            git pull origin main
            npm run build
            sudo systemctl reload nginx
```

## 📊 **Costi Comparativi**

| Opzione | Costo Mensile | Setup | Manutenzione | Controllo |
|---------|---------------|-------|--------------|-----------|
| **Aruba Hosting** | €5-15 | Facile | Bassa | Medio |
| **VPS (DigitalOcean)** | €10-50 | Media | Media | Alto |
| **Netlify** | €0-19 | Facile | Bassa | Basso |
| **AWS S3 + CloudFront** | €5-25 | Media | Bassa | Alto |

## 🎯 **Raccomandazione per FARMAP**

### **Per Iniziare (Consigliato):**
**Aruba Hosting Condiviso**
- ✅ **Costo basso** (€5-15/mese)
- ✅ **Facile da configurare**
- ✅ **SSL incluso**
- ✅ **Supporto italiano**

### **Per Produzione:**
**VPS + Nginx**
- ✅ **Controllo completo**
- ✅ **Performance ottimale**
- ✅ **Scalabilità**
- ✅ **Personalizzazione**

## 🚀 **Quick Start - Aruba Hosting**

### **STEP 1: Build**
```bash
npm run build
```

### **STEP 2: Upload**
1. **Aruba File Manager** → `/public_html/crm/`
2. **Carica files** da `/dist`
3. **Crea `.htaccess`** (vedi sopra)

### **STEP 3: Test**
- **URL**: `https://www.farmapindustry.it/crm/`
- **Login**: Con credenziali admin

### **STEP 4: DNS (Opzionale)**
Per sottodominio `crm.farmapindustry.it`:
```
Tipo: A
Nome: crm
Valore: [IP del server Aruba]
```

## 🔒 **Sicurezza e Performance**

### **Headers di Sicurezza**
```apache
# .htaccess
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set X-XSS-Protection "1; mode=block"
```

### **Compressione e Cache**
```apache
# Compressione
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain text/html text/xml text/css application/javascript
</IfModule>

# Cache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 year"
</IfModule>
```

## 📱 **PWA Configuration**

### **Service Worker**
```javascript
// sw.js
const CACHE_NAME = 'pixel-crm-v1';
const urlsToCache = [
  '/crm/',
  '/crm/index.html',
  '/crm/static/js/bundle.js',
  '/crm/static/css/main.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

### **Manifest**
```json
{
  "name": "Pixel CRM - FARMAP Industry",
  "short_name": "Pixel CRM",
  "start_url": "/crm/",
  "display": "standalone",
  "background_color": "#1a1a1a",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/crm/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/crm/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 🎉 **Conclusione**

L'hosting diretto ti dà **controllo completo** sull'app Pixel CRM. La scelta dipende da:

- **Budget**: Aruba hosting (€5-15/mese)
- **Controllo**: VPS (€10-50/mese)
- **Facilità**: Netlify (€0-19/mese)

**Raccomandazione**: Inizia con **Aruba hosting** per testare, poi migra a **VPS** quando sei pronto per la produzione! 🚀
