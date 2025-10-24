# ISTRUZIONI URGENTI - Fix Richiesta Campioni

## PROBLEMA
La richiesta campioni non funziona con questi errori:
- `column sample_request_items_1.product_name does not exist`
- `Could not find the 'product_name' column of 'sample_request_items' in the schema cache`

## SOLUZIONE IMMEDIATA

### Passo 1: Aprire Supabase Dashboard
1. Vai su https://supabase.com/dashboard
2. Seleziona il progetto FARMAP
3. Clicca su "SQL Editor" nel menu laterale
4. Clicca su "New query"

### Passo 2: Eseguire lo Script
1. Copia e incolla TUTTO il contenuto del file `FIX_SAMPLE_REQUEST_ITEMS.sql`
2. Clicca su "Run" per eseguire lo script
3. Lo script mostrerà:
   - La struttura attuale della tabella
   - Se la colonna esiste già
   - Il risultato dell'operazione

### Passo 3: Verificare il Risultato
Lo script dovrebbe mostrare:
```
NOTICE: Colonna product_name aggiunta con successo
```

E nella verifica finale dovresti vedere:
```
product_name | character varying | YES | null
```

## ALTERNATIVA SE LO SCRIPT NON FUNZIONA

Se lo script principale non funziona, prova questo comando semplice:

```sql
ALTER TABLE sample_request_items ADD COLUMN product_name VARCHAR(255);
```

## VERIFICA FINALE
Dopo l'esecuzione:
1. Ricarica la pagina della richiesta campioni
2. Prova a creare una nuova richiesta
3. Dovrebbe funzionare senza errori

## NOTE IMPORTANTI
- La colonna `product_name` è nullable (può essere vuota)
- Non modifica i dati esistenti
- È necessaria per il salvataggio dei prodotti inseriti manualmente

## SUPPORTO
Se continui ad avere problemi, controlla:
1. Che lo script sia stato eseguito completamente
2. Che non ci siano errori nella console del browser
3. Che la tabella `sample_request_items` esista nel database
