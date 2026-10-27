import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { SoundEngine, SoundName } from './soundEngine';

type SoundContextValue = {
  enabled: boolean;
  toggle: () => void;
  play: (sound: SoundName) => void;
};

const SoundContext = createContext<SoundContextValue>({
  enabled: false,
  toggle: () => undefined,
  play: () => undefined,
});

const STORAGE_KEY = 'portfolio-sound-enabled';

function readStoredPreference() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function isLiteMode() {
  const root = document.documentElement;
  const pointerIsCoarse = window.matchMedia('(pointer: coarse)').matches;
  return root.dataset.perf === 'lite' || document.body.dataset.perf === 'lite' || pointerIsCoarse;
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(readStoredPreference);
  const engineRef = useRef<SoundEngine | null>(null);
  const loadingRef = useRef<Promise<SoundEngine | null> | null>(null);
  const mountedRef = useRef(true);

  const loadEngine = useCallback((): Promise<SoundEngine | null> => {
    if (engineRef.current) return Promise.resolve(engineRef.current);
    if (!loadingRef.current) {
      loadingRef.current = import('./soundEngine').then(({ createSoundEngine }) => {
        // The provider may have unmounted while the chunk was loading.
        if (!mountedRef.current) return null;
        const engine = createSoundEngine();
        engineRef.current = engine;
        return engine;
      });
    }
    return loadingRef.current;
  }, []);

  const toggle = useCallback(() => {
    setEnabled((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Sound remains usable when storage is unavailable.
      }
      if (next) {
        void loadEngine().then((engine) => engine?.play('click'));
      } else {
        engineRef.current?.suspend();
      }
      return next;
    });
  }, [loadEngine]);

  const play = useCallback(
    (sound: SoundName) => {
      if (
        !enabled ||
        (sound === 'tick' && (isLiteMode() || prefersReducedMotion())) ||
        (sound === 'whoosh' && prefersReducedMotion())
      ) {
        return;
      }
      void loadEngine().then((engine) => {
        if (engine && document.visibilityState !== 'hidden') engine.play(sound);
      });
    },
    [enabled, loadEngine]
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        engineRef.current?.suspend();
      } else if (enabled) {
        engineRef.current?.resume();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      engineRef.current?.close();
      engineRef.current = null;
      loadingRef.current = null;
    };
  }, []);

  const value = useMemo(() => ({ enabled, toggle, play }), [enabled, play, toggle]);
  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound() {
  return useContext(SoundContext);
}