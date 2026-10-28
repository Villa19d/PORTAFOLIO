import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Lenis from 'lenis';
import { SmoothScrollProvider } from './SmoothScrollProvider';

vi.mock('lenis', () => ({
  default: vi.fn(function () {
    return {
      destroy: vi.fn(),
      scrollTo: vi.fn(),
      stop: vi.fn(),
      start: vi.fn(),
    };
  }),
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

vi.mock('../hooks/useCapabilities', () => ({
  useCapabilities: () => capabilities.value,
}));

const LenisMock = vi.mocked(Lenis);

describe('SmoothScrollProvider Lenis lifecycle', () => {
  beforeEach(() => {
    LenisMock.mockClear();
    capabilities.value = {
      hasFinePointer: true,
      isDesktopLayout: true,
      prefersReducedMotion: false,
      canUseHeavyEffects: true,
      perfTier: 'full',
    };
    document.documentElement.className = '';
  });

  afterEach(() => {
    cleanup();
  });

  it('does not construct Lenis in lite tier', () => {
    capabilities.value = { ...capabilities.value, perfTier: 'lite', canUseHeavyEffects: false };
    render(
      <SmoothScrollProvider>
        <div />
      </SmoothScrollProvider>,
    );
    expect(LenisMock).not.toHaveBeenCalled();
  });

  it('does not construct Lenis when prefers-reduced-motion is set', () => {
    capabilities.value = {
      ...capabilities.value,
      prefersReducedMotion: true,
      canUseHeavyEffects: false,
    };
    render(
      <SmoothScrollProvider>
        <div />
      </SmoothScrollProvider>,
    );
    expect(LenisMock).not.toHaveBeenCalled();
  });

  it('constructs Lenis in full tier', () => {
    render(
      <SmoothScrollProvider>
        <div />
      </SmoothScrollProvider>,
    );
    expect(LenisMock).toHaveBeenCalledTimes(1);
  });

  it('destroys Lenis and clears html classes when tier changes to lite', () => {
    const { rerender } = render(
      <SmoothScrollProvider>
        <div />
      </SmoothScrollProvider>,
    );
    expect(LenisMock).toHaveBeenCalledTimes(1);
    const instance = LenisMock.mock.results[0]?.value as { destroy: () => void };

    document.documentElement.classList.add('lenis', 'lenis-smooth');

    capabilities.value = { ...capabilities.value, perfTier: 'lite', canUseHeavyEffects: false };
    rerender(
      <SmoothScrollProvider>
        <div />
      </SmoothScrollProvider>,
    );

    expect(instance.destroy).toHaveBeenCalled();
    expect(document.documentElement.classList.contains('lenis')).toBe(false);
    expect(document.documentElement.classList.contains('lenis-smooth')).toBe(false);
  });
});
