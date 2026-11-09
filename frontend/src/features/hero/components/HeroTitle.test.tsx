import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../lib/i18n';
import { HeroTitle } from './HeroTitle';
import * as capabilitiesModule from '../../../hooks/useCapabilities';

function renderTitle() {
  return render(
    <I18nextProvider i18n={i18n}>
      <HeroTitle />
    </I18nextProvider>,
  );
}

function mockCapabilities(overrides: {
  hasFinePointer: boolean;
  isDesktopLayout: boolean;
  prefersReducedMotion: boolean;
  canUseHeavyEffects: boolean;
}) {
  return vi.spyOn(capabilitiesModule, 'useCapabilities').mockReturnValue({
    ...overrides,
    perfTier: 'full',
  });
}

describe('HeroTitle gate', () => {
  beforeEach(() => {
    i18n.changeLanguage('es');
    window.sessionStorage.clear();
    // Pretend the BootIntro already ran so the intro gate settles immediately.
    window.sessionStorage.setItem('boot_intro_seen', '1');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it('mounts the lazy canvas layer on capable desktops', () => {
    mockCapabilities({
      hasFinePointer: true,
      isDesktopLayout: true,
      prefersReducedMotion: false,
      canUseHeavyEffects: true,
    });

    renderTitle();

    expect(screen.getByTestId('hero-title')).toHaveAttribute('data-mode', 'canvas');
    expect(screen.getByTestId('hero-title-canvas')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Rodrigo Del Villar');
  });

  it('falls back to the HTML typewriter when heavy effects are off', () => {
    mockCapabilities({
      hasFinePointer: false,
      isDesktopLayout: false,
      prefersReducedMotion: false,
      canUseHeavyEffects: false,
    });

    renderTitle();

    expect(screen.getByTestId('hero-title')).toHaveAttribute('data-mode', 'typewriter');
    expect(screen.queryByTestId('hero-title-canvas')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Rodrigo Del Villar');
  });

  it('keeps the name static and does not animate under reduced motion', () => {
    mockCapabilities({
      hasFinePointer: true,
      isDesktopLayout: true,
      prefersReducedMotion: true,
      canUseHeavyEffects: false,
    });

    renderTitle();

    expect(screen.getByTestId('hero-title')).toHaveAttribute('data-mode', 'static');
    expect(document.querySelector('.hero-title__caret')).toBeNull();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Rodrigo Del Villar');
  });
});
