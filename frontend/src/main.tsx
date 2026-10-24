import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppProviders } from './components/AppProviders.tsx'
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  if (sessionStorage.getItem('chunk-reload') !== '1') {
    sessionStorage.setItem('chunk-reload', '1');
    window.location.reload();
  }
});
window.addEventListener('load', () => {
  window.setTimeout(() => sessionStorage.removeItem('chunk-reload'), 10_000);
});
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
