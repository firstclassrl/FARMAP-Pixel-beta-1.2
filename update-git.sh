#!/bin/bash

# Script per aggiornare il repository GitHub con le modifiche della versione 1.1.0-beta

echo "🚀 Aggiornamento repository GitHub per Pixel CRM v1.1.0-beta"

# Naviga alla directory del progetto
cd "/Users/antonietto/Documents/Abruzzo.AI/Pixel/pixel-beta farmap"

# Controlla se è un repository git
if [ ! -d ".git" ]; then
    echo "📁 Inizializzazione repository git..."
    git init
fi

# Aggiungi il remote origin se non esiste
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 Aggiunta remote origin..."
    git remote add origin https://github.com/firstclassrl/pixel-beta.git
fi

# Aggiungi tutti i file modificati
echo "📝 Aggiunta file modificati..."
git add .

# Commit delle modifiche
echo "💾 Commit delle modifiche..."
git commit -m "feat: Aggiornamento a versione 1.1.0-beta

- Aggiunto pulsante anteprima nella modale di modifica listino
- Rimosso pulsante stampa dalla modale
- Pulizia codice: rimossi import, funzioni e variabili non utilizzate
- Aggiornata versione in package.json e UI
- Creato CHANGELOG.md e README.md aggiornati
- Ottimizzato caricamento dati e state management

Closes: #1"

# Push al repository remoto
echo "🚀 Push al repository GitHub..."
git push -u origin main

echo "✅ Aggiornamento completato!"
echo "🔗 Repository: https://github.com/firstclassrl/pixel-beta"
