import { useCapabilities } from './useCapabilities';

export interface EntranceMotion {
  /**
   * True when entrance animations must be skipped entirely.
   * The component should render its final state (e.g. `initial={false}`).
   */
  skipEntrance: boolean;
}

/**
 * Central decision for entrance animations across sections.
 * Skips in lite tier and whenever the user prefers reduced motion.
 * In full tier, returns `skipEntrance: false` so the caller animates normally.
 */
export function useEntranceMotion(): EntranceMotion {
  const { prefersReducedMotion, perfTier } = useCapabilities();
  const skipEntrance = prefersReducedMotion || perfTier === 'lite';
  return { skipEntrance };
}