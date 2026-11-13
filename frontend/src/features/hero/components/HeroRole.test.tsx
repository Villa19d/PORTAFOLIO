import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../lib/i18n';
import { HeroRole } from './HeroRole';
import * as capabilitiesModule from '../../../hooks/useCapabilities';

function renderRole() {
  return render(
    <I18nextProvider i18n={i18n}>
      <HeroRole />
    </I18nextProvider>,
  );
}

function mockCapabilities(canUseHeavyEffects: boolean) {
  return vi.spyOn(capabilitiesModule, 'useCapabilities').mockReturnValue({
    hasFinePointer: canUseHeavyEffects,
    isDesktopLayout: canUseHeavyEffects,
    prefersReducedMotion: false,
    canUseHeavyEffects,
    perfTier: 'full',
  });
}

describe('HeroRole gate', () => {
  beforeEach(() => {
    i18n.changeLanguage('es');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mounts the role canvas on capable desktops', () => {
    mockCapabilities(true);

    renderRole();

    expect(screen.getByTestId('hero-role')).toHaveAttribute('data-mode', 'canvas');
    expect(screen.getByTestId('hero-role-canvas')).toBeInTheDocument();
    expect(screen.getByText('Desarrollador Full-Stack', { selector: 'p' })).toBeInTheDocument();
  });

  it('keeps the plain paragraph when heavy effects are off', () => {
    mockCapabilities(false);

    renderRole();

    expect(screen.getByTestId('hero-role')).toHaveAttribute('data-mode', 'text');
    expect(screen.queryByTestId('hero-role-canvas')).not.toBeInTheDocument();
    expect(screen.getByText('Desarrollador Full-Stack', { selector: 'p' })).toBeInTheDocument();
  });
});
