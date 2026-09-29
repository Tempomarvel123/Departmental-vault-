import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent browser extension errors (e.g., MetaMask connection attempts in iframe preview) from bubbling up as app crashes
if (typeof window !== 'undefined') {
  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const msg = String(event?.reason?.message || event?.reason || '');
      if (
        msg.toLowerCase().includes('metamask') ||
        msg.toLowerCase().includes('ethereum') ||
        msg.toLowerCase().includes('failed to connect')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    'error',
    (event) => {
      const msg = String(event?.message || event?.error?.message || event?.error || '');
      if (
        msg.toLowerCase().includes('metamask') ||
        msg.toLowerCase().includes('ethereum') ||
        msg.toLowerCase().includes('failed to connect')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

