# Problema: Ruolo non aggiornato dopo il cambio

## Problema

Quando cambi il ruolo di un utente nel database (es. da "sales" a "lab"), l'utente continua a vedere il vecchio ruolo quando fa login.

## Causa

Il profilo utente viene caricato solo:
1. All'avvio dell'applicazione
2. Quando si fa login

Non viene ricaricato automaticamente quando viene modificato nel database da un altro utente (es. un admin).

## Soluzione

### Soluzione Immediata (per l'utente modificato)

**L'utente deve fare logout e login di nuovo** per vedere il nuovo ruolo.

### Soluzione Permanente (per gli sviluppatori)

Ho aggiunto:

1. ✅ **Funzione `refreshProfile()` nell'hook `useAuth`** - Permette di forzare il ricaricamento del profilo
2. ✅ **Messaggio migliorato** - Quando un admin cambia il ruolo di un utente, viene mostrato un messaggio che informa che l'utente deve fare logout/login

### Verifica che il ruolo sia stato cambiato correttamente

Esegui questa query nel database per verificare:

```sql
SELECT id, email, full_name, role 
FROM profiles 
WHERE email = 'email_utente@example.com';
```

Se il ruolo è corretto nel database ma l'utente vede ancora il vecchio ruolo, significa che deve fare logout/login.

## Test

1. Cambia il ruolo di un utente dalla pagina Gestione Utenti
2. Verifica nel database che il ruolo sia stato aggiornato
3. **L'utente modificato deve fare logout e login**
4. Verifica che il nuovo ruolo sia attivo

## Note

- Il problema non è nel database (il ruolo è corretto)
- Il problema è nella cache/sessione dell'applicazione
- Il logout/login risolve sempre il problema
- In futuro si potrebbe aggiungere un listener Supabase Realtime per aggiornare automaticamente il profilo quando viene modificato


