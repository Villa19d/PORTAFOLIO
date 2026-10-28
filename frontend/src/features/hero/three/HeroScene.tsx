import { useEffect, useRef, useState } from 'react';
import { requestLiteTier } from '../../../hooks/usePerformanceTier';
import { createHeroParticleScene, type HeroParticleScene } from './heroParticleScene';

interface HeroSceneProps {
  /** Called when the scene cannot (or should not) keep running; the parent falls back to the CSS background. */
  onFailure: () => void;
}

export default function HeroScene({ onFailure }: HeroSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [hasFirstFrame, setHasFirstFrame] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let scene: HeroParticleScene | null = null;
    try {
      scene = createHeroParticleScene({
        host,
        onFirstFrame: () => setHasFirstFrame(true),
        onContextLost: onFailure,
        onLowPerformance: () => {
          requestLiteTier();
          onFailure();
        },
      });
    } catch {
      onFailure();
      return;
    }

    return () => {
      scene?.dispose();
    };
  }, [onFailure]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      data-testid="hero-scene"
      data-scene-ready={hasFirstFrame ? 'true' : 'false'}
      className={`pointer-events-none absolute inset-0 z-0 transition-opacity duration-[600ms] ease-out motion-reduce:transition-none ${
        hasFirstFrame ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
}