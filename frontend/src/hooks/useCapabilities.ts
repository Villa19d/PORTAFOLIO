import { useSyncExternalStore } from 'react';

function createMatchMedia(query: string) {
  return {
    subscribe: (callback: () => void) => {
      const matchMedia = window.matchMedia(query);
      matchMedia.addEventListener('change', callback);
      return () => matchMedia.removeEventListener('change', callback);
    },
    getSnapshot: () => window.matchMedia(query).matches,
    getServerSnapshot: () => false,
  };
}

const finePointerMedia = createMatchMedia('(hover: hover) and (pointer: fine)');
const desktopLayoutMedia = createMatchMedia('(min-width: 1024px)');
const reducedMotionMedia = createMatchMedia('(prefers-reduced-motion: reduce)');

/**
 * Hook to read environment capabilities.
 */
export function useCapabilities() {
  const hasFinePointer = useSyncExternalStore(
    finePointerMedia.subscribe,
    finePointerMedia.getSnapshot,
    finePointerMedia.getServerSnapshot
  );

  const isDesktopLayout = useSyncExternalStore(
    desktopLayoutMedia.subscribe,
    desktopLayoutMedia.getSnapshot,
    desktopLayoutMedia.getServerSnapshot
  );

  const prefersReducedMotion = useSyncExternalStore(
    reducedMotionMedia.subscribe,
    reducedMotionMedia.getSnapshot,
    reducedMotionMedia.getServerSnapshot
  );

  // Check saveData safely
  const saveData = (() => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = navigator.connection as { saveData?: boolean };
      return conn.saveData === true;
    }
    return false;
  })();

  /**
   * canUseHeavyEffects debe evaluarse ANTES de cualquier import() dinámico de código 3D.
   * Si es false, no se debe descargar código pesado.
   */
  const canUseHeavyEffects =
    hasFinePointer && isDesktopLayout && !prefersReducedMotion && !saveData;

  return {
    hasFinePointer,
    isDesktopLayout,
    prefersReducedMotion,
    canUseHeavyEffects,
  };
}
