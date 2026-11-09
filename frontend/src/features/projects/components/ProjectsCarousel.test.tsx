import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../../lib/i18n';
import type { Project } from '../types';
import { ProjectsCarousel } from './ProjectsCarousel';
// Warms the lazy carousel chunk: the assertions below must not depend on a cold
// module transform (that is what `Suspense` already covers in the browser).
import './ProjectCarouselTrack';

// Capabilities drive the effect tier: `false` is the lite tier the app uses on touch
// devices, reduced motion and `?perf=lite`; `true` is the full (desktop) tier.
const capabilities = vi.hoisted(() => ({ canUseHeavyEffects: false, prefersReducedMotion: false }));

vi.mock('../../../hooks/useCapabilities', () => ({
  useCapabilities: () => ({ ...capabilities }),
}));

const WAIT = { timeout: 5_000 };

const baseProject: Project = {
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

function makeProjects(count: number): Project[] {
  return Array.from({ length: count }, (_, index) => ({
    ...baseProject,
    id: `project-${index + 1}`,
    slug: `project-${index + 1}`,
    displayOrder: index + 1,
  }));
}

function renderCarousel(projects: Project[], isLoading = false) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ProjectsCarousel projects={projects} isLoading={isLoading} />
    </I18nextProvider>,
  );
}

describe('ProjectsCarousel', () => {
  beforeEach(() => {
    void i18n.changeLanguage('es');
    capabilities.canUseHeavyEffects = false;
    capabilities.prefersReducedMotion = false;
  });

  it('renders three skeleton cards in the scroll track while loading', () => {
    renderCarousel([], true);

    expect(screen.getByTestId('projects-skeleton-grid')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });

  it('renders nothing when there are no projects and loading is complete', () => {
    const { container } = renderCarousel([], false);

    expect(container.firstChild).toBeNull();
  });

  it('centres a single project', () => {
    const { container } = renderCarousel(makeProjects(1));

    const stack = container.querySelector('.project-stack');
    expect(stack).toBeInTheDocument();
    expect(stack).toHaveAttribute('data-layout', 'single');
    expect(stack).toHaveAttribute('data-count', '1');
    expect(container.querySelectorAll('.project-stack > .project-card')).toHaveLength(1);
    expect(container.querySelector('.projects-carousel')).not.toBeInTheDocument();
  });

  it('places two projects side by side without loop or autoplay', () => {
    const { container } = renderCarousel(makeProjects(2));

    const stack = container.querySelector('.project-stack');
    expect(stack).toHaveAttribute('data-layout', 'duo');
    expect(stack).toHaveAttribute('data-count', '2');
    expect(container.querySelectorAll('.project-stack > .project-card')).toHaveLength(2);
    expect(container.querySelector('.swiper-slide')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Pausar el avance automático' }),
    ).not.toBeInTheDocument();
  });

  it('renders three projects in the carousel without duplicating slides', async () => {
    const { container } = renderCarousel(makeProjects(3));

    await waitFor(() => expect(container.querySelectorAll('.swiper-slide')).toHaveLength(3), WAIT);

    expect(container.querySelector('.projects-carousel')).toHaveAttribute('data-layout', 'carousel');
    expect(container.querySelector('.project-stack')).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(container.querySelector('.project-carousel')).toBeInTheDocument();
  });

  it('renders four or more projects in the same carousel', async () => {
    const { container } = renderCarousel(makeProjects(5));

    await waitFor(() => expect(container.querySelectorAll('.swiper-slide')).toHaveLength(5), WAIT);

    expect(container.querySelector('.projects-carousel')).toHaveAttribute('data-layout', 'carousel');
    expect(screen.getAllByRole('article')).toHaveLength(5);
  });

  it('keeps the lite tier free of effect overlays', async () => {
    const { container } = renderCarousel(makeProjects(3));

    await waitFor(() => expect(container.querySelectorAll('.swiper-slide')).toHaveLength(3), WAIT);

    const carousel = container.querySelector('.project-carousel');
    expect(carousel).toHaveAttribute('data-effects', 'false');
    expect(container.querySelectorAll('.project-carousel__sweep')).toHaveLength(0);
    expect(container.querySelectorAll('.project-carousel__ghost')).toHaveLength(0);
    expect(container.querySelectorAll('.project-carousel__veil')).toHaveLength(0);
    expect(
      screen.queryByRole('button', { name: 'Pausar el avance automático' }),
    ).not.toBeInTheDocument();
    // The structure of the full tier stays: one frame per slide with the active one marked.
    expect(container.querySelectorAll('.project-carousel__frame')).toHaveLength(3);
    expect(container.querySelectorAll('[data-active="true"]')).toHaveLength(1);
  });

  it('mounts the effect overlays and the autoplay control only in the full tier', async () => {
    capabilities.canUseHeavyEffects = true;

    const { container } = renderCarousel(makeProjects(3));

    await waitFor(() => expect(container.querySelectorAll('.swiper-slide')).toHaveLength(3), WAIT);

    expect(container.querySelector('.project-carousel')).toHaveAttribute('data-effects', 'true');
    expect(container.querySelectorAll('.project-carousel__sweep')).toHaveLength(3);
    expect(container.querySelectorAll('.project-carousel__ghost')).toHaveLength(6);
    expect(container.querySelectorAll('.project-carousel__veil')).toHaveLength(3);
    expect(
      screen.getByRole('button', { name: 'Pausar el avance automático' }),
    ).toBeInTheDocument();
  });

  it('toggles autoplay with the pause button, which never pauses itself by focus', async () => {
    capabilities.canUseHeavyEffects = true;

    const { container } = renderCarousel(makeProjects(3));

    await waitFor(() => expect(container.querySelectorAll('.swiper-slide')).toHaveLength(3), WAIT);

    fireEvent.click(screen.getByRole('button', { name: 'Pausar el avance automático' }));

    const resume = screen.getByRole('button', { name: 'Reanudar el avance automático' });
    expect(resume).toBeInTheDocument();

    fireEvent.click(resume);

    expect(
      screen.getByRole('button', { name: 'Pausar el avance automático' }),
    ).toBeInTheDocument();
  });
});

