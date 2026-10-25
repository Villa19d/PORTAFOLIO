import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectsView from './ProjectsView';

const mutateAsync = vi.fn().mockResolvedValue(undefined);
const project = {
  id: 'project-1',
  slug: 'project-1',
  title: { es: 'Proyecto uno', en: 'Project one' },
  summary: { es: 'Resumen', en: 'Summary' },
  description: { es: 'Descripción', en: 'Description' },
  techStack: ['React'],
  imageUrl: 'https://example.com/image.webp',
  videoUrl: null,
  repoUrl: 'https://github.com/example/project',
  liveUrl: null,
  featured: true,
  published: false,
  displayOrder: 1,
  createdAt: '',
  updatedAt: '',
};

vi.mock('./useAdminProjects', () => ({
  useAdminProjects: () => ({ data: [project], isLoading: false, isError: false }),
  useCreateAdminProject: () => ({ mutateAsync }),
  useUpdateAdminProject: () => ({ mutateAsync }),
  useDeleteAdminProject: () => ({ mutateAsync }),
}));

describe('ProjectsView', () => {
  beforeEach(() => mutateAsync.mockClear());

  it('renders projects and performs publish and delete actions', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<ProjectsView />);

    expect(screen.getByRole('cell', { name: 'Proyecto uno' })).toBeInTheDocument();
    expect(screen.getByText('El snapshot de respaldo del sitio se regenera en cada deploy de Vercel.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Publicar' }));
    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      id: 'project-1',
      project: expect.objectContaining({ published: true }),
    }));

    await user.click(screen.getByRole('button', { name: 'Borrar' }));
    expect(mutateAsync).toHaveBeenCalledWith('project-1');
  });
});
