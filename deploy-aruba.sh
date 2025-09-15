#!/bin/bash

# 🏠 Deploy Pixel CRM su Aruba Hosting
# Script per automatizzare build e upload

echo "🚀 Deploy Pixel CRM su Aruba Hosting"
echo "======================================"

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurazione
BUILD_DIR="dist"
REMOTE_DIR="/public_html/crm"
LOCAL_DIR="./dist"

# Funzione per stampare messaggi colorati
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# STEP 1: Build dell'app
echo "📦 Building app..."
if npm run build; then
    print_status "Build completato con successo"
else
    print_error "Errore durante il build"
    exit 1
fi

# STEP 2: Verifica files
echo "🔍 Verificando files..."
if [ -d "$BUILD_DIR" ]; then
    print_status "Cartella dist trovata"
    ls -la "$BUILD_DIR"
else
    print_error "Cartella dist non trovata"
    exit 1
fi

# STEP 3: Crea .htaccess
echo "⚙️  Creando .htaccess..."
cat > "$BUILD_DIR/.htaccess" << 'EOF'
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
EOF

print_status ".htaccess creato"

# STEP 4: Crea .env.production
echo "🔐 Creando .env.production..."
cat > "$BUILD_DIR/.env.production" << EOF
VITE_SUPABASE_URL=https://pfpvsahrmwbhkgvjidnr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EOF

print_status ".env.production creato"

# STEP 5: Crea zip per upload
echo "📦 Creando archivio per upload..."
cd "$BUILD_DIR"
zip -r ../pixel-crm-aruba.zip .
cd ..

print_status "Archivio pixel-crm-aruba.zip creato"

# STEP 6: Istruzioni per upload
echo ""
echo "🎯 PROSSIMI PASSI:"
echo "=================="
echo "1. Vai su Aruba File Manager"
echo "2. Naviga a /public_html/"
echo "3. Crea cartella 'crm' se non esiste"
echo "4. Carica il file pixel-crm-aruba.zip"
echo "5. Estrai l'archivio nella cartella crm"
echo "6. Testa: https://www.farmapindustry.it/crm/"
echo ""
echo "📁 File da caricare: $(pwd)/pixel-crm-aruba.zip"
echo "📂 Destinazione: /public_html/crm/"
echo ""

# STEP 7: Verifica finale
echo "🔍 Verifica finale..."
if [ -f "pixel-crm-aruba.zip" ]; then
    print_status "Archivio pronto per upload"
    echo "Dimensione: $(du -h pixel-crm-aruba.zip | cut -f1)"
else
    print_error "Archivio non creato"
    exit 1
fi

echo ""
print_status "Deploy preparato con successo! 🚀"
echo "Ora carica pixel-crm-aruba.zip su Aruba File Manager"
