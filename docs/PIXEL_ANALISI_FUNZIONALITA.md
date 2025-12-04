# Pixel CRM – Analisi funzionalità implementate (agg. 24/11/2025)

Documento riepilogativo che fotografa tutte le capability presenti oggi nel branch `pixel-beta 1.1.0 / v1.2.0`, con riferimenti puntuali a codice, automazioni Supabase ed asset di deploy.

---

## 1. Stack, infrastruttura e distribuzione
- **Frontend**: React 18 + TypeScript + Vite, UI Tailwind + Radix, icone Lucide, stato globale via Zustand (`src/store`), validazioni form con React Hook Form + Zod (`src/components/...Modal.tsx`).
- **Backend**: Supabase (auth, Postgres, storage, Edge Functions) con bucket `product-photos` e `sample-photos`, policy RLS dettagliate nei file `CONFIGURA_*` e `FIX_*`.
- **Servizi esterni**:
  - Generatore PDF basato su Puppeteer (`server/pdf-generator/server.js`) con endpoint `/api/generate-price-list-pdf` e health check `/health`.
  - Edge Functions per gestione utenti e automazioni immagini (`supabase/functions/*`).
- **Distribuzione**: configurazioni già pronte per Render (`render.yaml` + `deploy.sh`), Railway (`RAILWAY_DEPLOY.md`), Netlify (`netlify.toml`) e Vercel (`vercel.json`). Supporto PWA via `vite.config.ts` + `vite-plugin-pwa`.

## 2. Routing, autenticazione e ruoli
- Il router (`src/App.tsx`) espone percorsi dedicati per login/forgot/reset, Garden pubblico e le viste applicative protette. Gli utenti non autenticati vengono reindirizzati al login; i ruoli `production` vengono confinati alle route Garden.
- `ProtectedRoute` controlla i permessi granulari (es. la pagina `UserManagement` è limitata agli admin).
- Ruoli supportati: `admin`, `commerciale`, `sales`, `lettore`, `production`, `customer_user`. I profili sono sincronizzati con Supabase Auth tramite script SQL (`SYNC_AUTH_USERS_TO_PROFILES.sql`) e funzioni (`create-user`, `update-user`, ecc.).

## 3. Dashboard e navigazione contestuale
- La dashboard (`src/pages/Dashboard.tsx`) mostra saluto personalizzato + card di quick actions filtrate per ruolo e la card “Daily Appointments” che consuma lo store del calendario.
- Componenti layout (`src/components/layout/*`) gestiscono sidebar responsiva, header con stato utente e indicatori notifiche.

## 4. Gestione Clienti
- Lista card compatta con ricerca live, badge codice cliente, contatti principali e stati attivi/inattivi (`CustomersPage.tsx`).
- Modale CRUD completa con validazione codice cliente univoco, gestione termini di pagamento testuali e lock eliminazione quando esistono ordini collegati.
- Import massivo CSV tramite `ImportCustomersModal` (template scaricabile, preview, validazioni, batch insert). Export disponibile da UI.

## 5. Gestione Prodotti
- Catalogo con vista griglia/lista, infinite scroll (60 record batch), contatori “Mostrati n su totale”, badge foto/attivi e CTA Garden (`ProductsPage.tsx`).
- Filtri avanzati: prefisso codice manuale o derivato da cliente, categoria dinamica, cliente associato, presenza foto, ricerca full-text multi-colonna. Integrata gestione categorie (crea/rename/delete singola, wipe totale con reassignment).
- Modale `ProductFormModal` copre tutti i campi logistici/commerciali, upload su Supabase Storage con compressione (`lib/imageUtils`), preferenza `photo_thumb_url` e preview.
- Export multi-formato (Excel/CSV) con colonne formattate da `lib/exportUtils`.

## 6. Listini prezzi
- Pagina `PriceListsPage` mostra KPI personali (totale, attivi, bozze, sconto medio), filtri per creatore, ricerca e stato derivato dalla validità.
- Modale dettaglio (`PriceListDetailPage`) per creare/editare righe listino, includendo duplicazione, archiviazione soft (`is_active`) e sincronizzazione clienti-listino.
- `BulkPriceListModal` abilita copy massivo; `PriceListPrintView` fornisce anteprima/stampa ottimizzata, collegata al servizio PDF.
- Trigger rapidi per invio mail/stampa, più logiche di refresh post-azioni.

## 7. Ordini
- `OrdersPage` offre tabella/card responsive con badge stato (pending/confirmed/processing/shipped/delivered/cancelled), importi formattati e azioni contestuali.
- Modali dedicate:
  - `OrderFormModal` per creare/modificare ordini con selezione prodotti e calcolo totali.
  - `CreateOrderFromPriceListModal` per generare ordini partendo da un listino.
  - `ExportOrdersModal` per export CSV filtrato.
- Soft cancel con dialog di conferma, notifiche centralizzate e refresh automatico.

## 8. Campionature (Sample Requests)
- Tabella principale con filtri stato, ricerca, preview foto e timeline items (`SampleRequestsPage.tsx`).
- Modale creazione: selezione cliente via `CustomerSelectionModal`, fino a 10 prodotti, upload foto compressa e thumbnail (200 px) tramite `imageUtils` con storage `sample-photos`.
- CRUD completo degli item (update, delete), dialog conferme e avvisi sugli errori upload. Stato disponibile: pending, sent, delivered, cancelled.
- Script SQL dedicati a bucket/RLS (`CONFIGURA_RLS_SAMPLE_PHOTOS.sql`) per garantire sicurezza storage.

