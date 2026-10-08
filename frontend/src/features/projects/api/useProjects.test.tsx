import { renderHook, waitFor } from '@testing-library/react';
import { useProjects } from './useProjects';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '../../../lib/api';
import React from 'react';

vi.mock('../../../lib/api', () => ({
  fetchApi: vi.fn(),
  API_BASE_URL: ''
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false }
  }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('useProjects', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('should deliver snapshot first, then live data', async () => {
    const liveData = [{ id: 'live-1', slug: 'live-1', title: { es: 'Live', en: 'Live' } }];
    let resolveLive: (val: unknown) => void;
    const promise = new Promise(resolve => {
      resolveLive = resolve;
    });

    vi.mocked(api.fetchApi).mockReturnValue(promise as Promise<never>);

    const { result } = renderHook(() => useProjects(), { wrapper });

    // Initial state: uses snapshot
    expect(result.current.source).toBe('snapshot');
    expect(result.current.data?.length).toBeGreaterThan(0); // From placeholder

    // Resolve live data
    resolveLive!(liveData);

    await waitFor(() => {
      expect(result.current.source).toBe('live');
    });

    expect(result.current.data).toEqual(liveData);
  });
});
