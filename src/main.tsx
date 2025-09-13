import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { testConnection } from './lib/supabase';

// Log per capire che main.tsx si carica davvero
console.log('🔧 main.tsx loaded');

// Test connection but don't block rendering
setTimeout(() => {
  testConnection()
    .then(ok => console.log('🔍 testConnection:', ok ? 'OK' : 'FAILED'))
    .catch(err => console.error('🔍 testConnection error:', err));
}, 100);

// Monta l'app
const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root non trovato. Controlla index.html');
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);
