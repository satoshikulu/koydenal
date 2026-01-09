import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  const updateSW = registerSW({
    onNeedRefresh() {
      // Yeni versiyon mevcut, kullanıcıya bildir
      if (confirm('Yeni versiyon mevcut! Sayfayı yenilemek ister misiniz?')) {
        updateSW(true);
      }
    },
    onOfflineReady() {
      console.log('PWA çevrimdışı kullanıma hazır');
    },
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
