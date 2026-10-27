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
    </I18nextProvider>
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

  it('mounts TiltSurface only for an active card when heavy effects are supported', () => {
    vi.spyOn(capabilitiesModule, 'useCapabilities').mockReturnValue({
      hasFinePointer: true,
      isDesktopLayout: true,
      prefersReducedMotion: false,
      canUseHeavyEffects: true,
      perfTier: 'full',
    });
    const { container, rerender } = renderCard();

    expect(container.querySelector('article.project-card > .tilt-surface')).toBeInTheDocument();

    rerender(
      <I18nextProvider i18n={i18n}>
        <ProjectCard project={project} isActive={false} />
      </I18nextProvider>,
    );
    expect(container.querySelector('.tilt-surface')).not.toBeInTheDocument();
  });

  it('does not mount TiltSurface when reduced motion disables heavy effects', () => {
    vi.spyOn(capabilitiesModule, 'useCapabilities').mockReturnValue({
      hasFinePointer: true,
      isDesktopLayout: true,
      prefersReducedMotion: true,
      canUseHeavyEffects: false,
      perfTier: 'full',
    });

    const { container } = renderCard();

    expect(container.querySelector('.tilt-surface')).not.toBeInTheDocument();
  });

  it('does not mount TiltSurface in lite tier', () => {
    vi.spyOn(capabilitiesModule, 'useCapabilities').mockReturnValue({
      hasFinePointer: true,
      isDesktopLayout: true,
      prefersReducedMotion: false,
      canUseHeavyEffects: false,
      perfTier: 'lite',
    });

    const { container } = renderCard();

    expect(container.querySelector('.tilt-surface')).not.toBeInTheDocument();
  });

  it('shows at most five technologies and a remaining-count chip', () => {
    renderCard();

    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
  });
});