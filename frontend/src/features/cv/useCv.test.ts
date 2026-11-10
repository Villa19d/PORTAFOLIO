import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fetchApi } = vi.hoisted(() => ({ fetchApi: vi.fn() }));

vi.mock('../../lib/api', () => ({ fetchApi }));

const liveCv = {
  en: null,
  es: {
    fileName: 'cv.pdf',
    updatedAt: '2026-10-24T18:00:00Z',
    url: 'https://res.cloudinary.com/demo/raw/upload/v1/portfolio/cv/cv.pdf',
  },
};

describe('useCv', () => {
  beforeEach(() => {
    vi.resetModules();
    fetchApi.mockReset();
  });

  it('starts from the snapshot and replaces it with the live response', async () => {
    fetchApi.mockResolvedValue(liveCv);
    const { useCv } = await import('./useCv');
    const { result } = renderHook(() => useCv());

    expect(result.current.cv).toEqual({ en: null, es: null });

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.cv).toEqual(liveCv);
  });

  it('keeps the snapshot and reports an error when the request fails', async () => {
    fetchApi.mockRejectedValue(new Error('offline'));
    const { useCv } = await import('./useCv');
    const { result } = renderHook(() => useCv());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.cv).toEqual({ en: null, es: null });
  });

  it('reuses the module cache on remount without another request', async () => {
    fetchApi.mockResolvedValue(liveCv);
    const { useCv } = await import('./useCv');

    const first = renderHook(() => useCv());
    await waitFor(() => expect(first.result.current.status).toBe('ready'));

    const second = renderHook(() => useCv());
    expect(second.result.current.status).toBe('ready');
    expect(fetchApi).toHaveBeenCalledTimes(1);
  });
});
