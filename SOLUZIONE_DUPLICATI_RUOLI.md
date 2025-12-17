# Soluzione: Ruoli Duplicati nel Database

## Problema Identificato

Esistono **DUE posti** dove sono definiti i ruoli, causando confusione:

1. ❌ **Tabella `roles`** - Tabella separata (RIDONDANTE, non usata)
2. ✅ **Enum `user_role`** - Enum PostgreSQL (FONTE CORRETTA, usata dall'applicazione)

## Da Dove Vengono Lettti i Ruoli?

L'applicazione legge i ruoli **SOLO** dall'enum `user_role` PostgreSQL tramite:
- La colonna `profiles.role` che è di tipo `user_role` enum
- I valori validi sono definiti nell'enum PostgreSQL stesso

La tabella `roles` **NON** viene mai usata dall'applicazione.

## Soluzione

### Passo 1: Verifica la Situazione

Esegui lo script **`VERIFICA_E_PULISCI_RUOLI.sql`** che ti mostrerà:
- Se esiste la tabella `roles`
- I valori nell'enum `user_role` (quelli corretti)
- Come vengono usati i ruoli nell'applicazione

### Passo 2: Rimuovi la Tabella Ridondante

Se la tabella `roles` esiste e non contiene dati importanti:

1. Esegui lo script **`RIMUOVI_TABELLA_ROLES.sql`** 
2. Questo rimuoverà:
   - Le policy RLS sulla tabella `roles`
   - La tabella `roles` stessa

⚠️ **Nota**: Lo script è sicuro perché la tabella non viene usata. Tuttavia, se preferisci, puoi prima verificare il contenuto con:
```sql
SELECT * FROM roles;
```

### Passo 3: Verifica che Tutto Funzioni

Dopo la rimozione, verifica che:

1. ✅ I ruoli funzionano ancora (l'applicazione usa l'enum, non la tabella)
2. ✅ Puoi cambiare i ruoli degli utenti dalla pagina Gestione Utenti
3. ✅ Gli utenti possono accedere alle sezioni appropriate

## Struttura Corretta (Dopo la Pulizia)

```
┌─────────────────────────────────────┐
│ Enum PostgreSQL: user_role          │
│ - admin                              │
│ - commerciale                        │
│ - lettore                            │
│ - production                         │
│ - sales                              │
│ - customer_user                      │
│ - lab                                │
└─────────────────────────────────────┘
           │
           │ (usato da)
           ▼
┌─────────────────────────────────────┐
│ Tabella: profiles                   │
│ Colonna: role (tipo: user_role)     │
└─────────────────────────────────────┘
           │
           │ (letto da)
           ▼
┌─────────────────────────────────────┐
│ Applicazione TypeScript             │
│ src/types/roles.ts                  │
└─────────────────────────────────────┘
```

## File Modificati

1. ✅ **`ENABLE_RLS_SECURITY.sql`** - Rimossa sezione sulla tabella `roles`
2. ✅ **`VERIFICA_E_PULISCI_RUOLI.sql`** - Script di verifica
3. ✅ **`RIMUOVI_TABELLA_ROLES.sql`** - Script di rimozione

## Risultato Finale

Dopo aver eseguito gli script:

- ✅ **Unica fonte di verità**: solo l'enum `user_role`
- ✅ **Nessuna confusione**: niente più duplicati
- ✅ **Funzionalità intatte**: tutto continua a funzionare normalmente
- ✅ **Codice pulito**: riferimento alla tabella `roles` rimosso

## Ordine di Esecuzione Consigliato

1. **`VERIFICA_E_PULISCI_RUOLI.sql`** - Verifica la situazione
2. **`RIMUOVI_TABELLA_ROLES.sql`** - Rimuove la tabella ridondante
3. Test dell'applicazione - Verifica che tutto funzioni

## Domande Frequenti

**Q: La rimozione della tabella `roles` può causare problemi?**  
A: No. L'applicazione non usa mai quella tabella. I ruoli vengono gestiti dall'enum PostgreSQL.

**Q: Come aggiungo un nuovo ruolo in futuro?**  
A: Usa lo script `ADD_MISSING_ROLES.sql` o aggiungi il valore direttamente all'enum:
```sql
ALTER TYPE user_role ADD VALUE 'nuovo_ruolo';
```

**Q: Dove vengono validati i ruoli nell'applicazione?**  
A: In `src/types/roles.ts` (costante TypeScript) e nell'enum PostgreSQL (validazione database).





