# 🔒 Row Level Security (RLS) Implementation Checklist

## Status delle Tabelle - FARMAP Pixel v1.2.1

### ⚠️ CRITICHE - DA PROTEGGERE SUBITO

- [ ] **profiles** - Contiene ruoli utente (admin, commerciale, lettore)
- [ ] **customer_products** - Relazione prodotti-clienti
- [ ] **price_list_items** - Prezzi dei prodotti
- [ ] **roles** - Definizioni dei ruoli
- [ ] **sample_requests** - Richieste campioni
- [ ] **sample_request_items** - Dettagli richieste campioni
- [ ] **view_products_commercial** - Vista prodotti commerciali
- [ ] **view_products_customer** - Vista prodotti clienti
- [ ] **view_products_production** - Vista prodotti produzione

### ✅ DA VERIFICARE (potrebbero già avere RLS)

- [ ] **customers** - Anagrafica clienti
- [ ] **products** - Catalogo prodotti
- [ ] **orders** - Ordini
- [ ] **order_items** - Righe ordini
- [ ] **price_lists** - Listini prezzi
- [ ] **categories** - Categorie prodotti
- [ ] **contacts** - Contatti
- [ ] **documents** - Documenti
- [ ] **labels** - Etichette

## 📋 Passi per l'Implementazione

### 1. Backup Database
```bash
# Da Supabase Dashboard > Database > Backups
# Oppure:
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d).sql
```

### 2. Fix Enum Values (se necessario)
Se ottieni errore `invalid input value for enum user_role`:
1. Apri Supabase Dashboard → SQL Editor
2. Esegui `FIX_USER_ROLE_ENUM.sql` **un blocco alla volta**
3. In Supabase ogni query auto-commit, quindi esegui:
   - Prima query: verifica valori esistenti
   - Seconda query: aggiungi 'admin' (se manca)
   - Terza query: aggiungi 'commerciale'
   - Quarta query: aggiungi 'lettore'
   - Quinta query: aggiungi 'label_user'
   - Ultima query: verifica finale
4. ⚠️ **NON eseguire tutto insieme** (causerebbe l'errore "unsafe use")

### 3. Esegui Script RLS
1. Apri Supabase Dashboard
2. Vai a SQL Editor
3. Apri `ENABLE_RLS_SECURITY.sql`
4. Esegui lo script
5. Verifica errori

### 4. Verifica RLS Attivo
```sql
-- Controlla quali tabelle hanno RLS attivo
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### 5. Test con Utenti Diversi

#### Test come Admin
```sql
-- Simula utente admin
SELECT * FROM profiles;
SELECT * FROM price_list_items;
-- Dovrebbe vedere tutto
```

#### Test come Commerciale
```sql
-- Simula utente commerciale
SELECT * FROM customers;
SELECT * FROM price_list_items;
-- Dovrebbe vedere dati assegnati
```

#### Test come Lettore
```sql
-- Simula utente lettore
SELECT * FROM customers;
SELECT * FROM price_list_items;
-- Dovrebbe vedere solo in lettura
```

### 6. Test dall'Applicazione
- [ ] Login come admin → Verificare accesso completo
- [ ] Login come commerciale → Verificare restrizioni
- [ ] Login come lettore → Verificare solo lettura
- [ ] Provare a creare/modificare/eliminare dati con ogni ruolo

### 7. Storage Buckets RLS

Anche i bucket storage necessitano policy:

```sql
-- product-photos bucket
CREATE POLICY "Authenticated users can view product photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Admin and commerciale can upload product photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-photos' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'commerciale')
    )
  );

-- technical-data-sheets bucket
CREATE POLICY "Authenticated users can view technical docs" ON storage.objects
  FOR SELECT USING (bucket_id = 'technical-data-sheets' AND auth.role() = 'authenticated');

CREATE POLICY "Admin and commerciale can upload technical docs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'technical-data-sheets' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'commerciale')
    )
  );
```

## 🚨 Problemi Comuni

### 1. Policy troppo restrittiva
**Sintomo:** Utenti non vedono dati che dovrebbero vedere
**Soluzione:** Rivedi le condizioni USING nelle policy

### 2. Policy mancante per INSERT/UPDATE
**Sintomo:** Errore 403 quando si prova a salvare
**Soluzione:** Aggiungi policy WITH CHECK per INSERT/UPDATE

### 3. RLS su viste
**Sintomo:** Le viste non rispettano RLS delle tabelle base
**Soluzione:** Usa `ALTER VIEW ... SET (security_invoker = on)`

### 4. Storage non protetto
**Sintomo:** File accessibili senza autenticazione
**Soluzione:** Aggiungi policy RLS ai bucket storage

## 📊 Monitoring

Dopo l'implementazione, monitora:

```sql
-- Query lente (possibile impatto RLS)
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%profiles%' 
ORDER BY mean_exec_time DESC;

-- Errori di permessi
SELECT * FROM pg_stat_database_conflicts;
```

## 🔐 Best Practices

1. **Testa sempre in staging prima di production**
2. **Usa ruoli minimi necessari** (principle of least privilege)
3. **Documenta ogni policy** con commenti SQL
4. **Monitora performance** dopo l'attivazione RLS
5. **Rivedi policy periodicamente** quando cambiano i requisiti
6. **Usa indici** su colonne usate nelle policy (es. `created_by`)

## 📞 Supporto

In caso di problemi:
1. Controlla i log di Supabase (Dashboard > Logs)
2. Verifica policy con query di test
3. Disabilita temporaneamente RLS per debug (SOLO in dev):
   ```sql
   ALTER TABLE nome_tabella DISABLE ROW LEVEL SECURITY;
   ```

---
**Data Creazione:** 2025-10-01  
**Versione App:** v1.2.1  
**Autore:** FARMAP Development Team

