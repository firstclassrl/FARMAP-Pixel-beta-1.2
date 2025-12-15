# 📋 Permessi Completi per Tutti i Ruoli

Documentazione completa di tutti i ruoli esistenti nel sistema Pixel CRM e dei loro permessi.

---

## 🔴 **ADMIN** (Amministratore)

**Descrizione:** Accesso completo a tutte le funzionalità del sistema.

### 🔐 Permessi Database (RLS)
- ✅ **Tutte le tabelle:** Accesso completo (CREATE, READ, UPDATE, DELETE)
- ✅ **Gestione utenti:** Può leggere e modificare tutti i profili utente
- ✅ **Bypass RLS:** Accesso completo a tutte le risorse

### 📱 Accesso Interfaccia
- ✅ **Dashboard** - Accesso completo
- ✅ **Clienti** - Creazione, modifica, eliminazione, visualizzazione
- ✅ **Prodotti** - Creazione, modifica, eliminazione, visualizzazione
- ✅ **Listini** - Creazione, modifica, eliminazione, visualizzazione
- ✅ **Ordini** - Creazione, modifica, eliminazione, visualizzazione
- ✅ **Calendario** - Gestione completa appuntamenti
- ✅ **Garden** - Visualizzazione prodotti (vista commerciale)
- ✅ **LAB** - Accesso completo alla sezione laboratorio
- ✅ **Campionatura** - Gestione completa richieste campioni
- ✅ **Report** - Accesso a tutti i report
- ✅ **Gestione Utenti** - ⭐ **SOLO ADMIN** - Creazione, modifica, eliminazione utenti
- ✅ **Notifiche** - Visualizzazione notifiche

### 📊 Dashboard Actions
- Tutte le azioni rapide disponibili

---

## 🔵 **COMMERCIALE** (Commerciale)

**Descrizione:** Gestione vendite e clienti (tutte le funzioni tranne gestione utenti).

### 🔐 Permessi Database (RLS)
- ✅ **Clienti:** CREATE, READ, UPDATE, DELETE
- ✅ **Prodotti:** READ (solo lettura)
- ✅ **Listini:** Accesso completo
- ✅ **Ordini:** Accesso completo
- ✅ **Campionature:** Accesso completo (modifica tutte le richieste)
- ❌ **Profili utenti:** Solo lettura del proprio profilo

### 📱 Accesso Interfaccia
- ✅ **Dashboard** - Accesso completo
- ✅ **Clienti** - Creazione, modifica, eliminazione, visualizzazione
- ✅ **Prodotti** - ⚠️ Solo visualizzazione (lettura)
- ✅ **Listini** - Creazione, modifica, eliminazione, visualizzazione
- ✅ **Ordini** - Creazione, modifica, eliminazione, visualizzazione
- ✅ **Calendario** - Gestione completa appuntamenti
- ✅ **Garden** - Visualizzazione prodotti (vista commerciale)
- ❌ **LAB** - Accesso negato
- ✅ **Campionatura** - Gestione completa richieste campioni
- ✅ **Report** - Accesso ai report
- ❌ **Gestione Utenti** - Accesso negato
- ✅ **Notifiche** - Visualizzazione notifiche

### 📊 Dashboard Actions
- Clienti
- Prodotti
- Listini
- Ordini
- Calendario
- Garden
- Campionatura
- Report

---

## ⚪ **LETTORE** (Lettore)

**Descrizione:** Solo visualizzazione dati, nessuna modifica.

### 🔐 Permessi Database (RLS)
- ✅ **Clienti:** READ (solo lettura)
- ✅ **Prodotti:** READ (solo lettura)
- ✅ **Profili utenti:** Solo lettura del proprio profilo
- ❌ **Listini:** Nessun accesso
- ❌ **Ordini:** Nessun accesso
- ❌ **Modifiche:** Nessuna modifica consentita

### 📱 Accesso Interfaccia
- ✅ **Dashboard** - Visualizzazione dashboard
- ✅ **Clienti** - ⚠️ Solo visualizzazione (lettura)
- ✅ **Prodotti** - ⚠️ Solo visualizzazione (lettura)
- ❌ **Listini** - Accesso negato
- ❌ **Ordini** - Accesso negato
- ❌ **Calendario** - Accesso negato
- ❌ **Garden** - Accesso negato
- ❌ **LAB** - Accesso negato
- ❌ **Campionatura** - Accesso negato
- ✅ **Report** - ⚠️ Solo visualizzazione report
- ❌ **Gestione Utenti** - Accesso negato
- ✅ **Notifiche** - Visualizzazione notifiche

