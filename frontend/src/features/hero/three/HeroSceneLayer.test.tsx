import { fireEvent, render, screen } from '@testing-library/react';
import type { RefObject } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HeroSceneLayer } from './HeroSceneLayer';

const gate = vi.hoisted(() => ({ open: false }));
const sceneChunk = vi.hoisted(() => ({ requested: vi.fn() }));

vi.mock('./useHeroSceneGate', () => ({
  useHeroSceneGate: () => gate.open,
}));

// Evaluating this factory is what importing the 3D chunk (HeroScene + three) means.
vi.mock('./HeroScene', () => {
  sceneChunk.requested();
  return {
    default: ({ onFailure }: { onFailure: () => void }) => (
      <button type="button" data-testid="fake-scene" onClick={onFailure}>
        scene
      </button>
    ),
  };
});

const containerRef: RefObject<HTMLElement | null> = { current: null };

describe('HeroSceneLayer', () => {
  beforeEach(() => {
    sceneChunk.requested.mockClear();
    gate.open = false;
  });

  it('renders nothing and never requests the 3D chunk while the gate is closed', () => {
    const { container } = render(<HeroSceneLayer containerRef={containerRef} />);

    expect(container).toBeEmptyDOMElement();
    expect(sceneChunk.requested).not.toHaveBeenCalled();
  });

  it('loads the 3D chunk lazily once the gate opens', async () => {
    gate.open = true;

    render(<HeroSceneLayer containerRef={containerRef} />);

    expect(await screen.findByTestId('fake-scene')).toBeInTheDocument();
    expect(sceneChunk.requested).toHaveBeenCalledTimes(1);
  });

  it('removes the scene for good after a failure', async () => {
    gate.open = true;
    render(<HeroSceneLayer containerRef={containerRef} />);

    fireEvent.click(await screen.findByTestId('fake-scene'));

    expect(screen.queryByTestId('fake-scene')).not.toBeInTheDocument();
  });
});