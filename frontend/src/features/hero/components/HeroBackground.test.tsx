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

  it('renders the spotlight enabled in full tier on a capable desktop', () => {
    render(<HeroBackground containerRef={createRef<HTMLElement>()} />);

    const spotlight = screen.getByTestId('hero-spotlight');
    expect(spotlight).toBeInTheDocument();
    expect(spotlight).toHaveAttribute('data-spotlight-enabled', 'true');
  });

  it('keeps the spotlight mounted but disabled in lite tier', () => {
    perf.tier = 'lite';

    render(<HeroBackground containerRef={createRef<HTMLElement>()} />);

    const spotlight = screen.getByTestId('hero-spotlight');
    expect(spotlight).toBeInTheDocument();
    expect(spotlight).toHaveAttribute('data-spotlight-enabled', 'false');
    expect(screen.getByTestId('hero-background')).toHaveClass('hero-background');
  });

  it('does not unmount the spotlight node when tier changes from full to lite', () => {
    const { rerender } = render(<HeroBackground containerRef={createRef<HTMLElement>()} />);
    const first = screen.getByTestId('hero-spotlight');
    expect(first).toHaveAttribute('data-spotlight-enabled', 'true');

    perf.tier = 'lite';
    rerender(<HeroBackground containerRef={createRef<HTMLElement>()} />);

    const second = screen.getByTestId('hero-spotlight');
    expect(second).toBe(first);
    expect(second).toHaveAttribute('data-spotlight-enabled', 'false');
  });
});