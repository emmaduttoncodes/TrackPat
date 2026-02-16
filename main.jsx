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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
