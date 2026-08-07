import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './styles/tokens.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Não foi possível encontrar o elemento root');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void import('virtual:pwa-register')
      .then(({ registerSW }) => {
        registerSW({
          immediate: true,
          onNeedRefresh() {
            // Soft update path; user keeps current session.
          },
        });
      })
      .catch(() => {
        // PWA plugin unavailable in some test environments.
      });
  });
}
