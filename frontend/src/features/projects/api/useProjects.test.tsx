import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import projectsSnapshot from '../../../data/projects.snapshot.json';
import * as api from '../../../lib/api';
import { useProjects } from './useProjects';

vi.mock('../../../lib/api', () => ({
  fetchApi: vi.fn(),
  API_BASE_URL: '',
}));

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads the bundled snapshot immediately and keeps the source as snapshot', async () => {
    const liveData = [
      {
        id: 'live-1',
        slug: 'live-1',
        title: { es: 'En vivo', en: 'Live' },
        summary: { es: 'Resumen', en: 'Summary' },
        description: { es: 'Descripción', en: 'Description' },
        techStack: [],
        imageUrl: '',
        videoUrl: null,
        repoUrl: '',
        liveUrl: null,
        featured: false,
        published: true,
        displayOrder: 0,
        createdAt: '',
        updatedAt: '',
      },
    ];

    vi.mocked(api.fetchApi).mockResolvedValue(liveData);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: Infinity,
        },
      },
    });

    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result, rerender } = renderHook(() => useProjects(), { wrapper });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual(projectsSnapshot);
    expect(queryClient.getQueryData(['projects'])).toEqual(projectsSnapshot);
    expect(result.current.source).toBe('snapshot');
    expect(api.fetchApi).not.toHaveBeenCalled();

    await new Promise<void>((resolve) => window.setTimeout(resolve, 25));
    rerender();

    expect(result.current.data).toEqual(projectsSnapshot);
    expect(result.current.source).toBe('snapshot');
    expect(api.fetchApi).not.toHaveBeenCalled();

    queryClient.clear();
  });
});