## 9. Calendario commerciale
- Store `useAppointmentsStore` gestisce fetch/add/update/delete appuntamenti, filtri per data/oggi e normalizzazione ID cliente.
- `CalendarPage` espone viste giorno/settimana/mese, badge per tipologia (appointment/call/reminder) e status (scheduled/completed/cancelled/rescheduled), oltre a modale `AppointmentModal` per CRUD completo con reminder minuti.
- Dashboard integra card daily con indicatori dello store.

## 10. Garden Experience
- Percorso `/garden` ottimizzato per tablet/produzione: gradient animati, card prodotto semplificate, filtri rapidi (categoria, foto, ricerca) e CTA PDF/dettagli (`GardenPage`, `GardenProductCard`).
- Login separato `/garden/login` e route-protection dedicata (produzione reindirizzata sempre a Garden).
- Dati caricati da viste SQL per ruolo (`view_products_commercial`, `view_products_production`, `view_products_customer`) per garantire least-privilege.

## 11. Report & Analytics
- `ReportsPage` mostra KPI cards (clienti, ordini, fatturato, conversioni), grafici Recharts (trend vendite 6 mesi, distribuzione stato ordini, top prodotti) e filtri intervallo 7/30/90/365 giorni.
- Calcoli lato client usando query Supabase aggregate + normalizzazioni (es. `orderUtils`).
- CTA export placeholders con notifiche informative per feature future.

## 12. Notifiche e ricerca globale
- Store centrale (`useStore`) gestisce queue notifiche (success/error/warning/info), cronologia, bulk mark-as-read, e preferenze UI persistite in `localStorage`.
- `NotificationsPage` mostra lista filtrabile, con azioni per leggere/cancellare e timeline relative.
- Hook `useSmartSearch` implementa ricerca trasversale (clienti, prodotti, ordini, listini, campionature) con ranking di rilevanza, debounce e navigazione automatica.

## 13. Gestione utenti
- `UserManagementPage` consente:
  - Creazione utente (signup Supabase, fallback profilo-only se signups disabilitati).
  - Validazione ruoli e prevenzione auto-downgrade admin.
  - Modifica ruolo/nome con controlli, delete con check session e feedback su errori RLS/colonne.
- Edge Functions `create-user`, `create-user-simple`, `update-user`, `delete-user`, `get-users` forniscono alternativa amministrata via chiave service-role.

## 14. Import/Export e strumenti operativi
- Modali dedicate per import clienti/prodotti (`ImportCustomersModal`, `ImportProductsModal`) con template CSV, preview errori e batch insert resilienti.
- Export prodotti multi-formato, export ordini e listini via modali, generazione PDF tramite servizio Node.
- Script CLI in `scripts/*.mjs` (es. `upload-product-photos.mjs`) e doc `README-bulk-photos.md` per upload massivo immagini.

## 15. Storage, media e automazioni
- Bucket `product-photos` e `sample-photos` configurati con policy RLS e script SQL di supporto (`CONFIGURA_BUCKET_*`, `RLS_CHECKLIST.md`).
- Edge Function `product-photo-thumb` crea thumbnail 150×150 jpg (quality 70%), salva in `thumbs/`, rende pubblico e aggiorna `products.photo_thumb_url`. Frontend preferisce `photo_thumb_url` con fallback alla foto originale (PriceListPrintView, Garden, Products).
- Funzioni helper `imageUtils` gestiscono compressione client-side per upload campionature.

## 16. Deploy, monitoraggio e script di supporto
- `deploy.sh`, `DEPLOY_RAILWAY_SIMPLE.md`, `DEPLOY_PDF_SERVICE.md`, `FIX_RENDER_*` descrivono procedure di rollout, fix per root directory e PDF service.
- Documenti `DEBUG_*`, `ISTRUZIONI_*`, `URGENT_*` conservano knowledge base di bugfix rapidi e procedure operative (es. debug listini, fix ruoli, aggiornamento campi prodotto).
- Log `pdf-generator.log` per troubleshooting generatore PDF.

## 17. Documentazione & governance
- `CHANGELOG.md` e `docs/PIXEL_FEATURES.md` mantengono cronologia feature, mentre questo file funge da fotografia aggiornata.
- Ampia collezione di script SQL/memo (`ADD_*`, `FIX_*`, `MODIFICHE_*`) consente di replicare setup database, RLS e migrazioni.
- `README.md` spiega setup locale, script npm, struttura cartelle e variabili ambiente (incluso `VITE_PDF_GENERATOR_URL`).

---

### Copertura funzionale attuale
Il perimetro copre l’intero ciclo commerciale FARMAP: anagrafiche clienti/prodotti, listini, ordini, campionature, calendario, reportistica, notifiche, gestione utenti, esperienza Garden dedicata, automazioni media e pipeline di deploy multi-provider. Ogni area è accompagnata da moduli UI, store Zustand, funzioni Supabase o script SQL/documentazione per garantire replicabilità e manutenzione.









