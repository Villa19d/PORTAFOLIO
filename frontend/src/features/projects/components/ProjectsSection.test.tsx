import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../../lib/i18n';
import type { Project } from '../types';
import { ProjectsSection } from './ProjectsSection';

const { useProjectsMock } = vi.hoisted(() => ({
  useProjectsMock: vi.fn(),
}));

vi.mock('../api/useProjects', () => ({
  useProjects: useProjectsMock,
}));

const project: Project = {
  id: 'project-1',
  slug: 'portfolio',
  title: { es: 'Mi Portafolio', en: 'My Portfolio' },
  summary: { es: 'Descripción breve', en: 'Short summary' },
  description: { es: 'Descripción', en: 'Description' },
  techStack: ['React'],
  imageUrl: 'https://example.com/portfolio.webp',
  videoUrl: null,
  repoUrl: 'https://github.com/example/portfolio',
  liveUrl: null,
  featured: true,
  published: true,
  displayOrder: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function renderSection() {
  return render(
    <I18nextProvider i18n={i18n}>
      <ProjectsSection />
    </I18nextProvider>
  );
}

describe('ProjectsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    void i18n.changeLanguage('es');
  });

  it('shows the skeleton grid when project data is unavailable', () => {
    useProjectsMock.mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isPending: true,
      isPlaceholderData: false,
    });

    renderSection();

    expect(screen.getByTestId('projects-skeleton-grid')).toBeInTheDocument();
    expect(screen.getAllByRole('article', { name: 'Cargando proyecto' })).toHaveLength(3);
  });

  it('shows project cards when project data is available', () => {
    useProjectsMock.mockReturnValue({
      data: [project],
      error: null,
      isError: false,
      isPending: false,
      isPlaceholderData: false,
    });

    renderSection();

    expect(screen.getByRole('heading', { name: 'Mi Portafolio' })).toBeInTheDocument();
    expect(screen.queryByTestId('projects-skeleton-grid')).not.toBeInTheDocument();
  });

  it('shows a localized empty state after a successful empty response', () => {
    useProjectsMock.mockReturnValue({
      data: [],
      error: null,
      isError: false,
      isPending: false,
      isPlaceholderData: false,
    });

    renderSection();

    expect(screen.getByRole('status')).toHaveTextContent('Aún no hay proyectos publicados.');
  });

  it('routes query errors through the shared error boundary', () => {
    useProjectsMock.mockReturnValue({
      data: undefined,
      error: new Error('Request failed'),
      isError: true,
      isPending: false,
      isPlaceholderData: false,
    });

    renderSection();

    expect(screen.getByText('We could not load this section.')).toBeInTheDocument();
  });
});
