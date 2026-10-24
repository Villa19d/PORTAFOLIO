import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError } from './lib/api';
import { useAuth } from './AuthProvider';

export default function AdminLogin() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (errorMessage) {
      errorRef.current?.focus();
    }
  }, [errorMessage]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    try {
      await login(username, password);
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 429) {
        const retryAfterSeconds = Number(error.headers?.get('Retry-After'));
        const retryAfter = Number.isFinite(retryAfterSeconds)
          ? `Inténtalo de nuevo en ${retryAfterSeconds} segundos.`
          : 'Inténtalo de nuevo más tarde.';
        setErrorMessage(`Demasiados intentos. ${retryAfter}`);
      } else {
        setErrorMessage('Credenciales inválidas');
      }
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6 text-text">
      <form
        aria-labelledby="login-title"
        className="w-full max-w-md space-y-6 rounded-lg border border-border bg-surface p-8"
        onSubmit={handleSubmit}
      >
        <div>
          <h1 className="font-display text-3xl font-semibold" id="login-title">
            Panel de administración
          </h1>
          <p className="mt-2 text-text-muted">Inicia sesión para continuar.</p>
        </div>

        {errorMessage && (
          <p aria-live="assertive" className="rounded-md border border-red-500 p-3 text-sm text-red-500" ref={errorRef} role="alert" tabIndex={-1}>
            {errorMessage}
          </p>
        )}

        <label className="block text-sm" htmlFor="admin-username">
          Correo
          <input
            autoComplete="username"
            className="mt-2 w-full rounded-md border border-border-control bg-bg px-3 py-2"
            id="admin-username"
            onChange={(event) => setUsername(event.target.value)}
            required
            type="email"
            value={username}
          />
        </label>

        <label className="block text-sm" htmlFor="admin-password">
          Contraseña
          <input
            autoComplete="current-password"
            className="mt-2 w-full rounded-md border border-border-control bg-bg px-3 py-2"
            id="admin-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        <button className="w-full rounded-md bg-accent px-4 py-3 font-medium text-bg" type="submit">
          Iniciar sesión
        </button>
      </form>
    </main>
  );
}
