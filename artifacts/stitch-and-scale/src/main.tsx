import { createRoot } from 'react-dom/client';

import App from './App';

import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Register service worker for PWA / offline shell caching.
// Local-first app, no backend — this only caches the app shell itself.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker
      .register(swUrl, { scope: import.meta.env.BASE_URL })
      .catch((err) => {
        console.debug('[SW] Registration skipped:', err instanceof Error ? err.message : err);
      });
  });
}
