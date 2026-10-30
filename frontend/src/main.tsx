import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { isOptionalChunkFailure } from './lib/chunkReload'

window.addEventListener('vite:preloadError', (event) => {
  // three/HeroScene may fail on their own: the error is left to propagate so the Hero
  // error boundary keeps the CSS poster, instead of reloading the page for them.
  if (isOptionalChunkFailure((event as Event & { payload?: unknown }).payload)) return;

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
