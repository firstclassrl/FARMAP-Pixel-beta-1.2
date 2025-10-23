# Debug Form Validation - Listini

## Test da eseguire nella console del browser:

### 1. Apri la Console del Browser (F12)
### 2. Vai alla pagina Listini e clicca "Nuovo Listino"
### 3. Esegui questi comandi nella console:

```javascript
// Test 1: Verifica se il form è presente
console.log('=== TEST 1: Verifica Form ===');
const form = document.querySelector('form');
console.log('Form element:', form);

// Test 2: Verifica i campi del form
console.log('=== TEST 2: Campi Form ===');
const nameInput = document.querySelector('input[name="name"]');
const validFromInput = document.querySelector('input[name="valid_from"]');
const customerInput = document.querySelector('input[name="customer_id"]');
console.log('Name input:', nameInput);
console.log('Valid from input:', validFromInput);
console.log('Customer input:', customerInput);

// Test 3: Verifica i valori dei campi
console.log('=== TEST 3: Valori Campi ===');
if (nameInput) console.log('Name value:', nameInput.value);
if (validFromInput) console.log('Valid from value:', validFromInput.value);
if (customerInput) console.log('Customer value:', customerInput.value);

// Test 4: Verifica errori di validazione
console.log('=== TEST 4: Errori Validazione ===');
const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
console.log('Error elements:', errorElements);
errorElements.forEach((el, index) => {
  console.log(`Error ${index}:`, el.textContent);
});

// Test 5: Verifica se ci sono messaggi di errore specifici
console.log('=== TEST 5: Messaggi Errore ===');
const errorMessages = document.querySelectorAll('p[class*="error"], span[class*="error"], div[class*="error"]');
console.log('Error messages:', errorMessages);
errorMessages.forEach((el, index) => {
  console.log(`Error message ${index}:`, el.textContent);
});

// Test 6: Prova a compilare il form programmaticamente
console.log('=== TEST 6: Compilazione Form ===');
if (nameInput) {
  nameInput.value = 'Test Listino Debug';
  nameInput.dispatchEvent(new Event('input', { bubbles: true }));
  nameInput.dispatchEvent(new Event('change', { bubbles: true }));
  console.log('Name field updated');
}

if (validFromInput) {
  validFromInput.value = '2025-01-01';
  validFromInput.dispatchEvent(new Event('input', { bubbles: true }));
  validFromInput.dispatchEvent(new Event('change', { bubbles: true }));
  console.log('Valid from field updated');
}

// Test 7: Verifica se il form è valido dopo la compilazione
console.log('=== TEST 7: Validità Form ===');
if (form) {
  const isValid = form.checkValidity();
  console.log('Form is valid:', isValid);
  
  if (!isValid) {
    const validity = form.validity;
    console.log('Form validity:', validity);
  }
}

// Test 8: Prova a inviare il form
console.log('=== TEST 8: Invio Form ===');
if (form) {
  try {
    form.dispatchEvent(new Event('submit', { bubbles: true }));
    console.log('Form submit event dispatched');
  } catch (error) {
    console.log('Form submit error:', error);
  }
}
```

### 4. Alternativa: Test tramite React DevTools

1. **Installa React DevTools** se non l'hai già fatto
2. **Apri React DevTools** (F12 → Components)
3. **Cerca il componente PriceListDetailPage**
4. **Verifica lo stato del form** e gli errori di validazione

### 5. Alternativa: Test tramite Network Tab

1. **Apri Network Tab** (F12 → Network)
2. **Compila il form** e clicca "Salva"
3. **Controlla se ci sono richieste** a Supabase
4. **Verifica se ci sono errori** nelle richieste

## Risultati attesi:
- **Test 1-3**: Dovrebbero mostrare gli elementi del form
- **Test 4-5**: Dovrebbero mostrare eventuali errori di validazione
- **Test 6-7**: Dovrebbero compilare il form e verificare la validità
- **Test 8**: Dovrebbe tentare di inviare il form

## Se ci sono errori:
- Copia l'errore completo
- Indica quale test ha fallito
- Fornisci i valori dei campi del form
