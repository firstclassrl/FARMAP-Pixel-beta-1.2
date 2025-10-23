# Debug Frontend Listini - Test Corretto

## Test da eseguire nel browser:

### 1. Apri la Console del Browser (F12)
### 2. Vai alla pagina Listini
### 3. Esegui questi comandi nella console:

```javascript
// Test 1: Verifica se supabase è disponibile globalmente
console.log('=== TEST 1: Verifica Supabase ===');
console.log('window.supabase:', window.supabase);
console.log('typeof supabase:', typeof supabase);

// Test 2: Cerca l'istanza di supabase nell'app React
console.log('=== TEST 2: Cerca Supabase in React ===');
const reactRoot = document.querySelector('#root');
console.log('React root:', reactRoot);

// Test 3: Prova ad accedere a supabase tramite window
if (window.supabase) {
  console.log('=== TEST 3: Test con window.supabase ===');
  const { data, error } = await window.supabase.from('price_lists').select('*').limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
} else {
  console.log('window.supabase non disponibile');
}

// Test 4: Prova a fare una richiesta HTTP diretta
console.log('=== TEST 4: Test HTTP diretto ===');
try {
  const response = await fetch('/api/price-lists');
  console.log('HTTP Response:', response);
} catch (err) {
  console.log('HTTP Error:', err);
}

// Test 5: Verifica se ci sono errori nella pagina
console.log('=== TEST 5: Errori nella pagina ===');
const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
console.log('Error elements:', errorElements);

// Test 6: Verifica se i pulsanti sono disabilitati
console.log('=== TEST 6: Stato pulsanti ===');
const buttons = document.querySelectorAll('button');
buttons.forEach((btn, index) => {
  console.log(`Button ${index}:`, {
    text: btn.textContent,
    disabled: btn.disabled,
    className: btn.className
  });
});

// Test 7: Verifica se ci sono elementi di loading
console.log('=== TEST 7: Elementi di loading ===');
const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"], [class*="spinner"]');
console.log('Loading elements:', loadingElements);

// Test 8: Verifica se ci sono notifiche di errore
console.log('=== TEST 8: Notifiche ===');
const notifications = document.querySelectorAll('[class*="notification"], [class*="toast"], [class*="alert"]');
console.log('Notifications:', notifications);
```

### 4. Alternativa: Test tramite Network Tab

1. **Apri Network Tab** (F12 → Network)
2. **Ricarica la pagina Listini**
3. **Cerca richieste a Supabase** (filtra per "supabase" o "price-lists")
4. **Controlla se ci sono errori 401, 403, 404, 500**

### 5. Alternativa: Test tramite Application Tab

1. **Apri Application Tab** (F12 → Application)
2. **Vai su Local Storage**
3. **Cerca chiavi relative a Supabase** (supabase.auth.token, etc.)
4. **Verifica se il token è presente e valido**

## Risultati attesi:
- **Test 1**: Dovrebbe mostrare se supabase è disponibile
- **Test 2**: Dovrebbe mostrare l'elemento React root
- **Test 3**: Se supabase è disponibile, dovrebbe funzionare
- **Test 4**: Potrebbe fallire se non c'è API endpoint
- **Test 5-8**: Dovrebbero mostrare lo stato della UI

## Se supabase non è disponibile:
Il problema è che l'istanza di Supabase non è esposta globalmente. In questo caso:
1. Controlla il Network Tab per vedere le richieste
2. Verifica se ci sono errori di autenticazione
3. Controlla se la pagina si carica correttamente