### 📊 Dashboard Actions
- Prodotti (solo visualizzazione)
- Report (solo visualizzazione)

---

## 🟠 **PRODUCTION** (Produzione)

**Descrizione:** Gestione produzione e magazzino. Accesso limitato solo a Garden.

### 🔐 Permessi Database (RLS)
- ✅ **Prodotti:** READ attraverso vista `view_products_production`
- ✅ **Garden:** Accesso specializzato per produzione
- ❌ **Clienti:** Nessun accesso
- ❌ **Ordini:** Nessun accesso

### 📱 Accesso Interfaccia
- ❌ **Dashboard** - Accesso negato (reindirizzato a Garden)
- ❌ **Clienti** - Accesso negato
- ❌ **Prodotti** - Accesso negato (tramite interfaccia normale)
- ❌ **Listini** - Accesso negato
- ❌ **Ordini** - Accesso negato
- ❌ **Calendario** - Accesso negato
- ✅ **Garden** - ⭐ **SOLO PRODUCTION** - Visualizzazione prodotti (vista produzione)
- ❌ **LAB** - Accesso negato
- ❌ **Campionatura** - Accesso negato
- ❌ **Report** - Accesso negato
- ❌ **Gestione Utenti** - Accesso negato

### 📊 Dashboard Actions
- Solo Garden (accesso esclusivo)

### 🔄 Comportamento Speciale
- All'avvio viene **automaticamente reindirizzato a `/garden`** invece della dashboard
- Vede solo i prodotti attraverso la vista `view_products_production`
- Accesso limitato e specializzato per il reparto produzione

---

## 🟡 **SALES** (Vendite Esteso)

**Descrizione:** Vendite avanzate con accesso a report e listini completi.

### 🔐 Permessi Database (RLS)
- ✅ **Clienti:** Accesso completo (come commerciale)
- ✅ **Prodotti:** READ (solo lettura)
- ✅ **Listini:** Accesso completo
- ✅ **Ordini:** Accesso completo
- ✅ **Report:** Accesso completo
- ✅ **Garden:** Vista commerciale dei prodotti

### 📱 Accesso Interfaccia
- ✅ **Dashboard** - Accesso completo
- ✅ **Clienti** - Creazione, modifica, eliminazione, visualizzazione
- ✅ **Prodotti** - ⚠️ Solo visualizzazione (lettura)
- ✅ **Listini** - Creazione, modifica, eliminazione, visualizzazione
- ✅ **Ordini** - Creazione, modifica, eliminazione, visualizzazione
- ✅ **Calendario** - Gestione completa appuntamenti
- ✅ **Garden** - Visualizzazione prodotti (vista commerciale)
- ❌ **LAB** - Accesso negato
- ✅ **Campionatura** - Gestione completa richieste campioni
- ✅ **Report** - ⭐ Accesso completo ai report avanzati
- ❌ **Gestione Utenti** - Accesso negato
- ✅ **Notifiche** - Visualizzazione notifiche

### 📊 Dashboard Actions
- Clienti
- Prodotti
- Listini
- Ordini
- Calendario
- Garden
- Campionatura
- Report

### 📝 Differenze con Commerciale
- Stessi permessi di `commerciale` ma con **accesso esplicito ai report avanzati**
- Identificato come ruolo separato per distinguere permessi sui report

---

## 🟢 **CUSTOMER_USER** (Utente Cliente)

**Descrizione:** Accesso limitato per clienti esterni.

### 🔐 Permessi Database (RLS)
- ✅ **Prodotti:** READ attraverso vista `view_products_customer` (solo prodotti visibili ai clienti)
- ❌ **Clienti:** Nessun accesso
- ❌ **Ordini:** Nessun accesso
- ❌ **Listini:** Nessun accesso

### 📱 Accesso Interfaccia
- ❌ **Dashboard** - Accesso negato
- ❌ **Clienti** - Accesso negato
- ❌ **Prodotti** - Accesso negato (tramite interfaccia normale)
- ❌ **Listini** - Accesso negato
- ❌ **Ordini** - Accesso negato
- ❌ **Calendario** - Accesso negato
- ✅ **Garden** - Visualizzazione prodotti (vista cliente limitata)
- ❌ **LAB** - Accesso negato
- ❌ **Campionatura** - Accesso negato
- ❌ **Report** - Accesso negato
- ❌ **Gestione Utenti** - Accesso negato

### 📊 Dashboard Actions
- Solo Garden (vista cliente limitata)

### 🔄 Comportamento Speciale
- Vede solo i prodotti attraverso la vista `view_products_customer`
- Accesso molto limitato, pensato per clienti esterni

---

