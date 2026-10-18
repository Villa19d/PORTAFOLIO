import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCapabilities } from '../../hooks/useCapabilities';
import { CursorLoader } from './CursorLoader';

const { useCapabilitiesMock, renderCursorMock } = vi.hoisted(() => ({
  useCapabilitiesMock: vi.fn(),
  renderCursorMock: vi.fn(),
}));

vi.mock('../../hooks/useCapabilities', () => ({
  useCapabilities: useCapabilitiesMock,
}));

vi.mock('./CustomCursor', () => ({
  CustomCursor: () => {
    renderCursorMock();
    return <div data-testid="custom-cursor" />;
  },
}));

describe('CursorLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCapabilities).mockReturnValue({
      hasFinePointer: false,
      isDesktopLayout: false,
      prefersReducedMotion: true,
      canUseHeavyEffects: false,
    });
  });

  it('does not load or render the cursor when heavy effects are unavailable', () => {
    render(<CursorLoader />);

    expect(screen.queryByTestId('custom-cursor')).not.toBeInTheDocument();
    expect(renderCursorMock).not.toHaveBeenCalled();
  });

  it('loads the cursor only when heavy effects are available', async () => {
    vi.mocked(useCapabilities).mockReturnValue({
      hasFinePointer: true,
      isDesktopLayout: true,
      prefersReducedMotion: false,
      canUseHeavyEffects: true,
    });

    render(<CursorLoader />);

    expect(await screen.findByTestId('custom-cursor')).toBeInTheDocument();
    expect(renderCursorMock).toHaveBeenCalledOnce();
  });
});
