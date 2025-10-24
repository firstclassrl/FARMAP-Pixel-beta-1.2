# Istruzioni per correggere eliminazione richieste campioni

## Problema
Le richieste campioni non si eliminano, probabilmente a causa di policy RLS (Row Level Security) mancanti o errate.

## Soluzione

### Passo 1: Aprire Supabase Dashboard
1. Vai su https://supabase.com/dashboard
2. Seleziona il progetto FARMAP
3. Clicca su "SQL Editor" nel menu laterale
4. Clicca su "New query"

### Passo 2: Eseguire lo Script
1. Copia e incolla TUTTO il contenuto del file `FIX_SAMPLE_REQUESTS_DELETE.sql`
2. Clicca su "Run" per eseguire lo script
3. Lo script mostrerà:
   - Le policy attuali per sample_requests
   - Le policy attuali per sample_request_items
   - Le nuove policy create per l'eliminazione

### Passo 3: Verificare il Risultato
Lo script dovrebbe mostrare le nuove policy:
```
sample_requests | Users can delete sample requests | DELETE
sample_request_items | Users can delete sample request items | DELETE
```

## Cosa fa lo script
1. **Verifica policy esistenti**: Mostra le policy attuali per entrambe le tabelle
2. **Rimuove policy problematiche**: Elimina policy che potrebbero causare conflitti
3. **Crea policy per eliminazione**: Aggiunge policy specifiche per DELETE
4. **Verifica finale**: Mostra tutte le policy attive

## Policy create
- **sample_requests**: Permette eliminazione solo agli utenti con ruolo 'admin' o 'commerciale'
- **sample_request_items**: Permette eliminazione solo agli utenti con ruolo 'admin' o 'commerciale'

## Verifica finale
Dopo l'esecuzione:
1. Ricarica la pagina delle richieste campioni
2. Prova a eliminare una richiesta
3. Dovrebbe funzionare senza errori

## Note importanti
- Le policy sono basate sui ruoli utente
- Solo admin e commerciale possono eliminare
- Le policy si applicano automaticamente a tutti gli utenti

## Supporto
Se continui ad avere problemi:
1. Verifica che lo script sia stato eseguito completamente
2. Controlla che il tuo utente abbia il ruolo corretto
3. Verifica che non ci siano errori nella console del browser
