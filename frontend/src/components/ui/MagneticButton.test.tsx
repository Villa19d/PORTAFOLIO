import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as capabilitiesModule from '../../hooks/useCapabilities';
import { MagneticButton } from './MagneticButton';

function fireMousePointerMove(element: HTMLElement, clientX: number, clientY: number) {
  const event = new Event('pointermove', { bubbles: true });
  Object.defineProperties(event, {
    pointerType: { value: 'mouse' },
    clientX: { value: clientX },
    clientY: { value: clientY },
  });
  fireEvent(element, event);
}

describe('MagneticButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not measure or move the wrapper when heavy effects are unavailable', () => {
    vi.spyOn(capabilitiesModule, 'useCapabilities').mockReturnValue({
      hasFinePointer: true,
      isDesktopLayout: true,
      prefersReducedMotion: true,
      canUseHeavyEffects: false,
    });
    const measure = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect');

    render(
      <MagneticButton>
        <a href="#projects">Projects</a>
      </MagneticButton>
    );

    fireMousePointerMove(screen.getByRole('link').parentElement!, 40, 20);

    expect(screen.getByRole('link')).toBeInTheDocument();
    expect(measure).not.toHaveBeenCalled();
  });

  it('measures pointer position only when heavy effects are available', () => {
    vi.spyOn(capabilitiesModule, 'useCapabilities').mockReturnValue({
      hasFinePointer: true,
      isDesktopLayout: true,
      prefersReducedMotion: false,
      canUseHeavyEffects: true,
    });
    const link = render(
      <MagneticButton>
        <a href="#projects">Projects</a>
      </MagneticButton>
    ).getByRole('link');
    const wrapper = link.parentElement!;
    const measure = vi.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 100,
      bottom: 40,
      width: 100,
      height: 40,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireMousePointerMove(wrapper, 90, 20);

    expect(measure).toHaveBeenCalledOnce();
  });
});
