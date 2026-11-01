import { useEffect } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../../lib/i18n';
import { BentoWorldTile } from './BentoWorldTile';

const mocks = vi.hoisted(() => ({ canUseWorld: false }));
const sceneChunk = vi.hoisted(() => ({ requested: vi.fn(), mounts: vi.fn() }));

vi.mock('./useBentoWorldGate', () => ({
  useBentoWorldGate: () => mocks.canUseWorld,
}));

// Evaluating this factory is what importing the scene (and three) means.
vi.mock('./BentoWorldCanvas', () => {
  sceneChunk.requested();
  return {
    default: function FakeScene({ mode, onFailure }: { mode: string; onFailure: () => void }) {
      // Counts real mounts (not re-renders) so a test can prove the scene is reused.
      useEffect(() => {
        sceneChunk.mounts();
      }, []);
      return (
        <button type="button" data-testid="fake-scene" data-mode={mode} onClick={onFailure}>
          scene
        </button>
      );
    },
  };
});

type ObserverMock = {
  instances: {
    elements: Set<Element>;
    triggerIntersection: (element: Element, isIntersecting: boolean) => void;
  }[];
};

/** Fires the tile observer so the auto-load path runs without a real scroll. */
function enterViewport() {
  const observerMock = window.IntersectionObserver as unknown as ObserverMock;
  const observer = observerMock.instances[observerMock.instances.length - 1];
  const target = observer ? [...observer.elements][0] : undefined;
  if (!observer || !target) throw new Error('the tile did not register an observer');
  observer.triggerIntersection(target, true);
}

const playButton = () => screen.queryByRole('button', { name: /jugar|play/i });
const exitButton = () => screen.queryByRole('button', { name: /salir|exit/i });

function renderTile() {
  return render(
    <I18nextProvider i18n={i18n}>
      <BentoWorldTile />
    </I18nextProvider>,
  );
}

describe('BentoWorldTile', () => {
  beforeEach(() => {
    void i18n.changeLanguage('es');
    sceneChunk.requested.mockClear();
    sceneChunk.mounts.mockClear();
    mocks.canUseWorld = false;
  });

  it('keeps the static card and never requests the chunk when the gate is closed', () => {
    // Runs first on purpose: the mocked chunk factory is only evaluated on the first
    // import of the module, so this is the assertion that really proves it never loaded.
    renderTile();

    expect(screen.getByTestId('bento-world-card')).toBeInTheDocument();
    expect(sceneChunk.requested).not.toHaveBeenCalled();
  });

  it('mounts the scene when the tile enters the viewport, without pressing anything', async () => {
    mocks.canUseWorld = true;
    renderTile();
    expect(sceneChunk.requested).not.toHaveBeenCalled();

    act(() => enterViewport());

    const scene = await screen.findByTestId('fake-scene');
    expect(scene).toHaveAttribute('data-mode', 'showcase');
    expect(sceneChunk.requested).toHaveBeenCalledTimes(1);
    expect(sceneChunk.mounts).toHaveBeenCalledTimes(1);
  });

  it('switches to first person on Play without re-importing or recreating the scene', async () => {
    mocks.canUseWorld = true;
    renderTile();
    act(() => enterViewport());
    await screen.findByTestId('fake-scene');

    fireEvent.click(playButton()!);

    expect(screen.getByTestId('fake-scene')).toHaveAttribute('data-mode', 'interactive');
    // The scene instance is the same one: switching mode never remounts it (and the
    // module factory above cannot run twice, so nothing is imported again).
    expect(sceneChunk.mounts).toHaveBeenCalledTimes(1);
  });

  it('returns to the showcase with Exit, keeping the scene mounted', async () => {
    mocks.canUseWorld = true;
    renderTile();
    act(() => enterViewport());
    await screen.findByTestId('fake-scene');
    fireEvent.click(playButton()!);

    fireEvent.click(exitButton()!);

    expect(screen.getByTestId('fake-scene')).toHaveAttribute('data-mode', 'showcase');
    expect(sceneChunk.mounts).toHaveBeenCalledTimes(1);
  });

  it('falls back to the static card when the scene fails', async () => {
    mocks.canUseWorld = true;
    renderTile();
    act(() => enterViewport());

    fireEvent.click(await screen.findByTestId('fake-scene'));

    expect(screen.getByTestId('bento-world-card')).toBeInTheDocument();
    expect(screen.queryByTestId('fake-scene')).not.toBeInTheDocument();
  });
});
