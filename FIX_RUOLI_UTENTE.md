# Fix: Problema cambio ruolo utente

## Problema

Non è possibile cambiare il ruolo di un utente a "lab" (o altri ruoli come "production", "sales", "customer_user") perché questi valori non sono presenti nell'enum `user_role` del database PostgreSQL.

Anche cambiando manualmente il ruolo nella tabella `profiles` non funziona perché PostgreSQL rifiuta valori che non appartengono all'enum.

## Causa

I ruoli sono definiti nel codice TypeScript, ma l'enum PostgreSQL nel database non è stato aggiornato per includere tutti i ruoli. L'enum attualmente contiene solo:
- `admin`
- `commerciale`
- `label_user`
- `lettore`

Mancano invece:
- `lab` (Laboratorio)
- `production` (Produzione)
- `sales` (Vendite)
- `customer_user` (Cliente)

## Soluzione

Eseguire lo script SQL `ADD_MISSING_ROLES.sql` per aggiungere tutti i ruoli mancanti all'enum `user_role`.

### Come eseguire lo script

#### Opzione 1: Tramite Supabase Dashboard (Consigliato)

1. Accedi al progetto Supabase: https://app.supabase.com
2. Seleziona il tuo progetto
3. Vai su **SQL Editor** nella barra laterale
4. Clicca su **New query**
5. Copia e incolla il contenuto del file `ADD_MISSING_ROLES.sql`
6. Clicca su **Run** (o premi `Ctrl/Cmd + Enter`)
7. Verifica i messaggi nella console per confermare che i ruoli sono stati aggiunti

#### Opzione 2: Tramite psql

```bash
psql -h [HOST] -U postgres -d postgres -f ADD_MISSING_ROLES.sql
```

Sostituisci `[HOST]` con l'host del tuo database Supabase.

#### Opzione 3: Tramite Supabase CLI

```bash
supabase db reset  # Solo per sviluppo locale
# oppure
psql $(supabase db url) -f ADD_MISSING_ROLES.sql
```

### Verifica

Dopo aver eseguito lo script, verifica che i ruoli siano stati aggiunti:

```sql
SELECT enumlabel, enumsortorder
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;
```

Dovresti vedere tutti i ruoli elencati, inclusi `lab`, `production`, `sales`, e `customer_user`.

### Test

1. Prova a cambiare il ruolo di un utente dalla pagina **Gestione Utenti**
2. Seleziona il ruolo "Lab" (o altri ruoli) dal menu a tendina
3. Salva le modifiche
4. Verifica che il cambio sia andato a buon fine

## Note importanti

- Lo script è **idempotente**: può essere eseguito più volte senza problemi
- Lo script verifica se ogni ruolo esiste già prima di aggiungerlo
- **Non** modifica dati esistenti, aggiunge solo nuovi valori all'enum
- È sicuro eseguirlo anche se alcuni ruoli sono già presenti

## Script correlati

- `ADD_LAB_ROLE_AND_POLICIES.sql` - Aggiunge il ruolo `lab` e configura le policy RLS per le tabelle LAB (include anche l'aggiunta del ruolo `lab`, ma lo script `ADD_MISSING_ROLES.sql` è più completo)

## Dopo aver risolto

Una volta aggiunti i ruoli, puoi:

1. Assegnare il ruolo "Lab" agli utenti dalla pagina Gestione Utenti
2. Gli utenti con ruolo "Lab" avranno accesso alla sezione `/lab`
3. Verificare che le policy RLS siano configurate correttamente (vedi `ADD_LAB_ROLE_AND_POLICIES.sql`)

## Supporto

In caso di problemi:

1. Controlla i log di Supabase per eventuali errori
2. Verifica che l'enum `user_role` esista nel database
3. Assicurati di avere i permessi necessari per modificare gli enum (richiede privilegi di superuser o ownership del tipo)

