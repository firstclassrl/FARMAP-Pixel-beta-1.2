# Problema: Ruolo resettato a 'sales' dopo login

## Problema

Quando cambi il ruolo di un utente (es. da "sales" a "lab"), dopo il login il ruolo torna a "sales" anche nel database.

## Causa

Il trigger `on_auth_user_updated` nel file `SYNC_AUTH_USERS_TO_PROFILES.sql` sincronizza il ruolo da `auth.users.raw_user_meta_data` a `profiles.role`.

Quando l'utente fa login o quando viene aggiornato `auth.users`, il trigger:
1. Legge il ruolo da `auth.users.raw_user_meta_data->>'role'`
2. Sovrascrive `profiles.role` con quel valore

Se in `auth.users.raw_user_meta_data` c'è `role: 'sales'`, ogni login resetta il ruolo a "sales".

## Soluzione

### Opzione 1: Rimuovere il trigger (Consigliato)

Esegui questo SQL:

```sql
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
```

Questo rimuove il trigger che causa il problema. Il ruolo in `profiles` non verrà più sovrascritto.

### Opzione 2: Sincronizzare auth.users quando cambi il ruolo

Quando cambi il ruolo in `profiles`, aggiorna anche `auth.users.raw_user_meta_data`:

```sql
-- 1. Aggiorna profiles
UPDATE public.profiles
SET role = 'lab'::user_role
WHERE email = 'utente@example.com';

-- 2. Aggiorna anche auth.users
UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) 
  || jsonb_build_object('role', 'lab')
WHERE email = 'utente@example.com';
```

### Opzione 3: Sincronizzare tutti i ruoli esistenti

Esegui lo script `AGGIORNA_AUTH_USERS_RUOLO.sql` per sincronizzare tutti gli utenti esistenti.

## Verifica

Esegui per verificare che i ruoli siano sincronizzati:

```sql
SELECT 
  u.email,
  u.raw_user_meta_data->>'role' as auth_role,
  p.role as profile_role
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.raw_user_meta_data->>'role' != p.role::text;
```

Se questa query non restituisce risultati, tutto è sincronizzato.

## Script Utili

- `RISOLVI_PROBLEMA_SINCRONIZZAZIONE_RUOLO.sql` - Verifica e rimuove il trigger problematico
- `AGGIORNA_AUTH_USERS_RUOLO.sql` - Sincronizza tutti i ruoli esistenti
- `CAMBIARE_RUOLO_COMPLETO.sql` - Template per cambiare ruolo aggiornando entrambe le tabelle

## Raccomandazione

**Rimuovi il trigger `on_auth_user_updated`** perché:
1. Il ruolo dovrebbe essere gestito solo in `profiles.role`
2. `auth.users.raw_user_meta_data` è solo metadata, non la fonte di verità
3. Evita conflitti e problemi di sincronizzazione


