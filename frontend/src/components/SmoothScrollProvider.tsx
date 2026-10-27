import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import Lenis from 'lenis';
import { useCapabilities } from '../hooks/useCapabilities';

interface ScrollOptions {
  offset?: number;
  duration?: number;
  easing?: (t: number) => number;
}

interface SmoothScrollContextType {
  scrollTo: (target: string | HTMLElement, options?: ScrollOptions) => void;
  pause: () => void;
  resume: () => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextType | undefined>(undefined);

const LENIS_HTML_CLASSES = ['lenis', 'lenis-smooth', 'lenis-scrolling', 'lenis-stopped'];

function clearLenisHtmlClasses() {
  const root = document.documentElement;
  LENIS_HTML_CLASSES.forEach((name) => root.classList.remove(name));
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const { prefersReducedMotion, perfTier } = useCapabilities();
  const [lenisRef, setLenisRef] = useState<Lenis | null>(null);
  const shouldUseLenis = !prefersReducedMotion && perfTier === 'full';

  useEffect(() => {
    if (!shouldUseLenis) {
      // Defensive cleanup if a Lenis instance ever survived a race.
      clearLenisHtmlClasses();
      return;
    }

    const lenis = new Lenis({
      syncTouch: false,
      autoRaf: true,
    });

    setLenisRef(lenis);

    return () => {
      lenis.destroy();
      clearLenisHtmlClasses();
      setLenisRef(null);
    };
  }, [shouldUseLenis]);

  const scrollTo = useCallback(
    (target: string | HTMLElement, options?: ScrollOptions) => {
      if (lenisRef) {
        lenisRef.scrollTo(target, options);
      } else {
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
    },
    [lenisRef, prefersReducedMotion],
  );

  const pause = useCallback(() => lenisRef?.stop(), [lenisRef]);
  const resume = useCallback(() => lenisRef?.start(), [lenisRef]);

  return (
    <SmoothScrollContext.Provider value={{ scrollTo, pause, resume }}>
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