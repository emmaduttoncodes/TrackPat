import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Request persistent storage so IndexedDB data survives browser cleanup
async function requestPersistence() {
  if (navigator.storage && navigator.storage.persist) {
    const granted = await navigator.storage.persist();
    console.log(`Persistent storage ${granted ? 'granted' : 'denied'}`);
  }
}
requestPersistence();

// Reload when a new service worker takes over, but only when the user
// returns to the tab — never mid-session while they're typing.
if ('serviceWorker' in navigator) {
  let updatePending = false;
  let hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) {
      if (document.hidden) {
        // Tab is in the background — reload immediately so it's fresh when they return
        window.location.reload();
      } else {
        // Tab is active — wait until the user leaves and comes back
        updatePending = true;
      }
    }
    hadController = true;
  });
  document.addEventListener('visibilitychange', () => {
    if (updatePending && document.visibilityState === 'visible') {
      window.location.reload();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
