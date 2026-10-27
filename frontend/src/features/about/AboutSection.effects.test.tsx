import { cleanup, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCapabilities } from '../../hooks/useCapabilities';
import i18n from '../../lib/i18n';
import { AboutSection } from './AboutSection';

const { useCapabilitiesMock } = vi.hoisted(() => ({
  useCapabilitiesMock: vi.fn(),
}));

vi.mock('../../hooks/useCapabilities', () => ({
  useCapabilities: useCapabilitiesMock,
}));

const desktopCapabilities = {
  hasFinePointer: true,
  isDesktopLayout: true,
  prefersReducedMotion: false,
  canUseHeavyEffects: true,
  perfTier: 'full' as const,
};

beforeEach(() => {
  vi.mocked(useCapabilities).mockReturnValue({
    ...desktopCapabilities,
    hasFinePointer: false,
    isDesktopLayout: false,
    canUseHeavyEffects: false,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('AboutSection deferred glow', () => {
  it('does not mount the glow overlay when heavy effects are unavailable', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AboutSection />
      </I18nextProvider>,
    );

    expect(screen.queryByTestId('bento-glow-overlay')).not.toBeInTheDocument();
  });

  it('mounts the glow overlay when heavy effects are available', async () => {
    vi.mocked(useCapabilities).mockReturnValue(desktopCapabilities);

    render(
      <I18nextProvider i18n={i18n}>
        <AboutSection />
      </I18nextProvider>,
    );

    expect(await screen.findByTestId('bento-glow-overlay')).toBeInTheDocument();
  });
});