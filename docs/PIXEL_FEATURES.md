# Pixel – Feature Overview (v1.2.0)

Documento informativo che riepiloga in modo approfondito tutte le funzionalità oggi implementate in Pixel CRM per FARMAP.

## 1. Panoramica rapida
- **Dominio**: CRM commerciale end-to-end (clienti, prodotti, listini, ordini, campionature, calendario, report, ruoli).
- **Stato**: Versione 1.2.0 con modulo calendario completo e dashboard giornaliera integrata.
- **Obiettivi chiave**: Digitalizzare processi sales/production, assicurare tracciabilità, supportare produzioni “Garden”, alleggerire PDF/listini tramite automazioni e storage dedicati.

## 2. Stack & infrastruttura
- **Frontend**: React 18 + TypeScript + Vite, UI Tailwind/Radix, Zustand per stato globale, React Hook Form + Zod per i form.
- **Backend-as-a-Service**: Supabase (Auth, PostgreSQL, Storage, Edge Functions) + bucket dedicati (`product-photos`, `sample-photos`).
- **Servizi ausiliari**: Node/Puppeteer PDF generator (deployabile su Render/Railway), Edge Functions per gestione utenti e automazioni immagini.
- **Distribuzione**: Config pronta per Render, Railway, Netlify/Vercel (vite + vercel.json + render.yaml); supporto PWA via `vite-plugin-pwa`.

## 3. Autenticazione, ruoli e routing
- Supabase Auth con profili e ruoli `admin`, `commerciale`, `sales`, `lettore`, `production`, `customer_user`.
- Routing condizionale (`App.tsx`): accesso Garden sempre attivo, produzione limitata alla sola vista Garden, `ProtectedRoute` per pagine amministrative, fallback a login con boot spinner accorciato.

## 4. Dashboard & navigazione
- Dashboard card-based con quick actions filtrate per ruolo e card “Daily Appointments” che richiama lo store del calendario.
- Messaggistica personalizzata (“Buongiorno, Nome”) e fallback per ruoli senza permessi.

## 5. Gestione Clienti
- Lista card compatta con ricerca live, badge codice cliente e contatti principali.
- Modale CRUD completa: validazione codice cliente univoco, prefissi automatici, termini di pagamento alfanumerici, note estese.
- Blocco cancellazione se esistono ordini collegati, dialog di conferma e notifiche contestuali.
- Refresh manuale e import massivo via CSV (modale dedicata con template, preview, validazioni e batch insert).

## 6. Gestione Prodotti
- Catalogo con vista griglia/lista, infinite scroll a blocchi da 60 record, badge foto (thumbnail preferita), stato attivo/inattivo.
- Filtri avanzati (prefisso codice manuale o derivato dal cliente, categoria, cliente, presenza foto, ricerca full-text su più colonne).
- Gestione categorie integrata (crea, elimina singola o totale con reassignment), export Excel/CSV personalizzabile e action Garden shortcut.
- Modale prodotto con gestione completa di campi logistici/commerciali, preview immagini e upload tramite `FileUploadZone`.

## 7. Listini prezzi
- Lista con KPI personali (totale, attivi, bozze, sconto medio), filtri per creatore, ricerca, stato calcolato via validità.
- Azioni: crea/modifica (modale `PriceListDetailPage`), anteprima immediata (`PriceListPrintView`), duplicazione con nuovo nome, archiviazione soft (toggle `is_active`), bulk copy tramite `BulkPriceListModal`, invio mail/print ready.
- Sincronizzazione clienti-listini e componenti condivisi per stampa/preview (incluso supporto PDF esterno).

## 8. Ordini
- Lista card responsiva con badge stato (pending/confirmed/processing/shipped/delivered/cancelled), summary cliente, importi formattati.
- Filtri ricerca per numero/cliente e scope attivi/annullati.
- Modali: `OrderFormModal` per view/edit, `CreateOrderFromPriceListModal` per generazione rapida da listino, `ExportOrdersModal` per CSV.
- Soft cancel (update stato) con dialog di conferma, notifiche integrate e refresh automatico.

## 9. Campionature (Sample Requests)
- Tabella principale con filtri stato/ricerca, preview foto e dettaglio items.
- Modale creazione con selezione cliente (modal dedicata), fino a 10 prodotti, upload foto compressa + thumbnail via `imageUtils`.
- Upload su bucket `sample-photos` con path per richiesta, aggiornamento URL pubblico e possibilità di aggiornare/eliminare items.
- Dialog conferme (delete, stampa, upload sostitutivo) e timeline stato (pending, sent, delivered, cancelled).

