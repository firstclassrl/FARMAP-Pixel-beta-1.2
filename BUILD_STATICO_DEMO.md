# 📦 Build Statico per Demo

## 🔧 **Comando Build**

```bash
npm run build
```

## 📁 **File Generati**
- **Cartella**: `dist/`
- **File principali**: `index.html`, `assets/`, `manifest.webmanifest`

## 🌐 **Opzioni Hosting**

### **1. GitHub Pages**
```bash
# Push della cartella dist su branch gh-pages
git subtree push --prefix dist origin gh-pages
```

### **2. Surge.sh**
```bash
npm install -g surge
cd dist
surge
```

### **3. Firebase Hosting**
```bash
npm install -g firebase-tools
firebase init hosting
firebase deploy
```

### **4. Hosting Tradizionale**
- **Upload** cartella `dist/` su server
- **Configura** server web (Apache/Nginx)
- **HTTPS** con Let's Encrypt

## ⚙️ **Configurazione per Build**

### **vite.config.ts**
```typescript
export default defineConfig({
  base: '/pixel-crm-demo/', // Per subdirectory
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Per demo
    minify: 'terser'
  }
});
```

## 🎯 **Integrazione con www.abruzzo.ai**

### **Subdirectory**
```
www.abruzzo.ai/pixel-crm-demo/
```

### **Sottodominio**
```
demo.abruzzo.ai
```
