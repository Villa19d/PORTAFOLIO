import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CursorLoader } from './CursorLoader';

const perf = vi.hoisted(() => ({ tier: 'full' as 'lite' | 'full' }));

vi.mock('../../hooks/usePerformanceTier', () => ({
  usePerformanceTier: () => perf.tier,
}));

vi.mock('./CustomCursor', () => ({
  CustomCursor: () => <div data-testid="custom-cursor" />,
}));

describe('CursorLoader performance tiers', () => {
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

  it('does not mount the custom cursor in lite tier', () => {
    perf.tier = 'lite';

    const { container } = render(<CursorLoader />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId('custom-cursor')).not.toBeInTheDocument();
  });

  it('mounts the custom cursor in full tier on a capable desktop', async () => {
    render(<CursorLoader />);

    expect(await screen.findByTestId('custom-cursor')).toBeInTheDocument();
  });
});