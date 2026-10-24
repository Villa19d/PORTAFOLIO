import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  loginAdmin,
  logoutAdmin,
  onForcedLogout,
  refreshAdminSession,
  setAdminAccessToken,
} from './adminApi';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    void refreshAdminSession()
      .then((tokens) => {
        if (active) {
          setIsAuthenticated(true);
          setTokenExpiresAt(Date.now() + tokens.expiresIn * 1000);
        }
      })
      .catch(() => {
        setAdminAccessToken(null);
        if (active) {
          setIsAuthenticated(false);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleForcedLogout = () => {
      setIsAuthenticated(false);
      setTokenExpiresAt(null);
    };
    onForcedLogout(handleForcedLogout);
    return () => onForcedLogout(null);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || tokenExpiresAt === null) {
      return;
    }

    const refreshInMs = Math.max(tokenExpiresAt - Date.now() - 60_000, 0);
    const timeoutId = window.setTimeout(() => {
      void refreshAdminSession()
        .then((tokens) => {
          setTokenExpiresAt(Date.now() + tokens.expiresIn * 1000);
        })
        .catch(() => {
          setIsAuthenticated(false);
          setTokenExpiresAt(null);
          setAdminAccessToken(null);
        });
    }, refreshInMs);

    return () => window.clearTimeout(timeoutId);
  }, [isAuthenticated, tokenExpiresAt]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isLoading,
      login: async (username, password) => {
        const tokens = await loginAdmin(username, password);
        setIsAuthenticated(true);
        setTokenExpiresAt(Date.now() + tokens.expiresIn * 1000);
      },
      logout: async () => {
        await logoutAdmin();
        setIsAuthenticated(false);
        setTokenExpiresAt(null);
      },
    }),
    [isAuthenticated, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  }
  return context;
}
