import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createAdminProject } from './adminProjectsApi';
import { adminProjectsQueryKey, useCreateAdminProject } from './useAdminProjects';

vi.mock('./adminProjectsApi', () => ({
  createAdminProject: vi.fn(),
  deleteAdminProject: vi.fn(),
  getAdminProjects: vi.fn(),
  updateAdminProject: vi.fn(),
}));

describe('useAdminProjects mutations', () => {
  it('invalidates the project list after creation', async () => {
    vi.mocked(createAdminProject).mockResolvedValue({} as never);
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useCreateAdminProject(), { wrapper });

    result.current.mutate({
      description: { en: 'Description', es: 'Descripción' },
      displayOrder: 1,
      featured: false,
      imageUrl: 'https://example.com/project.webp',
      liveUrl: null,
      published: false,
      repoUrl: 'https://github.com/example/project',
      slug: 'example-project',
      summary: { en: 'Summary', es: 'Resumen' },
      techStack: ['React'],
      title: { en: 'Example project', es: 'Proyecto de ejemplo' },
      videoUrl: null,
    });

    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: adminProjectsQueryKey }));
  });
});
