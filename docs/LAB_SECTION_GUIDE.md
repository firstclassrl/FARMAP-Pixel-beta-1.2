# LAB – Guida operativa

Questa guida descrive come abilitare la nuova area **LAB** (materie prime, ricette, campionature) e come mantenerla operativa in produzione.

## 1. Script e migrazioni

1. **Ruolo e policies**
   - Esegui `ADD_LAB_ROLE_AND_POLICIES.sql` per aggiungere il valore `lab` all'enum `user_role`.
   - Lo stesso script abilita le policy RLS su tutte le tabelle LAB. Può essere rieseguito in sicurezza: se le tabelle non esistono ancora, viene mostrato un semplice `NOTICE`.

2. **Schema LAB**
   - Esegui `ADD_LAB_TABLES.sql` per creare:
     - `lab_material_classes`
     - `lab_raw_materials`
     - `lab_recipes`
     - `lab_recipe_ingredients` (con il campo `phase`)
     - `lab_recipe_versions`
     - `lab_samples`
     - `lab_recipe_costs_view`
   - Lo script abilita `pgcrypto`, crea gli enum `lab_sample_status` e `lab_mix_phase` e configura gli indici principali.

> **Nota**: i due script sono indipendenti, ma è consigliato applicarli nell'ordine sopra indicato.

## 2. Abilitare gli utenti LAB

1. Apri la pagina `Gestione Utenti` e crea o aggiorna un account assegnando il ruolo `lab`.
2. Gli utenti con ruolo `lab` hanno accesso alla sezione `/lab` e alla dashboard, ma non alle altre aree commerciali/produzione.
3. Gli admin vedono la stessa sezione e possono configurare tutto.

## 3. Funzionalità principali

### Materie prime
- Anagrafica completa (fornitore, costi, note di sicurezza).
- Gestione classi dedicate con elenco, aggiunta ed eliminazione.
- Modale CRUD con selezione della classe e allegati SDS.

### Ricette
- Cronologia versioni con snapshot ingredienti e pulsanti “Nuova versione / Ripristina”.
- Editor ingredienti con calcolo automatico quantitativi/costi e fasi di miscelazione (Acqua, Olio, Polveri).
- Generazione scheda produzione (`Scheda produzione`) pronta per la stampa A4 e ordinata per fase.

### Campionature
- Lista campionature con filtri stato/ricerca, gestione status inline e priorità.
- Modale per creare o modificare richieste conto terzi con selezione ricetta e cliente.

### Insights
- Campionature ad alta priorità e ultime ricette aggiornate.

## 4. Workflow suggerito

1. **Classi + materie**: crea le classi necessarie e popola `lab_raw_materials` (via UI o CSV) con i costi reali.
2. **Ricette**: crea la prima ricetta, assegna gli ingredienti alla classe corretta e imposta la fase di miscelazione.
3. **Versioning**: quando concludi un lotto, salva una versione e incrementa il numero con il pulsante “Nuova versione”.
4. **Scheda produzione**: genera/stampa la scheda A4 (ordinata per fase) e condividila con la produzione.
5. **Campionature**: per richieste conto terzi, crea una campionatura collegando ricetta e cliente e monitora lo stato.

## 5. Estensioni consigliate

- Aggiungere allegati PDF alle ricette/campionature (colonne `attachments` già pronte).
- Esportare la scheda produzione in PDF usando i componenti di stampa già presenti nel progetto.
- Integrare notifiche per ricordare le campionature in prossima consegna.

## 6. Test rapidi

- Login con admin → accesso `/lab` → verifica tab Materie Prime e la gestione delle classi.
- Creazione nuova materia prima → assegnazione classe e apparizione nella tab Ricette come opzione.
- Creazione ricetta + salvataggio ingredienti/fasi → scheda produzione mostra i dati corretti e ordinati.
- Salvataggio nuova versione e ripristino → cronologia aggiornata e valori applicati.
- Creazione campionatura → filtro per stato aggiorna i risultati.

In caso di problemi, consulta il log del browser (la pagina gestisce errori tramite le notifiche globali) oppure verifica le policy RLS eseguendo di nuovo `ADD_LAB_ROLE_AND_POLICIES.sql`.

