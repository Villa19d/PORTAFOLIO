import { useEffect, useState } from 'react';
import { useCapabilities } from '../../../hooks/useCapabilities';
import { hasWebGL2 } from '../../hero/three/useHeroSceneGate';

/**
 * Single decision point for the mini world. `canUseHeavyEffects` already covers a fine
 * pointer, a desktop layout, the full tier, reduced motion and saveData; on top of that
 * the browser has to expose a working WebGL2 context.
 */
export function resolveBentoWorldAvailability(
  canUseHeavyEffects: boolean,
  hasWebgl: boolean,
): boolean {
  return canUseHeavyEffects && hasWebgl;
}

export function useBentoWorldGate(): boolean {
  const { canUseHeavyEffects } = useCapabilities();
  const [hasWebgl, setHasWebgl] = useState(false);

  useEffect(() => {
    setHasWebgl(hasWebGL2());
  }, []);

  return resolveBentoWorldAvailability(canUseHeavyEffects, hasWebgl);
}
