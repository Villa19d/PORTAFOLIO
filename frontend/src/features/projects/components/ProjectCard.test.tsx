import { fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../../lib/i18n';
import * as capabilitiesModule from '../../../hooks/useCapabilities';
import type { Project } from '../types';
import { ProjectCard } from './ProjectCard';

const project: Project = {
  id: 'project-1',
  slug: 'portfolio',
  title: { es: 'Mi Portafolio', en: 'My Portfolio' },
  summary: {
    es: 'Una descripción breve del proyecto que se puede extender a varias líneas.',
    en: 'A short project summary that may span several lines.',
  },
  description: { es: 'Descripción', en: 'Description' },
  techStack: ['React', 'TypeScript', 'Vite', 'Tailwind', 'Vitest', 'Playwright'],
  imageUrl: 'https://images.example.org/portfolio.webp',
  videoUrl: null,
  repoUrl: 'https://github.com/example/portfolio',
  liveUrl: 'https://example.org/portfolio',
  featured: true,
  published: true,
  displayOrder: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function renderCard(isActive = true) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ProjectCard project={project} isActive={isActive} />
    </I18nextProvider>,
  );
}

describe('ProjectCard', () => {
  beforeEach(() => {
    void i18n.changeLanguage('es');
  });

  it('replaces a failed image with deterministic placeholder art', () => {
    renderCard();

    fireEvent.error(screen.getByRole('img', { name: 'Imagen de Mi Portafolio' }));

    expect(screen.getByRole('img', { name: 'Mi Portafolio' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Imagen de Mi Portafolio' })).not.toBeInTheDocument();
  });

  it('marks all card links out of the tab order when inactive', () => {
    renderCard(false);

    expect(screen.getByRole('link', { name: 'Código' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('link', { name: 'Demo' })).toHaveAttribute('tabindex', '-1');
    expect(screen.queryByRole('button', { name: 'Ver detalle' })).not.toBeInTheDocument();
  });

  it('always renders TiltSurface and only toggles the enabled attribute', () => {
    vi.spyOn(capabilitiesModule, 'useCapabilities').mockReturnValue({
      hasFinePointer: true,
      isDesktopLayout: true,
      prefersReducedMotion: false,
      canUseHeavyEffects: true,
      perfTier: 'full',
    });
    const { container, rerender } = renderCard(true);

    const surface = container.querySelector<HTMLElement>('.tilt-surface');
    expect(surface).toBeInTheDocument();
    expect(surface).toHaveAttribute('data-tilt-enabled', 'true');

    rerender(
      <I18nextProvider i18n={i18n}>
        <ProjectCard project={project} isActive={false} />
      </I18nextProvider>,
    );

    const surfaceAfter = container.querySelector<HTMLElement>('.tilt-surface');
    expect(surfaceAfter).toBe(surface);
    expect(surfaceAfter).toHaveAttribute('data-tilt-enabled', 'false');
  });

  it('keeps TiltSurface mounted when the tier transitions from full to lite', () => {
    const capabilitiesSpy = vi.spyOn(capabilitiesModule, 'useCapabilities').mockReturnValue({
      hasFinePointer: true,
      isDesktopLayout: true,
      prefersReducedMotion: false,
      canUseHeavyEffects: true,
      perfTier: 'full',
    });
    const { container, rerender } = renderCard(true);

    const surface = container.querySelector<HTMLElement>('.tilt-surface');
    expect(surface).toHaveAttribute('data-tilt-enabled', 'true');

    capabilitiesSpy.mockReturnValue({
      hasFinePointer: true,
      isDesktopLayout: true,
      prefersReducedMotion: false,
      canUseHeavyEffects: false,
      perfTier: 'lite',
    });

    rerender(
      <I18nextProvider i18n={i18n}>
        <ProjectCard project={project} isActive={true} />
      </I18nextProvider>,
    );

    const surfaceAfter = container.querySelector<HTMLElement>('.tilt-surface');
    expect(surfaceAfter).toBe(surface);
    expect(surfaceAfter).toHaveAttribute('data-tilt-enabled', 'false');
  });

  it('does not enable TiltSurface when prefers-reduced-motion disables heavy effects', () => {
    vi.spyOn(capabilitiesModule, 'useCapabilities').mockReturnValue({
      hasFinePointer: true,
      isDesktopLayout: true,
      prefersReducedMotion: true,
      canUseHeavyEffects: false,
      perfTier: 'full',
    });

    const { container } = renderCard();

    const surface = container.querySelector<HTMLElement>('.tilt-surface');
    expect(surface).toBeInTheDocument();
    expect(surface).toHaveAttribute('data-tilt-enabled', 'false');
  });

  it('does not enable TiltSurface in lite tier', () => {
    vi.spyOn(capabilitiesModule, 'useCapabilities').mockReturnValue({
      hasFinePointer: true,
      isDesktopLayout: true,
      prefersReducedMotion: false,
      canUseHeavyEffects: false,
      perfTier: 'lite',
    });

    const { container } = renderCard();

    const surface = container.querySelector<HTMLElement>('.tilt-surface');
    expect(surface).toBeInTheDocument();
    expect(surface).toHaveAttribute('data-tilt-enabled', 'false');
  });

  it('shows at most five technologies and a remaining-count chip', () => {
    renderCard();

    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
  });

    it('shows the video badge only when the project has a YouTube video', () => {
    const { container, rerender } = renderCard();
    expect(container.querySelector('.project-card__video-badge')).not.toBeInTheDocument();

    rerender(
      <I18nextProvider i18n={i18n}>
        <ProjectCard
          project={{ ...project, media: [{ type: 'YOUTUBE', url: 'https://youtu.be/abc123_DEF' }] }}
        />
      </I18nextProvider>,
    );
    expect(container.querySelector('.project-card__video-badge')).toBeInTheDocument();
    expect(screen.getByText('Incluye video')).toBeInTheDocument();
  });

  it('uses the repo label when there is a single labelled repo', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ProjectCard project={{ ...project, repos: [{ label: 'Backend', url: project.repoUrl }] }} />
      </I18nextProvider>,
    );

    expect(screen.getByRole('link', { name: 'Backend' })).toHaveAttribute('href', project.repoUrl);
  });

  it('collapses several repos into a single "Código · 2" button that is out of the tab order when inactive', () => {
    const multi: Project = {
      ...project,
      repos: [
        { label: 'Frontend', url: 'https://github.com/example/front' },
        { label: 'Backend', url: 'https://github.com/example/back' },
      ],
    };
    const { rerender } = render(
      <I18nextProvider i18n={i18n}>
        <ProjectCard project={multi} />
      </I18nextProvider>,
    );

    expect(screen.getByRole('button', { name: 'Ver los 2 repositorios' })).toHaveTextContent('Código · 2');
    expect(screen.queryByRole('link', { name: 'Código' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Frontend' })).not.toBeInTheDocument();

    rerender(
      <I18nextProvider i18n={i18n}>
        <ProjectCard project={multi} isActive={false} />
      </I18nextProvider>,
    );
    expect(screen.getByRole('button', { name: 'Ver los 2 repositorios' })).toHaveAttribute('tabindex', '-1');
  });
});