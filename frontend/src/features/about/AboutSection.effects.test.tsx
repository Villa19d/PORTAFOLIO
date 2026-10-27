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

  it('keeps the glow overlay mounted but disabled when transitioning to lite', async () => {
    vi.mocked(useCapabilities).mockReturnValue(desktopCapabilities);

    const { rerender } = render(
      <I18nextProvider i18n={i18n}>
        <AboutSection />
      </I18nextProvider>,
    );

    const glow = await screen.findByTestId('bento-glow-overlay');
    expect(glow).toHaveAttribute('data-glow-enabled', 'true');

    vi.mocked(useCapabilities).mockReturnValue({
      ...desktopCapabilities,
      canUseHeavyEffects: false,
      perfTier: 'lite',
    });

    rerender(
      <I18nextProvider i18n={i18n}>
        <AboutSection />
      </I18nextProvider>,
    );

    const glowAfter = screen.getByTestId('bento-glow-overlay');
    expect(glowAfter).toBe(glow);
    expect(glowAfter).toHaveAttribute('data-glow-enabled', 'false');
  });
});