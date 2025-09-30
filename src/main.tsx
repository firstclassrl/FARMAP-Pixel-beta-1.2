import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

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
