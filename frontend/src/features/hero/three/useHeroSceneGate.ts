import { useEffect, useState, type RefObject } from 'react';
import { useCapabilities } from '../../../hooks/useCapabilities';

const IDLE_TIMEOUT_MS = 2_000;
const IDLE_FALLBACK_MS = 200;

/**
 * three r163+ only supports WebGL2. The probe uses a throwaway canvas and
 * releases its context right away so it does not count against the browser limit.
 */
export function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2');
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function whenLoaded(callback: () => void): () => void {
  if (document.readyState === 'complete') {
    callback();
    return () => undefined;
  }
  window.addEventListener('load', callback, { once: true });
  return () => window.removeEventListener('load', callback);
}

function whenIdle(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS });
    return () => window.cancelIdleCallback(handle);
  }
  const timer = window.setTimeout(callback, IDLE_FALLBACK_MS);
  return () => window.clearTimeout(timer);
}

/**
 * Decides whether the 3D Hero scene may be mounted. three is never imported
 * unless every condition holds: heavy effects allowed, full tier, WebGL2
 * available, page loaded, browser idle and Hero visible.
 */
export function useHeroSceneGate(containerRef: RefObject<HTMLElement | null>): boolean {
  const { canUseHeavyEffects, perfTier } = useCapabilities();
  const [isOpen, setIsOpen] = useState(false);
  const isEligible = canUseHeavyEffects && perfTier === 'full';

  useEffect(() => {
    if (!isEligible || isOpen) return;

    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === 'undefined') return;

    let isIdle = false;
    let isVisible = false;
    let isSettled = false;

    const tryOpen = () => {
      if (isSettled || !isIdle || !isVisible) return;
      isSettled = true;
      if (hasWebGL2()) setIsOpen(true);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        isVisible = entry.isIntersecting;
        tryOpen();
      },
      { threshold: 0 },
    );
    observer.observe(container);

    let cancelIdle: () => void = () => undefined;
    const cancelLoad = whenLoaded(() => {
      cancelIdle = whenIdle(() => {
        isIdle = true;
        tryOpen();
      });
    });

    return () => {
      cancelLoad();
      cancelIdle();
      observer.disconnect();
    };
  }, [containerRef, isEligible, isOpen]);

  return isEligible && isOpen;
}