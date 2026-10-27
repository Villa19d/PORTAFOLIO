import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HeroBackground } from './HeroBackground';

const perf = vi.hoisted(() => ({ tier: 'full' as 'lite' | 'full' }));

vi.mock('../../../hooks/usePerformanceTier', () => ({
  usePerformanceTier: () => perf.tier,
}));

describe('HeroBackground performance tiers', () => {
  beforeEach(() => {
    perf.tier = 'full';
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query === '(hover: hover) and (pointer: fine)' || query === '(min-width: 1024px)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    vi.stubGlobal('navigator', { connection: { saveData: false } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mounts the spotlight in full tier on a capable desktop', () => {
    render(<HeroBackground containerRef={createRef<HTMLElement>()} />);

    expect(screen.getByTestId('hero-spotlight')).toBeInTheDocument();
  });

  it('does not mount the spotlight in lite tier but keeps the background', () => {
    perf.tier = 'lite';

    render(<HeroBackground containerRef={createRef<HTMLElement>()} />);

    expect(screen.queryByTestId('hero-spotlight')).not.toBeInTheDocument();
    expect(screen.getByTestId('hero-background')).toHaveClass('hero-background');
  });
});