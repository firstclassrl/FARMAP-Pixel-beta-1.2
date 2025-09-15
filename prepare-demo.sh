#!/bin/bash

# 🚀 Script per Preparare Demo Pixel CRM

echo "🚀 Preparazione Demo Pixel CRM..."

# 1. Crea cartella demo
echo "📁 Creando cartella demo..."
mkdir -p demo

# 2. Build dell'applicazione
echo "🔨 Building applicazione..."
npm run build

# 3. Copia file build nella cartella demo
echo "📋 Copiando file build..."
cp -r dist/* demo/

# 4. Crea file README per la demo
echo "📝 Creando README demo..."
cat > demo/README.md << EOF
# 🎯 Pixel CRM Demo

## 📱 Demo dell'applicazione Pixel CRM per FARMAP

### 🔐 Credenziali Demo
- **Email**: admin@admin.it
- **Password**: admin123

### 🚀 Funzionalità Demo
- ✅ Gestione Clienti
- ✅ Gestione Prodotti
- ✅ Listini Prezzi
- ✅ Ordini
- ✅ Campionatura
- ✅ Report
- ✅ Gestione Utenti

### 🏢 Dati Aziendali
- **Ragione Sociale**: FARMAP INDUSTRY S.r.l.
- **Indirizzo**: Via Nazionale, 66 - 65012 Cepagatti (PE)

### 📞 Contatto
- **Sito**: www.abruzzo.ai
- **Email**: info@abruzzo.ai

---
*Demo generata automaticamente - $(date)*
EOF

# 5. Crea file index.html personalizzato per demo
echo "🌐 Creando index.html personalizzato..."
cat > demo/index-demo.html << EOF
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pixel CRM Demo - FARMAP</title>
    <meta name="description" content="Demo dell'applicazione Pixel CRM per FARMAP - Gestione commerciale completa">
    <meta name="keywords" content="CRM, FARMAP, gestione commerciale, demo">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .demo-container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 600px;
            text-align: center;
        }
        .logo {
            width: 200px;
            height: auto;
            margin-bottom: 20px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
        }
        .demo-button {
            background: #dc2626;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 18px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 10px;
            transition: background 0.3s;
        }
        .demo-button:hover {
            background: #b91c1c;
        }
        .credentials {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: left;
        }
        .credentials h3 {
            margin-top: 0;
            color: #333;
        }
        .credential-item {
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .credential-item:last-child {
            border-bottom: none;
        }
        .credential-label {
            font-weight: bold;
            color: #555;
        }
        .credential-value {
            color: #333;
            font-family: monospace;
            background: #e9ecef;
            padding: 2px 6px;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="demo-container">
        <img src="logo farmap industry.png" alt="FARMAP Logo" class="logo">
        <h1>Pixel CRM Demo</h1>
        <p class="subtitle">Sistema di gestione commerciale FARMAP</p>
        
        <div class="credentials">
            <h3>🔐 Credenziali Demo</h3>
            <div class="credential-item">
                <span class="credential-label">Email:</span>
                <span class="credential-value">admin@admin.it</span>
            </div>
            <div class="credential-item">
                <span class="credential-label">Password:</span>
                <span class="credential-value">admin123</span>
            </div>
        </div>
        
        <a href="index.html" class="demo-button">🚀 Avvia Demo</a>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
                <strong>FARMAP INDUSTRY S.r.l.</strong><br>
                Via Nazionale, 66 - 65012 Cepagatti (PE)<br>
                <a href="https://www.abruzzo.ai" style="color: #dc2626;">www.abruzzo.ai</a>
            </p>
        </div>
    </div>
</body>
</html>
EOF

# 6. Crea zip per download
echo "📦 Creando archivio demo..."
cd demo
zip -r ../pixel-crm-demo.zip .
cd ..

echo "✅ Demo preparata con successo!"
echo "📁 Cartella demo: ./demo/"
echo "📦 Archivio: ./pixel-crm-demo.zip"
echo ""
echo "🚀 Opzioni di deploy:"
echo "1. Upload cartella demo su server web"
echo "2. Deploy su Vercel/Netlify"
echo "3. Hosting su GitHub Pages"
echo ""
echo "🌐 Per integrare con www.abruzzo.ai:"
echo "- Subdirectory: www.abruzzo.ai/pixel-crm-demo/"
echo "- Sottodominio: demo.abruzzo.ai"
