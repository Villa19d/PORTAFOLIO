import { describe, it, expect, vi } from 'vitest';
import { fetchProjectsWithRetry } from './snapshot-projects.mjs';

describe('snapshot-projects script', () => {
  it('should retry on failure and throw if all fail', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500
    });

    await expect(fetchProjectsWithRetry('http://localhost', 2, 1000)).rejects.toThrow('HTTP error! status: 500');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should return data on success', async () => {
    const mockData = [{ id: '1', slug: 'p1' }];
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500 }) // fail first
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

    const data = await fetchProjectsWithRetry('http://localhost', 2, 1000);
    expect(data).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
