import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CursorLoader } from './CursorLoader';

const perf = vi.hoisted(() => ({ tier: 'full' as 'lite' | 'full' }));

vi.mock('../../hooks/usePerformanceTier', () => ({
  usePerformanceTier: () => perf.tier,
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
    expect(document.documentElement).not.toHaveClass('custom-cursor-active');
  });

  it('mounts the custom cursor in full tier on a capable desktop', async () => {
    const { container } = render(<CursorLoader />);

    await waitFor(() => {
      expect(container.querySelector('.custom-cursor-dot')).toBeInTheDocument();
    });
  });
});