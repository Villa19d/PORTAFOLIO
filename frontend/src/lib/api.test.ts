import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchApi, ApiError } from './api';

describe('api', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should map 400 error to ApiError', async () => {
    const mockProblem = {
      title: 'Bad Request',
      status: 400,
      detail: 'Validation failed',
      instance: '/api/contact'
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => mockProblem
    });

    await expect(fetchApi('/test')).rejects.toThrow(ApiError);
    await expect(fetchApi('/test')).rejects.toMatchObject({
      status: 400,
      problem: mockProblem
    });
  });

  it('should return data on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ hello: 'world' })
    });

    const data = await fetchApi('/test');
    expect(data).toEqual({ hello: 'world' });
  });
});
