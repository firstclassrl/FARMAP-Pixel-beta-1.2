# Istruzioni per aggiungere la colonna product_name

## Problema
La richiesta campioni non si salva con l'errore:
```
Could not find the 'product_name' column of 'sample_request_items' in the schema cache
```

## Soluzione
Eseguire lo script SQL per aggiungere la colonna mancante.

## Passi da seguire:

1. **Aprire Supabase Dashboard**
   - Vai su https://supabase.com/dashboard
   - Seleziona il progetto FARMAP

2. **Aprire SQL Editor**
   - Clicca su "SQL Editor" nel menu laterale
   - Clicca su "New query"

3. **Eseguire lo script**
   - Copia e incolla il contenuto del file `ADD_PRODUCT_NAME_TO_SAMPLE_REQUEST_ITEMS.sql`
   - Clicca su "Run" per eseguire lo script

4. **Verificare il risultato**
   - Lo script dovrebbe mostrare la nuova colonna nella tabella
   - La colonna `product_name` dovrebbe essere di tipo `character varying(255)`

## Risultato atteso
Dopo l'esecuzione dello script, la richiesta campioni dovrebbe funzionare correttamente e salvare i prodotti inseriti manualmente.

## Note
- La colonna `product_name` sostituisce il riferimento a `product_id` per i prodotti inseriti manualmente
- I dati esistenti non vengono modificati
- La colonna è nullable, quindi può essere vuota per richieste senza prodotti
