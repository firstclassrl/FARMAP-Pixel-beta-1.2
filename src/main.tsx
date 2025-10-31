import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Monta l'app
const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root non trovato. Controlla index.html');
}

// Service Worker recovery: auto-unregister stale SW and reload once
// This prevents the app getting stuck on old caches after deployments
try {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(reg => {
        // If there is a waiting worker or no active controller, cleanly unregister
        if ((reg as any).waiting || !navigator.serviceWorker.controller) {
          reg.unregister().then(() => {
            // Force a one-time reload to pick fresh assets
            if (!sessionStorage.getItem('sw-reloaded')) {
              sessionStorage.setItem('sw-reloaded', '1');
              window.location.reload();
            }
          });
        }
      });
    }).catch(() => {});
  }
} catch {}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);
