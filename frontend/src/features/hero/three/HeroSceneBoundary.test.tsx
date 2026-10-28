import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HeroSceneBoundary } from './HeroSceneBoundary';

function Exploding(): never {
  throw new Error('chunk failed');
}

describe('HeroSceneBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders its children when nothing fails', () => {
    render(
      <HeroSceneBoundary>
        <p>ok</p>
      </HeroSceneBoundary>,
    );

    expect(screen.getByText('ok')).toBeInTheDocument();
  });

  it('renders nothing and reports the error when a child throws', () => {
    const onError = vi.fn();

    const { container } = render(
      <HeroSceneBoundary onError={onError}>
        <Exploding />
      </HeroSceneBoundary>,
    );

    expect(container).toBeEmptyDOMElement();
    expect(onError).toHaveBeenCalledTimes(1);
  });
});