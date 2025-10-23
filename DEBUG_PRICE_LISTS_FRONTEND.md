# Debug Frontend Listini

## Test da eseguire nel browser:

### 1. Apri la Console del Browser (F12)
### 2. Vai alla pagina Listini
### 3. Esegui questi comandi nella console:

```javascript
// Test 1: Verifica connessione Supabase
console.log('Testing Supabase connection...');
const { data, error } = await supabase.from('price_lists').select('*').limit(1);
console.log('Data:', data);
console.log('Error:', error);

// Test 2: Verifica utente autenticato
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);

// Test 3: Verifica profilo utente
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();
console.log('Profile:', profile);
console.log('Profile Error:', profileError);

// Test 4: Test inserimento listino
const testPriceList = {
  name: 'Test Listino Console',
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
const { data: products, error: productsError } = await supabase
  .from('products')
  .select('id, name, code')
  .eq('is_active', true)
  .limit(5);

console.log('Products:', products);
console.log('Products Error:', productsError);
```

### 4. Copia e incolla tutti gli output qui sotto
