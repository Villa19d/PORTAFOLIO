import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';

const LazyBootIntro = lazy(() =>
  import('./BootIntro').then(({ BootIntro }) => ({ default: BootIntro })),
);

type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: string;
};

function hasSeenIntro() {
  try {
    return window.sessionStorage.getItem('boot_intro_seen') === '1';
  } catch {
    return false;
  }
}

function shouldBypass() {
  if (hasSeenIntro()) return true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  if (document.documentElement.dataset.perf === 'lite' || document.body.dataset.perf === 'lite') {
    return true;
  }
  if (new URLSearchParams(window.location.search).get('intro') === '0') return true;

  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  return connection?.saveData === true || connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g';
}

function markSeen() {
  try {
    window.sessionStorage.setItem('boot_intro_seen', '1');
  } catch {
    // A storage failure must not prevent the intro from being dismissed.
  }
}

function scheduleIdle(callback: () => void) {
  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
    cancelIdleCallback?: (handle: number) => void;
  };
  if (idleWindow.requestIdleCallback) {
    const handle = idleWindow.requestIdleCallback(callback, { timeout: 1_000 });
    return () => idleWindow.cancelIdleCallback?.(handle);
  }
  const handle = window.setTimeout(callback, 0);
  return () => window.clearTimeout(handle);
}

export function BootIntroLauncher() {
  const [visible, setVisible] = useState(false);
  const [eligible, setEligible] = useState(false);
  const scheduledRef = useRef(false);
  const finish = useCallback(() => {
    markSeen();
    setVisible(false);
  }, []);

  useEffect(() => {
    if (shouldBypass() || scheduledRef.current) return;
    scheduledRef.current = true;

    const schedule = () => {
      if (shouldBypass()) return;
      return scheduleIdle(() => setEligible(true));
    };

    if (document.readyState === 'complete') {
      return schedule();
    }

    const onLoad = () => schedule();
    window.addEventListener('load', onLoad, { once: true });
    return () => window.removeEventListener('load', onLoad);
  }, []);

  useEffect(() => {
    if (eligible) setVisible(true);
  }, [eligible]);

  return visible ? (
    <Suspense fallback={null}>
      <LazyBootIntro onDone={finish} />
    </Suspense>
  ) : null;
}
