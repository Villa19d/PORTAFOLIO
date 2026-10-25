import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './AuthProvider';
import AdminLogin from './AdminLogin';
import MessagesView from './MessagesView';
import ProjectsView from './ProjectsView';

type AdminView = 'projects' | 'messages';

const adminQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function getViewFromHash(): AdminView {
  return window.location.hash === '#/messages' ? 'messages' : 'projects';
}

function setRobotsMeta() {
  let robotsMeta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (!robotsMeta) {
    robotsMeta = document.createElement('meta');
    robotsMeta.name = 'robots';
    document.head.appendChild(robotsMeta);
  }
  robotsMeta.content = 'noindex';
}

export default function AdminApp() {
  return (
    <QueryClientProvider client={adminQueryClient}>
      <AuthProvider>
        <AuthenticatedAdminApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AuthenticatedAdminApp() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [view, setView] = useState<AdminView>(getViewFromHash);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    setRobotsMeta();

    const handleHashChange = () => setView(getViewFromHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-bg text-text">Cargando...</main>;
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  const navigateTo = (nextView: AdminView) => {
    window.location.hash = `/${nextView}`;
  };

  const handleLogout = () => {
    void logout().then(() => window.location.assign('/'));
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-6 py-4">
          <a className="mr-auto font-display text-xl font-semibold" href="/admin#/projects">
            Panel de administración
          </a>

          <nav aria-label="Navegación administrativa" className="flex items-center gap-2">
            <button
              className={`rounded-md px-3 py-2 text-sm ${
                view === 'projects' ? 'bg-accent text-bg' : 'text-text-muted hover:text-text'
              }`}
              onClick={() => navigateTo('projects')}
              type="button"
            >
              Proyectos
            </button>
            <button
              className={`rounded-md px-3 py-2 text-sm ${
                view === 'messages' ? 'bg-accent text-bg' : 'text-text-muted hover:text-text'
              }`}
              onClick={() => navigateTo('messages')}
              type="button"
            >
              Mensajes
            </button>
          </nav>

          <button
            aria-label="Cambiar tema"
            className="rounded-md border border-border-control px-3 py-2 text-sm text-text-muted hover:text-text"
            onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            type="button"
          >
            {theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
          </button>
          <button
            className="rounded-md border border-border-control px-3 py-2 text-sm text-text-muted hover:text-text"
            onClick={handleLogout}
            type="button"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {view === 'projects' ? <ProjectsView /> : <MessagesView />}
      </main>
    </div>
  );
}
