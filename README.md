# Pixel - FARMAP CRM

Una moderna applicazione full-stack per la gestione commerciale di FARMAP, costruita con React, Supabase e tecnologie all'avanguardia.

## 🚀 Caratteristiche Principali

- **CRM Completo**: Gestione clienti, prodotti, listini e ordini
- **Dashboard Interattiva**: KPI, grafici e analytics in tempo reale
- **Autenticazione Sicura**: Login con email/password e ruoli utente
- **PWA Ready**: Installabile e funzionante offline
- **OCR Integration**: Parsing automatico di documenti e ordini
- **PDF Generation**: Creazione e firma digitale di preventivi/ordini
- **Export Data**: Excel e CSV per tutti i dati
- **Email Automation**: Invio automatico di conferme ordini
- **Responsive Design**: Ottimizzato per desktop, tablet e mobile

## 🛠️ Stack Tecnologico

### Frontend
- **React 18** con TypeScript
- **Vite** per build tool e dev server
- **React Router** per navigazione
- **Zustand** per state management
- **Tailwind CSS** + **shadcn/ui** per UI
- **React Hook Form** + **Zod** per validazioni
- **Recharts** per grafici e analytics

### Backend & Database
- **Supabase** per database PostgreSQL, auth e storage
- **Row Level Security (RLS)** per sicurezza avanzata
- **Edge Functions** per API serverless
- **Real-time subscriptions** per aggiornamenti live

### Funzionalità Avanzate
- **Tesseract.js** per OCR
- **pdf-lib** per generazione PDF
- **XLSX** per export Excel
- **PWA** con service worker
- **Vitest** + **Playwright** per testing

## 📁 Struttura del Progetto

```
src/
├── components/          # Componenti riutilizzabili
│   ├── ui/             # Componenti base (Button, Input, etc.)
│   ├── layout/         # Layout e navigazione
│   └── auth/           # Componenti autenticazione
├── pages/              # Pagine dell'applicazione
│   ├── auth/           # Login, signup, reset password
│   ├── Dashboard.tsx   # Dashboard principale
│   └── ...             # Altre pagine
├── hooks/              # Custom React hooks
├── lib/                # Utilities e configurazioni
├── store/              # Zustand store
├── types/              # TypeScript types
└── test-setup.ts       # Configurazione test

supabase/
├── migrations/         # Migrazioni database
└── seed.sql           # Dati di esempio

functions/              # Edge functions (coming soon)
├── email-automation/   # Automazioni email
├── pdf-generation/     # Generazione PDF
└── ocr-processing/     # Elaborazione OCR
```

## 🚀 Quick Start

### 1. Installa le dipendenze

```bash
npm install
```

### 2. Configura Supabase

1. Clicca il pulsante "Connect to Supabase" in alto a destra per configurare Supabase
2. Le variabili d'ambiente verranno configurate automaticamente

### 3. Setup Database

Esegui le migrazioni SQL nel tuo progetto Supabase:

1. Vai su Supabase Dashboard > SQL Editor
2. Copia e esegui il contenuto di `supabase/migrations/001_initial_schema.sql`
3. (Opzionale) Esegui `supabase/seed.sql` per dati di esempio

### 4. Avvia il server di sviluppo

```bash
npm run dev
```


## 📋 Funzionalità per Ruolo

### Admin
- ✅ Accesso completo a tutte le funzionalità
- ✅ Gestione utenti e ruoli
- ✅ Report e analytics avanzati
- ✅ Configurazioni di sistema

### Commerciale
- ✅ CRUD su clienti e ordini
- ✅ Gestione preventivi
- ✅ Visualizzazione prodotti e listini
- ✅ Dashboard vendite

### Lettore
- ✅ Visualizzazione dati (sola lettura)
- ✅ Export dati
- ✅ Dashboard base

## 🧪 Testing

```bash
# Unit e integration test
npm run test

# Test con UI
npm run test:ui

# Coverage
npm run test:coverage

# E2E test
npm run e2e
```

## 📱 PWA (Progressive Web App)

L'applicazione è configurata come PWA e può essere installata su desktop e mobile:

- **Service Worker**: Cache intelligente per performance offline
- **Manifest**: Configurazione per installazione
- **Offline Support**: Funzionalità base disponibili offline

## 🔐 Sicurezza

- **Row Level Security**: Controllo accessi a livello database
- **JWT Authentication**: Token sicuri per autenticazione
- **Role-based Access**: Permissions granulari per ruolo
- **Input Validation**: Validazione lato client e server
- **HTTPS Enforced**: Connessioni sicure obbligatorie

## 🚀 Roadmap

### Phase 1 - MVP ✅
- [x] Setup progetto e autenticazione
- [x] Dashboard base con KPI
- [x] Layout e navigazione
- [x] Database schema e RLS

### Phase 2 - Core Features (In Progress)
- [ ] CRUD Clienti completo
- [ ] CRUD Prodotti e magazzino
- [ ] Gestione listini multi-livello
- [ ] Preventivi e ordini

### Phase 3 - Advanced Features
- [ ] OCR per parsing documenti
- [ ] PDF generation e firma digitale
- [ ] Email automation
- [ ] Import/Export avanzati
- [ ] Ricerca globale
- [ ] Analytics avanzati

### Phase 4 - Optimizations
- [ ] Performance optimization
- [ ] Mobile app (React Native)
- [ ] API integrations
- [ ] Advanced reporting

## 🤝 Contribuire

1. Fork del progetto
2. Crea un feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è sotto licenza MIT. Vedi il file `LICENSE` per dettagli.

## 🆘 Supporto

Per supporto e domande:
- Crea un issue su GitHub
- Email: support@farmap.com
- Documentazione: [docs.farmap.com](https://docs.farmap.com)

---

**Pixel CRM** - *Gestione commerciale semplificata per FARMAP* 🚀