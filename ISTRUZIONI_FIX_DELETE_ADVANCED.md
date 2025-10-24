# ISTRUZIONI URGENTI - Fix Avanzato Eliminazione Richieste Campioni

## Problema Persistente
Le richieste campioni non si eliminano nonostante l'esecuzione del primo script.

## Soluzione Avanzata

### Passo 1: Aprire Supabase Dashboard
1. Vai su https://supabase.com/dashboard
2. Seleziona il progetto FARMAP
3. Clicca su "SQL Editor" nel menu laterale
4. Clicca su "New query"

### Passo 2: Eseguire lo Script Avanzato
1. Copia e incolla TUTTO il contenuto del file `FIX_DELETE_CAMPIONI_ADVANCED.sql`
2. Clicca su "Run" per eseguire lo script
3. Lo script mostrerà:
   - Stato RLS delle tabelle
   - Policy esistenti
   - Ruolo utente corrente
   - Risultato delle operazioni

### Passo 3: Interpretare i Risultati
Lo script dovrebbe mostrare:
```
sample_requests | rowsecurity: true
sample_request_items | rowsecurity: true
```

E nelle policy finali:
```
sample_requests | Allow delete sample requests | DELETE
sample_request_items | Allow delete sample request items | DELETE
```

## Cosa fa lo script avanzato
1. **Diagnostica completa**: Verifica stato RLS e policy esistenti
2. **Disabilita RLS temporaneamente**: Per pulire policy problematiche
3. **Rimuove tutte le policy**: Elimina policy che potrebbero causare conflitti
4. **Riabilita RLS**: Riapplica la sicurezza
5. **Crea policy permissive**: Permette tutte le operazioni
6. **Verifica finale**: Mostra lo stato finale

## Policy Create
- **sample_requests**: Policy permissive per tutte le operazioni
- **sample_request_items**: Policy permissive per tutte le operazioni
- **DELETE specifico**: Policy dedicate per eliminazione

## Verifica Finale
Dopo l'esecuzione:
1. Ricarica la pagina delle richieste campioni
2. Prova a eliminare una richiesta
3. Dovrebbe funzionare senza errori

## Se ancora non funziona

### Alternativa 1: Disabilita RLS completamente
```sql
ALTER TABLE sample_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE sample_request_items DISABLE ROW LEVEL SECURITY;
```

### Alternativa 2: Verifica errori specifici
Controlla la console del browser per errori specifici durante l'eliminazione.

### Alternativa 3: Test diretto nel database
```sql
-- Sostituisci 'your-request-id' con un ID reale
DELETE FROM sample_request_items WHERE sample_request_id = 'your-request-id';
DELETE FROM sample_requests WHERE id = 'your-request-id';
```

## Note Importanti
- Lo script è più aggressivo del precedente
- Le policy sono permissive (permettono tutto)
- Se funziona, possiamo rendere le policy più restrittive dopo
- Mantieni traccia degli errori per debugging

## Supporto
Se continui ad avere problemi:
1. Esegui lo script avanzato
2. Copia e incolla TUTTI i risultati
3. Controlla la console del browser per errori JavaScript
4. Verifica che l'utente sia autenticato correttamente
