# Import massivo foto prodotti

Questo script carica foto da una cartella locale nel bucket Supabase `product-photos`, genera due versioni (main.webp e thumb.webp) e aggiorna la tabella `products`.

## Requisiti
- Node 18+
- Dipendenze già in `package.json`: `@supabase/supabase-js`, `sharp`, `fast-glob`, `p-limit`
## Rigenerare tutte le thumbnail

Se hai già caricato molte foto nel bucket `product-photos` e vuoi ricreare tutte le `thumb.webp` con le impostazioni standard (200px max, qualità 0.7), usa lo script:

```bash
# Assicurati di avere SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nel tuo .env
node scripts/regenerate-thumbs.mjs
```

Lo script:
1. Legge la tabella `products` e recupera `id`, `code`, `photo_url`.
2. Scarica la foto principale (`product-photos/<id>/main.webp` o fallback a `photo_url`).
3. Genera la thumbnail con `sharp`.
4. Sovrascrive `product-photos/<id>/thumb.webp` e aggiorna `photo_thumb_url` nel database.

Il log finale riporta quante thumbnail sono state rigenerate e quali prodotti eventualmente sono falliti (ad esempio perché non avevano una foto sorgente).
- Variabili ambiente:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (consigliato) oppure `VITE_SUPABASE_ANON_KEY`

## Comandi

```bash
# Dry-run: nessun upload, solo report dei match
PHOTOS_DIR="/percorso/cartella/immagini" npm run upload:photos -- --dry-run

# Esecuzione reale con aggiornamento DB
PHOTOS_DIR="/percorso/cartella/immagini" npm run upload:photos

# Opzioni
# --bucket product-photos           cambia bucket
# --filter EN04                     processa solo file che iniziano con EN04
# --concurrency 6                   numero upload paralleli (default 4)
# --thumb-field                     aggiorna anche products.photo_thumb_url
```

## Struttura nel bucket
- `product-photos/{product_id}/main.webp`
- `product-photos/{product_id}/thumb.webp`

## Report
Alla fine viene generato un CSV in `reports/` con l’esito per ogni file.

## Nota
Se vuoi salvare anche l’URL della miniatura:
- esegui `ADD_PHOTO_THUMB_URL.sql` nel tuo progetto Supabase.


