import { lazy, Suspense, useCallback, useState, type RefObject } from 'react';
import { HeroSceneBoundary } from './HeroSceneBoundary';
import { useHeroSceneGate } from './useHeroSceneGate';

const LazyHeroScene = lazy(() => import('./HeroScene'));

interface HeroSceneLayerProps {
  containerRef: RefObject<HTMLElement | null>;
}

/**
 * Mounts the 3D scene only when the gate allows it. Any failure (chunk load,
 * context loss, low fps) removes the layer for the rest of the page view,
 * leaving the CSS background untouched.
 */
export function HeroSceneLayer({ containerRef }: HeroSceneLayerProps) {
  const canMount = useHeroSceneGate(containerRef);
  const [hasFailed, setHasFailed] = useState(false);
  const handleFailure = useCallback(() => setHasFailed(true), []);

  if (!canMount || hasFailed) return null;

  return (
    <HeroSceneBoundary onError={handleFailure}>
      <Suspense fallback={null}>
        <LazyHeroScene onFailure={handleFailure} />
      </Suspense>
    </HeroSceneBoundary>
  );
}