## 10. Calendario commerciale
- Store Zustand (`useAppointmentsStore`) con fetch/init, add/update/delete, filtri, error handling.
- Vista giorno/settimana/mese con navigazione rapida, badge tipo (appuntamento, call, reminder), status (scheduled/completed/cancelled/rescheduled) e location/time details.
- Modale `AppointmentModal` per CRUD appuntamenti con associazione cliente, note e reminders.
- Card “Oggi” in dashboard e riquadri per timeline giornaliera.

## 11. Garden experience
- Landing full-screen ottimizzata per tablet/produzione con pattern grafici e gradient animati.
- Caricamento dati tramite viste SQL per ruolo (`view_products_commercial`, `view_products_production`, `view_products_customer`) con fallback alla tabella prodotti.
- Filtri rapidi (categoria, foto, ricerca free text) e card prodotto con CTA PDF/dettagli.
- Flusso login separato (`/garden/login`), logout dedicato e redirect automatico per utenti produzione.

## 12. Report & Analytics
- KPI cards (clienti, ordini, fatturato) con trend vs periodo precedente.
- Grafici Recharts: andamento vendite 6 mesi, distribuzione stato ordini (pie), top prodotti (bar + quantità).
- Filtri intervallo (7d, 30d, 90d, 1y) e call to action per export (placeholder con notifiche informative).
- Calcoli eseguiti lato client con query Supabase aggregate + riduzioni custom.

## 13. Notifiche
- Store globale con queue notifiche (success/error/warning/info), filtri per stato letto, bulk mark-as-read / clear.
- UI con card animate, cronologia relativa (`formatDistanceToNow`), action personalizzata opzionale e Dropdown per singola notifica.

## 14. Gestione utenti
- Pannello admin con tabella profili Supabase, creazione utente (signup + profilo fallback in caso di sign-up disabilitato), validazioni Zod.
- Modale modifica ruolo/nome con controlli (non auto-degradare l’admin corrente), delete con check session, e Edge Functions di supporto (`create-user`, `delete-user`, `update-user`, `get-users`).
- Feedback granulari su errori RLS/colonne e refresh automatico elenco utenti.

## 15. Import/Export e strumenti operativi
- Modali dedicate per import clienti/prodotti (CSV con template scaricabile, preview ed error reporting).
- Export prodotti multiplo (Excel/CSV con colonne formattate), export ordini da modale, export PDF listini tramite servizio Puppeteer.
- Script CLI e documentazione per upload bulk foto (`scripts/upload-product-photos.mjs`, `README-bulk-photos.md`).

## 16. Storage, media & PDF
- Bucket `product-photos` e `sample-photos` con policy RLS configurate (`CONFIGURA_BUCKET_*`).
- Preferenza centralizzata per thumbnail `photo_thumb_url` con fallback a foto originale (usato in `PriceListPrintView`, `ProductsPage`, Garden).
- Servizio `server/pdf-generator`: endpoint `/api/generate-price-list-pdf` che riceve JSON listino e restituisce PDF; health check `/health`, Procfile per deploy.

## 17. Supabase Edge Functions & automazioni
- `product-photo-thumb`: webhook storage che crea thumbnail 150×150 via Sharp, salva in `thumbs/`, rende pubblico l’oggetto e aggiorna `products.photo_thumb_url`.
- Funzioni auth (`create-user`, `create-user-simple`, `update-user`, `delete-user`, `get-users`) per amministrare utenti con service role e RLS rispettate.
- Script SQL numerosi per migrazioni (RLS, nuovi campi prodotti, bucket setup, RLS sample photos, sync utenti-profili, ecc.).

## 18. Altre pagine e utilities
- PriceListPrintView e ProductSheetsPage per layout di stampa/anteprima.
- Garden login specifico, Product detail sheet, Notifications, Reports, User management e modali riutilizzabili (`CustomerSelectionModal`, `OrderFormTemplate`, `ProductSelectionModal`, `FileUploadZone`).
- Librerie helper (`lib/exportUtils`, `lib/importUtils`, `lib/imageUtils`) e componenti UI Radix-based (AlertDialog, DropdownMenu, ecc.).

---

**Ultimo aggiornamento**: 24 Novembre 2025 – basato sul branch `pixel-beta 1.1.0 / v1.2.0`. Aggiornare questo documento ad ogni rilascio significativo.

