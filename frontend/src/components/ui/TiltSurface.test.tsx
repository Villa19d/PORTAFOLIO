import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TiltSurface } from './TiltSurface';

function fireMousePointerEvent(
  element: HTMLElement,
  type: 'pointerover' | 'pointermove',
  clientX = 50,
  clientY = 50,
) {
  const event = new Event(type, { bubbles: true });
  Object.defineProperties(event, {
    pointerType: { value: 'mouse' },
    buttons: { value: 0 },
    clientX: { value: clientX },
    clientY: { value: clientY },
  });
  fireEvent(element, event);
}

describe('TiltSurface', () => {
  it('measures dimensions only on pointer enter and keeps the content accessible', () => {
    const measure = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 100,
      bottom: 80,
      width: 100,
      height: 80,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    render(
      <TiltSurface>
        <a href="#projects">Projects</a>
      </TiltSurface>,
    );

    const surface = screen.getByRole('link').closest<HTMLElement>('.tilt-surface');
    expect(surface).toHaveClass('tilt-surface');
    expect(surface).toHaveAttribute('data-tilt-enabled', 'true');
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument();
    expect(surface?.querySelector('[aria-hidden="true"]')).toHaveClass('tilt-surface__glare');

    // Reset call history so this assertion only covers calls caused by the
    // pointer events fired below (motion/React may read layout during mount).
    measure.mockClear();

    fireMousePointerEvent(surface!, 'pointerover');
    fireMousePointerEvent(surface!, 'pointermove', 80, 20);

    expect(measure).toHaveBeenCalledOnce();
  });

  it('does not measure touch pointer coordinates', () => {
    const measure = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect');
    render(<TiltSurface>Card</TiltSurface>);

    const surface = screen.getByText('Card').parentElement?.parentElement;
    const event = new Event('pointerover', { bubbles: true });
    Object.defineProperties(event, {
      pointerType: { value: 'touch' },
      buttons: { value: 0 },
    });
    fireEvent(surface!, event);

    expect(measure).not.toHaveBeenCalled();
  });

  it('keeps the same DOM node and flips the enabled flag when tier changes', () => {
    const { rerender } = render(
      <TiltSurface>
        <span>Card</span>
      </TiltSurface>,
    );

    const surface = document.querySelector<HTMLElement>('.tilt-surface')!;
    expect(surface).toHaveAttribute('data-tilt-enabled', 'true');

    rerender(
      <TiltSurface enabled={false}>
        <span>Card</span>
      </TiltSurface>,
    );

    const surfaceDisabled = document.querySelector<HTMLElement>('.tilt-surface')!;
    // Ticket 11.1: the DOM node must NOT be remounted when the tier flips.
    expect(surfaceDisabled).toBe(surface);
    expect(surfaceDisabled).toHaveAttribute('data-tilt-enabled', 'false');

    // Re-enabling must reuse the same node too.
    rerender(
      <TiltSurface enabled>
        <span>Card</span>
      </TiltSurface>,
    );

    const surfaceReEnabled = document.querySelector<HTMLElement>('.tilt-surface')!;
    expect(surfaceReEnabled).toBe(surface);
    expect(surfaceReEnabled).toHaveAttribute('data-tilt-enabled', 'true');
  });
});