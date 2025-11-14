# Pixel - Farmap

**Versione:** 1.2.0  
**Data:** 17 Gennaio 2025

## Descrizione

Pixel CRM è un'applicazione full-stack per la gestione commerciale di FARMAP Industry. L'applicazione fornisce un sistema completo per la gestione di clienti, prodotti, listini prezzi, ordini e richieste campioni.

## Caratteristiche Principali

### 🏢 Gestione Clienti
- Anagrafica clienti completa
- Import/Export clienti
- Gestione contatti e informazioni commerciali

### 📦 Gestione Prodotti
- Catalogo prodotti con foto
- Categorie e codici prodotto
- Gestione prezzi base e unità di misura

### 💰 Listini Prezzi
- Creazione e modifica listini personalizzati
- **NUOVO in v1.1.0**: Pulsante anteprima nella modale di modifica
- Assegnazione clienti specifici
- Gestione validità temporale

### 📋 Ordini
- Creazione ordini da listini
- Gestione stato ordini
- Export ordini

### 📊 Dashboard
- KPI in tempo reale
- Statistiche vendite
- Monitoraggio performance

### 🔐 Autenticazione
- Sistema di login sicuro
- Gestione utenti
- Reset password

## Tecnologie Utilizzate

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, Radix UI, Lucide React
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **PWA**: Vite PWA Plugin

## Installazione

```bash
# Clona il repository
git clone https://github.com/firstclassrl/pixel-beta.git

# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev
```

## Script Disponibili

- `npm run dev` - Avvia il server di sviluppo
- `npm run build` - Build per produzione
- `npm run preview` - Anteprima build di produzione
- `npm run lint` - Esegue il linting del codice
- `npm run test` - Esegue i test

## Changelog

### v1.2.0 (17 Gennaio 2025)

#### ✨ Nuove Funzionalità
- **Sistema Calendario Completo**: Gestione appuntamenti, chiamate e promemoria
- **Dashboard Impegni Giornalieri**: Vista rapida degli appuntamenti del giorno
- **Modal Creazione Appuntamenti**: Form completo per gestire eventi
- **Filtri Calendario Avanzati**: Ricerca e filtri per tipo e data
- **Card Calendario Dashboard**: Accesso rapido al calendario con tema giallo

#### 🎨 Miglioramenti UI/UX
- **Layout Dashboard Ottimizzato**: Card ridimensionate per layout 4x2
- **Texture Header**: Nuova texture di linee per l'header
- **Colori Tematici**: Schema colori coerente per calendario (giallo)
- **Responsive Design**: Ottimizzazione per tutti i dispositivi

#### 🔧 Miglioramenti Tecnici
- **Componenti UI Aggiuntivi**: Badge, Textarea, Calendar types
- **Routing Aggiornato**: Nuova rotta `/calendar` protetta
- **Tipi TypeScript**: Interfacce complete per sistema calendario
- **Performance**: Ottimizzazioni build e bundle

### v1.1.0 Beta (17 Gennaio 2025)

#### ✨ Nuove Funzionalità
- Pulsante "Anteprima" nella modale di modifica listino
- Integrazione con PriceListPrintView per l'anteprima dei listini

#### 🔧 Miglioramenti
- UX migliorata con pulsante anteprima sempre visibile
- Codice ottimizzato e pulito

#### 🗑️ Rimosso
- Pulsante "Stampa" dalla modale di modifica listino
- Codice non utilizzato e funzioni obsolete

#### 🧹 Pulizia Codice
- Rimossi ~100 righe di codice non utilizzato
- Import e tipi ottimizzati
- Variabili di stato non utilizzate rimosse

### v1.0.0 (16 Gennaio 2025)
- Versione iniziale del CRM Pixel per FARMAP
- Sistema completo di gestione commerciale

## Configurazione

1. Crea un file `.env.local` nella root del progetto
2. Configura le variabili d'ambiente per Supabase:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_PDF_GENERATOR_URL=http://localhost:3001  # URL del servizio PDF generator (Puppeteer)
```

## Struttura del Progetto

```
src/
├── components/          # Componenti React riutilizzabili
│   ├── auth/           # Componenti di autenticazione
│   ├── layout/         # Componenti di layout
│   └── ui/             # Componenti UI base
├── hooks/              # Custom React hooks
├── lib/                # Utilities e configurazioni
├── pages/              # Pagine dell'applicazione
├── store/              # State management (Zustand)
└── types/              # Definizioni TypeScript
```

## Contribuire

1. Fork del repository
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## Licenza

Questo progetto è di proprietà di FARMAP INDUSTRY S.r.l. Tutti i diritti riservati.

## Supporto

Per supporto tecnico o domande, contattare il team di sviluppo FARMAP.

---

**© 2025 FARMAP INDUSTRY S.r.l. - Tutti i diritti riservati**