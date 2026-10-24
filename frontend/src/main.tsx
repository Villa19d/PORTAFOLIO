import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

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

async function bootstrap() {
  const root = createRoot(document.getElementById('root')!);

  if (window.location.pathname.startsWith('/admin')) {
    const { default: AdminApp } = await import('./AdminApp.tsx');
    root.render(
      <StrictMode>
        <AdminApp />
      </StrictMode>,
    );
    return;
  }

  const [{ default: App }, { AppProviders }] = await Promise.all([
    import('./App.tsx'),
    import('./components/AppProviders.tsx'),
  ]);

  root.render(
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>,
  );
}

void bootstrap();
