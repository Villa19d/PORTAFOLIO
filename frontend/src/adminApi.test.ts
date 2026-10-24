import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  adminFetch,
  loginAdmin,
  onForcedLogout,
  setAdminAccessToken,
} from './adminApi';

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', ...headers },
    status,
  });
}

describe('adminApi', () => {
  beforeEach(() => {
    setAdminAccessToken(null);
    onForcedLogout(null);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps JWTs out of localStorage and sessionStorage', async () => {
    const localStorageSetItem = vi.spyOn(Storage.prototype, 'setItem');
    const sessionStorageSetItem = vi.spyOn(Storage.prototype, 'setItem');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ accessToken: 'memory-token', expiresIn: 900 }),
      ),
    );

    await loginAdmin('admin@example.com', 'password');

    expect(localStorageSetItem).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('memory-token'),
    );
    expect(sessionStorageSetItem).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('memory-token'),
    );
  });

  it('uses one refresh request for concurrent 401 responses', async () => {
    let resolveRefresh: ((response: Response) => void) | undefined;
    const refreshResponse = new Promise<Response>((resolve) => {
      resolveRefresh = resolve;
    });
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => Promise.resolve(jsonResponse({ detail: 'expired' }, 401)))
      .mockImplementationOnce(() => Promise.resolve(jsonResponse({ detail: 'expired' }, 401)))
      .mockImplementationOnce(() => refreshResponse)
      .mockImplementation(() => Promise.resolve(jsonResponse({ ok: true })));
    vi.stubGlobal('fetch', fetchMock);
    setAdminAccessToken('expired-token');

    const firstRequest = adminFetch<{ ok: boolean }>('/api/admin/one');
    const secondRequest = adminFetch<{ ok: boolean }>('/api/admin/two');
    await Promise.resolve();
    resolveRefresh?.(jsonResponse({ accessToken: 'fresh-token', expiresIn: 900 }));

    await expect(Promise.all([firstRequest, secondRequest])).resolves.toEqual([
      { ok: true },
      { ok: true },
    ]);
    expect(
      fetchMock.mock.calls.filter(([url]) => url.endsWith('/api/auth/refresh')),
    ).toHaveLength(1);
  });

  it('refreshes once and retries the original request after a 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockResolvedValueOnce(jsonResponse({ accessToken: 'fresh-token', expiresIn: 900 }))
      .mockResolvedValueOnce(jsonResponse({ result: 'ok' }));
    vi.stubGlobal('fetch', fetchMock);
    setAdminAccessToken('expired-token');

    await expect(adminFetch<{ result: string }>('/api/admin/projects')).resolves.toEqual({
      result: 'ok',
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2]?.[1]).toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer fresh-token' }),
      }),
    );
  });

  it('forces logout when refresh fails', async () => {
    const forcedLogout = vi.fn();
    onForcedLogout(forcedLogout);
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce(jsonResponse({}, 401))
        .mockResolvedValueOnce(jsonResponse({ detail: 'expired session' }, 401)),
    );
    setAdminAccessToken('expired-token');

    await expect(adminFetch('/api/admin/projects')).rejects.toBeInstanceOf(Error);
    expect(forcedLogout).toHaveBeenCalledOnce();
  });

  it('forces logout after a second 401 following a successful refresh', async () => {
    const forcedLogout = vi.fn();
    onForcedLogout(forcedLogout);
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce(jsonResponse({}, 401))
        .mockResolvedValueOnce(jsonResponse({ accessToken: 'fresh-token', expiresIn: 900 }))
        .mockResolvedValueOnce(jsonResponse({}, 401)),
    );
    setAdminAccessToken('expired-token');

    await expect(adminFetch('/api/admin/projects')).rejects.toBeInstanceOf(Error);
    expect(forcedLogout).toHaveBeenCalledOnce();
  });
});