## 🩷 **LAB** (Laboratorio)

**Descrizione:** Accesso alla sezione LAB e insight qualità.

### 🔐 Permessi Database (RLS)
- ✅ **Tabelle LAB:** Accesso completo a:
  - `lab_raw_materials` (Materie prime)
  - `lab_recipes` (Ricette)
  - `lab_recipe_ingredients` (Ingredienti ricette)
  - `lab_samples` (Campionature)
- ✅ **Clienti:** READ (solo lettura, per collegare campionature)
- ✅ **Prodotti:** READ (solo lettura)
- ✅ **Calendario:** Accesso completo

### 📱 Accesso Interfaccia
- ✅ **Dashboard** - ⚠️ Reindirizzato automaticamente a `/lab`
- ✅ **Clienti** - ⚠️ Solo visualizzazione (per collegare campionature)
- ✅ **Prodotti** - ⚠️ Solo visualizzazione (lettura)
- ❌ **Listini** - Accesso negato
- ❌ **Ordini** - Accesso negato
- ✅ **Calendario** - Gestione completa appuntamenti
- ✅ **Garden** - Visualizzazione prodotti (vista commerciale)
- ✅ **LAB** - ⭐ **SOLO LAB + ADMIN** - Accesso completo:
  - Materie Prime
  - Ricette
  - Campionature LAB
  - Insights qualità
- ❌ **Campionatura** - Accesso negato (usare sezione LAB)
- ✅ **Report** - Accesso ai report
- ❌ **Gestione Utenti** - Accesso negato

### 📊 Dashboard Actions
- LAB (accesso esclusivo)
- Report

### 🔄 Comportamento Speciale
- All'avvio viene **automaticamente reindirizzato a `/lab`** invece della dashboard
- Focus su gestione materie prime, ricette e campionature di laboratorio

---

## 📊 Tabella Riassuntiva

| Ruolo | Dashboard | Clienti | Prodotti | Listini | Ordini | Calendario | Garden | LAB | Campionatura | Report | Gestione Utenti |
|-------|-----------|---------|----------|---------|--------|------------|--------|-----|--------------|--------|-----------------|
| **admin** | ✅ | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ ⭐ |
| **commerciale** | ✅ | ✅ CRUD | 👁️ Read | ✅ CRUD | ✅ CRUD | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **lettore** | ✅ | 👁️ Read | 👁️ Read | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 👁️ Read | ❌ |
| **production** | ❌ → Garden | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ ⭐ | ❌ | ❌ | ❌ | ❌ |
| **sales** | ✅ | ✅ CRUD | 👁️ Read | ✅ CRUD | ✅ CRUD | ✅ | ✅ | ❌ | ✅ | ✅ ⭐ | ❌ |
| **customer_user** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (limitato) | ❌ | ❌ | ❌ | ❌ |
| **lab** | ✅ → LAB | 👁️ Read | 👁️ Read | ❌ | ❌ | ✅ | ✅ | ✅ ⭐ | ❌ | ✅ | ❌ |

### Legenda
- ✅ = Accesso completo
- ✅ CRUD = Create, Read, Update, Delete
- 👁️ Read = Solo lettura
- ❌ = Accesso negato
- ⭐ = Accesso esclusivo o privilegiato
- → = Reindirizzamento automatico

---

## 🔒 Note Importanti

1. **RLS (Row Level Security):** Tutte le tabelle hanno RLS abilitato. I permessi nel database possono essere più restrittivi di quelli nell'interfaccia.

2. **Admin ha sempre accesso completo:** Il ruolo `admin` bypassa tutte le restrizioni RLS.

3. **Ruoli specializzati:**
   - `production` e `customer_user` hanno accesso solo a Garden
   - `lab` ha accesso solo alla sezione LAB
   - Questi ruoli vengono reindirizzati automaticamente all'avvio

4. **Gestione Utenti:** Solo `admin` può accedere alla pagina di gestione utenti.

5. **Differenze tra ruoli simili:**
   - `commerciale` e `sales` hanno permessi simili, ma `sales` ha accesso esplicito ai report avanzati
   - `lettore` è l'unico ruolo con solo permessi di lettura

---

## 📝 Aggiornamenti Futuri

Per aggiungere nuovi permessi o modificare ruoli esistenti, aggiornare:
1. `src/types/roles.ts` - Definizione dei ruoli
2. `src/App.tsx` - Route protette
3. `src/components/layout/Sidebar.tsx` - Voci menu
4. `src/pages/Dashboard.tsx` - Azioni dashboard
5. `ENABLE_RLS_SECURITY.sql` - Policy RLS nel database




