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
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument();
    expect(surface?.querySelector('[aria-hidden="true"]')).toHaveClass('tilt-surface__glare');

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
});
