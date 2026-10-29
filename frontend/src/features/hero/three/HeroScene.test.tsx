import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HeroParticleSceneOptions } from './heroParticleScene';
import HeroScene from './HeroScene';

const mocks = vi.hoisted(() => ({
  create: vi.fn<(options: HeroParticleSceneOptions) => { dispose: () => void }>(),
  dispose: vi.fn(),
  requestLiteTier: vi.fn(),
}));

vi.mock('./heroParticleScene', () => ({
  createHeroParticleScene: mocks.create,
}));

vi.mock('../../../hooks/usePerformanceTier', () => ({
  requestLiteTier: mocks.requestLiteTier,
}));

function getOptions(): HeroParticleSceneOptions {
  const options = mocks.create.mock.calls[0]?.[0];
  if (!options) throw new Error('Scene was not created');
  return options;
}

describe('HeroScene', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockReturnValue({ dispose: mocks.dispose });
  });

  it('renders an inert, hidden host and starts transparent', () => {
    render(<HeroScene onFailure={vi.fn()} />);

    const host = screen.getByTestId('hero-scene');
    expect(host).toHaveAttribute('aria-hidden', 'true');
    expect(host).toHaveClass('pointer-events-none', 'opacity-0');
    expect(host).toHaveAttribute('data-scene-ready', 'false');
    expect(getOptions().host).toBe(host);
  });

  it('fades in after the first frame', () => {
    render(<HeroScene onFailure={vi.fn()} />);

    act(() => getOptions().onFirstFrame?.());

    const host = screen.getByTestId('hero-scene');
    expect(host).toHaveClass('opacity-100');
    expect(host).toHaveAttribute('data-scene-ready', 'true');
  });

  it('disposes the scene on unmount', () => {
    const { unmount } = render(<HeroScene onFailure={vi.fn()} />);

    unmount();

    expect(mocks.dispose).toHaveBeenCalledTimes(1);
  });

  it('requests lite and reports failure when performance degrades', () => {
    const onFailure = vi.fn();
    render(<HeroScene onFailure={onFailure} />);

    act(() => getOptions().onLowPerformance?.());

    expect(mocks.requestLiteTier).toHaveBeenCalledTimes(1);
    expect(onFailure).toHaveBeenCalledTimes(1);
  });

  it('reports failure without forcing lite when the context is lost', () => {
    const onFailure = vi.fn();
    render(<HeroScene onFailure={onFailure} />);

    act(() => getOptions().onContextLost?.());

    expect(onFailure).toHaveBeenCalledTimes(1);
    expect(mocks.requestLiteTier).not.toHaveBeenCalled();
  });

  it('reports failure when the scene cannot be created', () => {
    mocks.create.mockImplementation(() => {
      throw new Error('WebGL unavailable');
    });
    const onFailure = vi.fn();

    render(<HeroScene onFailure={onFailure} />);

    expect(onFailure).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('hero-scene')).toBeInTheDocument();
  });
});