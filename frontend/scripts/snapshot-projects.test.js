import { describe, it, expect, vi } from 'vitest';
import { fetchProjectsWithRetry } from './snapshot-projects.mjs';

describe('snapshot-projects script', () => {
  it('should retry on failure and exhaust budget', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500
    });

    let time = 0;
    const mockGetTime = () => time;
    const mockDelay = async (ms) => { time += ms; };
    
    // Budget 90s, retry 10s. Should take around 9 tries.
    const result = await fetchProjectsWithRetry('http://localhost', 90000, 10000, 20000, mockDelay, mockGetTime);
    
    expect(result).toEqual({ action: 'KEEP_EXISTING', reason: 'BUDGET_EXHAUSTED' });
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should return KEEP_EXISTING if empty array is returned', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => []
    });

    let time = 0;
    const mockGetTime = () => time;
    const mockDelay = async (ms) => { time += ms; };

    const result = await fetchProjectsWithRetry('http://localhost', 90000, 10000, 20000, mockDelay, mockGetTime);
    expect(result).toEqual({ action: 'KEEP_EXISTING', reason: 'EMPTY_ARRAY' });
  });
  
  it('should throw or retry if missing required keys', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ slug: 'p1' }] // missing title, techStack, etc.
    });

    let time = 0;
    const mockGetTime = () => time;
    const mockDelay = async (ms) => { time += ms; };

    const result = await fetchProjectsWithRetry('http://localhost', 90000, 10000, 20000, mockDelay, mockGetTime);
    expect(result).toEqual({ action: 'KEEP_EXISTING', reason: 'BUDGET_EXHAUSTED' });
  });

  it('should return UPDATE with data on success', async () => {
    const mockData = [{ 
      id: '1', 
      slug: 'p1', 
      title: { es: 'E', en: 'E' }, 
      techStack: ['T'], 
      imageUrl: 'img', 
      repoUrl: 'repo' 
    }];
    
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500 }) // fail first
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

    let time = 0;
    const mockGetTime = () => time;
    const mockDelay = async (ms) => { time += ms; };

    const result = await fetchProjectsWithRetry('http://localhost', 90000, 10000, 20000, mockDelay, mockGetTime);
    expect(result).toEqual({ action: 'UPDATE', data: mockData });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
