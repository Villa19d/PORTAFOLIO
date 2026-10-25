import { API_BASE_URL, ApiError, type ProblemDetail } from './lib/api';

interface TokenResponse {
  accessToken: string;
  expiresIn: number;
}

let accessToken: string | null = null;
let refreshPromise: Promise<TokenResponse> | null = null;
let forcedLogoutHandler: (() => void) | null = null;

export function setAdminAccessToken(token: string | null) {
  accessToken = token;
}

export function onForcedLogout(handler: (() => void) | null) {
  forcedLogoutHandler = handler;
}

async function parseResponseError(response: Response): Promise<ApiError> {
  let problem: ProblemDetail;
  try {
    problem = (await response.json()) as ProblemDetail;
  } catch {
    problem = {
      title: response.statusText,
      status: response.status,
      detail: 'No se pudo interpretar la respuesta del servidor.',
    };
  }
  return new ApiError(problem, response.status, response.headers);
}

async function refreshAccessToken(): Promise<TokenResponse> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/api/auth/refresh`, {
      credentials: 'include',
      method: 'POST',
    })
      .then(async (response) => {
        if (!response.ok) {
          throw await parseResponseError(response);
        }
        return (await response.json()) as TokenResponse;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function loginAdmin(username: string, password: string): Promise<TokenResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    body: JSON.stringify({ username: username.trim(), password }),
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });

  if (!response.ok) {
    throw await parseResponseError(response);
  }

  const tokens = (await response.json()) as TokenResponse;
  setAdminAccessToken(tokens.accessToken);
  return tokens;
}

export async function refreshAdminSession(): Promise<TokenResponse> {
  const tokens = await refreshAccessToken();
  setAdminAccessToken(tokens.accessToken);
  return tokens;
}

export async function logoutAdmin(): Promise<void> {
  setAdminAccessToken(null);
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      credentials: 'include',
      method: 'POST',
    });
  } finally {
    refreshPromise = null;
  }
}

function forceLogout() {
  setAdminAccessToken(null);
  forcedLogoutHandler?.();
}

export async function adminFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const request = async (token: string | null) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw await parseResponseError(response);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  };

  try {
    return await request(accessToken);
  } catch (error: unknown) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }

    try {
      const tokens = await refreshAccessToken();
      setAdminAccessToken(tokens.accessToken);
      return await request(tokens.accessToken);
    } catch (refreshError: unknown) {
      forceLogout();
      throw refreshError;
    }
  }
}
