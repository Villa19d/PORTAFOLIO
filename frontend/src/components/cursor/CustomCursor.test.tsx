import { Profiler } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CustomCursor } from './CustomCursor';

function createMouseMove(clientX: number, clientY: number) {
  const event = new Event('pointermove', { bubbles: true });
  Object.defineProperties(event, {
    pointerType: { value: 'mouse' },
    clientX: { value: clientX },
    clientY: { value: clientY },
  });
  return event;
}

describe('CustomCursor', () => {
  it('moves without causing React renders for pointer updates', () => {
    let renderCount = 0;
    render(
      <>
        <a href="#projects">Projects</a>
        <Profiler id="custom-cursor" onRender={() => renderCount++}>
          <CustomCursor />
        </Profiler>
      </>
    );

    const link = screen.getByRole('link', { name: 'Projects' });
    for (let index = 0; index < 20; index++) {
      fireEvent(link, createMouseMove(index * 10, index * 5));
    }

    expect(document.querySelectorAll('.custom-cursor-dot, .custom-cursor-ring')).toHaveLength(2);
    expect(document.querySelector('.custom-cursor-ring')).toHaveClass(
      'custom-cursor-ring--interactive'
    );
    expect(renderCount).toBe(1);
  });
});
