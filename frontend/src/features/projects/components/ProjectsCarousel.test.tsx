import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import i18n from '../../../lib/i18n';
import type { Project } from '../types';
import { ProjectsCarousel } from './ProjectsCarousel';

const project: Project = {
  id: 'project-1',
  slug: 'project-1',
  title: { es: 'Proyecto', en: 'Project' },
  summary: { es: 'Resumen', en: 'Summary' },
  description: { es: 'Descripción', en: 'Description' },
  techStack: ['React'],
  imageUrl: 'https://example.com/project.webp',
  videoUrl: null,
  repoUrl: 'https://github.com/example/project',
  liveUrl: null,
  featured: true,
  published: true,
  displayOrder: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function renderCarousel(projects: Project[], isLoading: boolean) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ProjectsCarousel projects={projects} isLoading={isLoading} />
    </I18nextProvider>,
  );
}

describe('ProjectsCarousel', () => {
  it('renders three skeleton cards in the scroll track while loading', () => {
    renderCarousel([], true);

    expect(screen.getByTestId('projects-skeleton-grid')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });

  it('renders nothing when there are no projects and loading is complete', () => {
    const { container } = renderCarousel([], false);

    expect(container.firstChild).toBeNull();
  });

  it('renders one or two projects in a static centered layout', () => {
    const { container, rerender } = renderCarousel([project], false);

    expect(container.querySelector('.projects-static')).toBeInTheDocument();
    expect(screen.queryByTestId('projects-scroll-snap-track')).not.toBeInTheDocument();

    rerender(
      <I18nextProvider i18n={i18n}>
        <ProjectsCarousel
          projects={[project, { ...project, id: 'project-2', slug: 'project-2' }]}
          isLoading={false}
        />
      </I18nextProvider>,
    );

    expect(container.querySelector('.projects-static')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  it('uses the scroll-snap track when there are more than two projects', () => {
    const projects = [project, { ...project, id: 'project-2', slug: 'project-2' }, {
      ...project,
      id: 'project-3',
      slug: 'project-3',
    }];

    renderCarousel(projects, false);

    expect(screen.getByTestId('projects-scroll-snap-track')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });
});
