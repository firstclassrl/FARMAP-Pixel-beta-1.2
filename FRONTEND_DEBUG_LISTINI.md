# Debug Frontend Listini - Test Completo

## Test da eseguire nel browser:

### 1. Apri la Console del Browser (F12)
### 2. Vai alla pagina Listini
### 3. Esegui questi comandi nella console:

```javascript
// Test 1: Verifica connessione Supabase
console.log('=== TEST 1: Connessione Supabase ===');
const { data, error } = await supabase.from('price_lists').select('*').limit(1);
console.log('Data:', data);
console.log('Error:', error);

// Test 2: Verifica utente autenticato
console.log('=== TEST 2: Utente Autenticato ===');
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);

// Test 3: Verifica profilo utente
console.log('=== TEST 3: Profilo Utente ===');
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();
console.log('Profile:', profile);
console.log('Profile Error:', profileError);

// Test 4: Test inserimento listino
console.log('=== TEST 4: Inserimento Listino ===');
const testPriceList = {
  name: 'Test Listino Console ' + new Date().getTime(),
  description: 'Test da console',
  created_by: user.id
};

const { data: insertData, error: insertError } = await supabase
  .from('price_lists')
  .insert([testPriceList])
  .select()
  .single();

console.log('Insert Data:', insertData);
console.log('Insert Error:', insertError);

// Test 5: Verifica prodotti disponibili
console.log('=== TEST 5: Prodotti Disponibili ===');
const { data: products, error: productsError } = await supabase
  .from('products')
  .select('id, name, code, base_price')
  .eq('is_active', true)
  .limit(5);

console.log('Products:', products);
console.log('Products Error:', productsError);

// Test 6: Test inserimento item in listino (se il listino è stato creato)
if (insertData && insertData.id && products && products.length > 0) {
  console.log('=== TEST 6: Inserimento Item Listino ===');
  const testItem = {
    price_list_id: insertData.id,
    product_id: products[0].id,
    price: products[0].base_price,
    discount_percentage: 10,
    min_quantity: 1
  };

  const { data: itemData, error: itemError } = await supabase
    .from('price_list_items')
    .insert([testItem])
    .select()
    .single();

  console.log('Item Data:', itemData);
  console.log('Item Error:', itemError);
}

// Test 7: Verifica listini esistenti
console.log('=== TEST 7: Listini Esistenti ===');
const { data: existingLists, error: existingError } = await supabase
  .from('price_lists')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10);

console.log('Existing Lists:', existingLists);
console.log('Existing Error:', existingError);
```

### 4. Copia e incolla tutti gli output qui sotto

## Risultati attesi:
- **Test 1**: Dovrebbe mostrare `Data: []` e `Error: null`
- **Test 2**: Dovrebbe mostrare l'oggetto utente
- **Test 3**: Dovrebbe mostrare il profilo con ruolo
- **Test 4**: Dovrebbe creare un listino senza errori
- **Test 5**: Dovrebbe mostrare i prodotti disponibili
- **Test 6**: Dovrebbe creare un item nel listino
- **Test 7**: Dovrebbe mostrare tutti i listini esistenti

## Se ci sono errori:
- Copia l'errore completo
- Indica in quale test si verifica
- Fornisci lo stack trace se disponibile
