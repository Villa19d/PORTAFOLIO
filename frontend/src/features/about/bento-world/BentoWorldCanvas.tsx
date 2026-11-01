import { useCallback, useEffect, useRef, useState } from 'react';
import { useSound } from '../../sound/SoundContext';
import type { SoundName } from '../../sound/soundEngine';
import { createBentoWorldScene, type BentoWorldMode, type BentoWorldScene } from './bentoWorldScene';

interface BentoWorldCanvasProps {
  /** Showcase (drifting camera) or first person. Changing it never recreates the scene. */
  mode: BentoWorldMode;
  /** Called when the scene cannot keep running; the tile falls back to the card. */
  onFailure: () => void;
}

/**
 * Lazy entry point of the mini world: the chunk that imports three is requested as soon
 * as the tile approaches the viewport, never again afterwards.
 */
export default function BentoWorldCanvas({ mode, onFailure }: BentoWorldCanvasProps) {
  const { play, setLofi } = useSound();
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<BentoWorldScene | null>(null);
  const [isReady, setIsReady] = useState(false);

  // The scene keeps its own copies of these callbacks: toggling the site sound must not
  // rebuild the GPU resources (and must not reset the chosen day/night mode).
  const playRef = useRef(play);
  const setLofiRef = useRef(setLofi);
  useEffect(() => {
    playRef.current = play;
    setLofiRef.current = setLofi;
  }, [play, setLofi]);
  const playSound = useCallback((sound: SoundName) => playRef.current(sound), []);
  const onLofi = useCallback((on: boolean) => setLofiRef.current(on), []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let scene: BentoWorldScene | null = null;
    try {
      scene = createBentoWorldScene({
        host,
        playSound,
        onLofi,
        onFirstFrame: () => setIsReady(true),
        onFailure,
      });
    } catch {
      onFailure();
      return;
    }

    sceneRef.current = scene;
    scene.setMode(mode);
    return () => {
      sceneRef.current = null;
      scene?.dispose();
    };
    // `mode` is applied by the effect below: adding it here would recreate the scene.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFailure, playSound, onLofi]);

  useEffect(() => {
    sceneRef.current?.setMode(mode);
  }, [mode]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      data-testid="bento-world-scene"
      data-scene-ready={isReady ? 'true' : 'false'}
      className={`absolute inset-0 transition-opacity duration-500 ease-out motion-reduce:transition-none ${
        isReady ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
}
