import { cleanup, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../../lib/i18n';
import { BentoGrid } from './BentoGrid';
import { BentoTile } from './BentoTile';

const entrance = vi.hoisted(() => ({ skipEntrance: true }));

vi.mock('../../../hooks/useEntranceMotion', () => ({
  useEntranceMotion: () => ({ skipEntrance: entrance.skipEntrance }),
}));

const capabilities = vi.hoisted(() => ({
  value: {
    hasFinePointer: true,
    isDesktopLayout: true,
    prefersReducedMotion: false,
    canUseHeavyEffects: true,
    perfTier: 'full' as 'full' | 'lite',
  },
}));

vi.mock('../../../hooks/useCapabilities', () => ({
  useCapabilities: () => capabilities.value,
}));

afterEach(() => {
  cleanup();
});

describe('BentoGrid motion preferences', () => {
  beforeEach(() => {
    entrance.skipEntrance = true;
    capabilities.value = {
      hasFinePointer: true,
      isDesktopLayout: true,
      prefersReducedMotion: false,
      canUseHeavyEffects: true,
      perfTier: 'full',
    };
  });

  it('does not hide tiles for the reveal animation when entrance motion is skipped', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <BentoGrid>
          <BentoTile label="Intro tile">
            <p>Profile intro</p>
          </BentoTile>
        </BentoGrid>
      </I18nextProvider>,
    );

    const tile = screen.getByRole('region', { name: 'Intro tile' });
    expect(tile.style.opacity).not.toBe('0');
    expect(tile.style.transform).not.toContain('12px');
  });

  it('forces the final visible state on tiles when entrance motion is skipped (regression: About empty in lite)', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <BentoGrid>
          <BentoTile label="Intro tile">
            <p>Profile intro</p>
          </BentoTile>
        </BentoGrid>
      </I18nextProvider>,
    );

    const tile = screen.getByRole('region', { name: 'Intro tile' });
    // With skipEntrance=true, BentoTile applies animate={{ opacity: 1, y: 0 }}
    // and initial={false}, so the tile must not stay at opacity: 0 nor at
    // translateY(12px). Motion may set the style asynchronously on the very
    // first tick, but by the time the assertion runs it must already be at
    // the final state (no animation is requested, so it's synchronous).
    const opacity = tile.style.opacity;
    expect(opacity === '' || opacity === '1').toBe(true);
    const transform = tile.style.transform;
    expect(transform === '' || transform === 'none' || !transform.includes('12px')).toBe(true);
  });

  it('re-renders without crashing when skipEntrance flips from false to true', () => {
    entrance.skipEntrance = false;

    const { rerender } = render(
      <I18nextProvider i18n={i18n}>
        <BentoGrid>
          <BentoTile label="Intro tile">
            <p>Profile intro</p>
          </BentoTile>
        </BentoGrid>
      </I18nextProvider>,
    );

    entrance.skipEntrance = true;

    rerender(
      <I18nextProvider i18n={i18n}>
        <BentoGrid>
          <BentoTile label="Intro tile">
            <p>Profile intro</p>
          </BentoTile>
        </BentoGrid>
      </I18nextProvider>,
    );

    // The tile must still be in the DOM after the flip. (We don't assert on
    // inline styles here because motion applies `animate` asynchronously in
    // jsdom; the deterministic style assertion lives in the previous test
    // where skipEntrance is true from the start.)
    expect(screen.getByRole('region', { name: 'Intro tile' })).toBeInTheDocument();
  });
});