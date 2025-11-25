# LAB – Guida operativa

Questa guida descrive come abilitare la nuova area **LAB** (materie prime, ricette, campionature) e come mantenerla operativa in produzione.

## 1. Script e migrazioni

1. **Ruolo e policies**
   - Esegui `ADD_LAB_ROLE_AND_POLICIES.sql` per aggiungere il valore `lab` all'enum `user_role`.
   - Lo stesso script abilita le policy RLS su tutte le tabelle LAB. Può essere rieseguito in sicurezza: se le tabelle non esistono ancora, viene mostrato un semplice `NOTICE`.

2. **Schema LAB**
   - Esegui `ADD_LAB_TABLES.sql` per creare:
     - `lab_raw_materials`
     - `lab_recipes`
     - `lab_recipe_ingredients`
     - `lab_samples`
     - `lab_recipe_costs_view`
   - Lo script abilita `pgcrypto`, crea l'enum `lab_sample_status` e configura gli indici principali.

> **Nota**: i due script sono indipendenti, ma è consigliato applicarli nell'ordine sopra indicato.

## 2. Abilitare gli utenti LAB

1. Apri la pagina `Gestione Utenti` e crea o aggiorna un account assegnando il ruolo `lab`.
2. Gli utenti con ruolo `lab` hanno accesso alla sezione `/lab` e alla dashboard, ma non alle altre aree commerciali/produzione.
3. Gli admin vedono la stessa sezione e possono configurare tutto.

## 3. Funzionalità principali

### Materie prime
- Anagrafica completa (fornitore, costi, note di sicurezza, stock).
- Modale CRUD con validazione e alert su scorte minime (visibile nella tab Insights).

### Ricette
- Lista ricette con versioning rapido (duplica versione +1).
- Editor ingredienti con calcolo automatico quantitativi/costi in base al batch.
- Generazione scheda produzione (`Scheda produzione`) pronta per la stampa/futuro PDF.

### Campionature
- Lista campionature con filtri stato/ricerca, gestione status inline e priorità.
- Modale per creare o modificare richieste conto terzi con selezione ricetta e cliente.

### Insights
- Alert stock, campionature ad alta priorità, ultime ricette aggiornate.

## 4. Workflow suggerito

1. **Import iniziale**: popola `lab_raw_materials` (via UI o CSV) con i costi reali.
2. **Ricette**: crea la prima ricetta, aggiungi ingredienti legandoli alle materie prime.
3. **Scheda produzione**: usa la scheda generata per condividere il batch con la produzione.
4. **Campionature**: per richieste conto terzi, crea una campionatura collegando ricetta e cliente e monitora lo stato.

## 5. Estensioni consigliate

- Aggiungere allegati PDF alle ricette/campionature (colonne `attachments` già pronte).
- Esportare la scheda produzione in PDF usando i componenti di stampa già presenti nel progetto.
- Automatizzare notifiche quando lo stock di una materia scende sotto soglia (`Insights` mette in evidenza gli alert già oggi).

## 6. Test rapidi

- Login con admin → accesso `/lab` → verifica tab Materie Prime.
- Creazione nuova materia prima → appare in lista e nella tab Ricette come opzione.
- Creazione ricetta + salvataggio ingredienti → scheda produzione mostra i dati corretti.
- Creazione campionatura → filtro per stato aggiorna i risultati.

In caso di problemi, consulta il log del browser (la pagina gestisce errori tramite le notifiche globali) oppure verifica le policy RLS eseguendo di nuovo `ADD_LAB_ROLE_AND_POLICIES.sql`.

