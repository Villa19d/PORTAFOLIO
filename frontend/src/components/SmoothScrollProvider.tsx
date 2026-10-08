import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import Lenis from 'lenis';
import { useCapabilities } from '../hooks/useCapabilities';

interface ScrollOptions {
  offset?: number;
  duration?: number;
  easing?: (t: number) => number;
}

interface SmoothScrollContextType {
  scrollTo: (target: string | HTMLElement, options?: ScrollOptions) => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextType | undefined>(undefined);

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const { prefersReducedMotion } = useCapabilities();
  const [lenisRef, setLenisRef] = useState<Lenis | null>(null);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const lenis = new Lenis({
      syncTouch: false,
      autoRaf: true,
    });

    setLenisRef(lenis);

    return () => {
      lenis.destroy();
      setLenisRef(null);
    };
  }, [prefersReducedMotion]);

  const scrollTo = useCallback((target: string | HTMLElement, options?: ScrollOptions) => {
    if (lenisRef) {
      lenisRef.scrollTo(target, options);
    } else {
      // Fallback nativo
      let element: HTMLElement | null = null;
      if (typeof target === 'string') {
        element = document.querySelector(target);
      } else {
        element = target;
      }

      if (element) {
        element.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
      }
    }
  }, [lenisRef, prefersReducedMotion]);

  return (
    <SmoothScrollContext.Provider value={{ scrollTo }}>
      {children}
    </SmoothScrollContext.Provider>
  );
}

export function useSmoothScroll() {
  const context = useContext(SmoothScrollContext);
  if (!context) {
    throw new Error('useSmoothScroll must be used within a SmoothScrollProvider');
  }
  return context;
}
