import { useRef } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BentoGlow from './BentoGlow';

function TestBento() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} data-testid="glow-host">
      <BentoGlow containerRef={containerRef} />
    </div>
  );
}

function createPointerEvent(type: string, clientX = 0, clientY = 0) {
  const event = new Event(type);
  Object.defineProperties(event, {
    pointerType: { value: 'mouse' },
    clientX: { value: clientX },
    clientY: { value: clientY },
  });
  return event;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('BentoGlow pointer handling', () => {
  it('registers one pointermove listener, reuses entry bounds, and removes the listener on unmount', () => {
    const addListenerSpy = vi.spyOn(HTMLElement.prototype, 'addEventListener');
    const removeListenerSpy = vi.spyOn(HTMLElement.prototype, 'removeEventListener');
    const { unmount } = render(<TestBento />);
    const host = screen.getByTestId('glow-host');

    const pointerMoveListeners = addListenerSpy.mock.calls.flatMap((call, index) =>
      addListenerSpy.mock.contexts[index] === host && call[0] === 'pointermove'
        ? [call[1]]
        : [],
    );

    expect(pointerMoveListeners).toHaveLength(1);
    const pointerMoveListener = pointerMoveListeners[0];
    const boundsSpy = vi.spyOn(host, 'getBoundingClientRect').mockReturnValue({
      left: 10,
      top: 20,
      right: 310,
      bottom: 220,
      width: 300,
      height: 200,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    } as DOMRect);

    host.dispatchEvent(createPointerEvent('pointerenter'));
    host.dispatchEvent(createPointerEvent('pointermove', 80, 120));
    host.dispatchEvent(createPointerEvent('pointermove', 85, 125));

    expect(boundsSpy).toHaveBeenCalledOnce();
    const glow = screen.getByTestId('bento-glow-overlay').firstElementChild as HTMLElement;
    expect(glow.style.transform).toContain('translate3d(75px, 105px, 0)');

    unmount();

    const listenerWasRemoved = removeListenerSpy.mock.calls.some(
      (call, index) =>
        removeListenerSpy.mock.contexts[index] === host &&
        call[0] === 'pointermove' &&
        call[1] === pointerMoveListener,
    );
    expect(listenerWasRemoved).toBe(true);
  });
});
