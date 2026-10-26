import { useEffect, useSyncExternalStore } from 'react';

export type PerfTier = 'lite' | 'full';

export const PERF_STORAGE_KEY = 'portfolio-perf-tier';
export const PERF_QUERY_PARAM = 'perf';
export const LITE_FPS_THRESHOLD = 40;
export const SAMPLE_DURATION_MS = 2_000;
export const IGNORE_INITIAL_MS = 500;
export const FPS_WINDOW_MS = 500;

const GRACE_PERIOD_MS = 1_000;
const IDLE_TIMEOUT_MS = 2_000;
const IDLE_FALLBACK_MS = 200;
const LOW_END_LIMIT = 2;

interface PerformanceTierDeps {
  now: () => number;
  requestFrame: (callback: () => void) => number;
  cancelFrame: (handle: number) => void;
  /** Calls back once the page is ready to be measured. Returns a cancel function. */
  scheduleStart: (callback: () => void) => () => void;
}

export interface PerformanceTierStore {
  getTier: () => PerfTier;
  subscribe: (listener: () => void) => () => void;
  start: () => () => void;
}

function isPerfTier(value: unknown): value is PerfTier {
  return value === 'lite' || value === 'full';
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle] ?? 0;
  if (sorted.length % 2 === 1) return upper;
  return ((sorted[middle - 1] ?? upper) + upper) / 2;
}

/**
 * Median of the per-window frame rates. `frameOffsets` are frame timestamps in ms
 * relative to the start of the sample. The first IGNORE_INITIAL_MS are discarded.
 */
export function estimateFps(frameOffsets: readonly number[]): number {
  const rates: number[] = [];
  for (
    let start = IGNORE_INITIAL_MS;
    start + FPS_WINDOW_MS <= SAMPLE_DURATION_MS;
    start += FPS_WINDOW_MS
  ) {
    const end = start + FPS_WINDOW_MS;
    const frames = frameOffsets.filter((offset) => offset > start && offset <= end).length;
    rates.push((frames * 1_000) / FPS_WINDOW_MS);
  }
  return median(rates);
}

function readForcedTier(): PerfTier | null {
  const value = new URLSearchParams(window.location.search).get(PERF_QUERY_PARAM);
  return isPerfTier(value) ? value : null;
}

function readStoredTier(): PerfTier | null {
  try {
    const value = window.sessionStorage.getItem(PERF_STORAGE_KEY);
    return isPerfTier(value) ? value : null;
  } catch {
    return null;
  }
}

function persistTier(tier: PerfTier) {
  try {
    window.sessionStorage.setItem(PERF_STORAGE_KEY, tier);
  } catch {
    // The tier still applies to this page view when storage is unavailable.
  }
}

function isLowEndHardware(): boolean {
  if (typeof navigator === 'undefined') return false;
  const cores = readNumber(navigator.hardwareConcurrency);
  const memory = readNumber((navigator as Navigator & { deviceMemory?: unknown }).deviceMemory);
  return (cores !== null && cores > 0 && cores <= LOW_END_LIMIT) || (memory !== null && memory <= LOW_END_LIMIT);
}

function resolveInitialTier(): { tier: PerfTier; needsMeasurement: boolean } {
  const forced = readForcedTier();
  if (forced) return { tier: forced, needsMeasurement: false };

  const stored = readStoredTier();
  if (stored) return { tier: stored, needsMeasurement: false };

  if (isLowEndHardware()) {
    persistTier('lite');
    return { tier: 'lite', needsMeasurement: false };
  }

  return { tier: 'full', needsMeasurement: true };
}

/** After `load`, then an idle moment, then a grace period so the initial load is not measured. */
function scheduleAfterLoad(callback: () => void): () => void {
  const cancels: Array<() => void> = [];

  const afterGrace = () => {
    const timer = window.setTimeout(callback, GRACE_PERIOD_MS);
    cancels.push(() => window.clearTimeout(timer));
  };

  const afterLoad = () => {
    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(afterGrace, { timeout: IDLE_TIMEOUT_MS });
      cancels.push(() => window.cancelIdleCallback(handle));
    } else {
      const timer = window.setTimeout(afterGrace, IDLE_FALLBACK_MS);
      cancels.push(() => window.clearTimeout(timer));
    }
  };

  if (document.readyState === 'complete') {
    afterLoad();
  } else {
    window.addEventListener('load', afterLoad, { once: true });
    cancels.push(() => window.removeEventListener('load', afterLoad));
  }

  return () => cancels.forEach((cancel) => cancel());
}

function createBrowserDeps(): PerformanceTierDeps {
  return {
    now: () => performance.now(),
    requestFrame: (callback) => window.requestAnimationFrame(callback),
    cancelFrame: (handle) => window.cancelAnimationFrame(handle),
    scheduleStart: scheduleAfterLoad,
  };
}

export function createPerformanceTierStore(
  overrides: Partial<PerformanceTierDeps> = {},
): PerformanceTierStore {
  const deps: PerformanceTierDeps = { ...createBrowserDeps(), ...overrides };
  const listeners = new Set<() => void>();
  let tier: PerfTier | null = null;
  let needsMeasurement = false;
  let consumers = 0;
  let stopMonitor: (() => void) | null = null;

  const applyToDocument = (next: PerfTier) => {
    if (next === 'lite') {
      document.documentElement.dataset.perf = 'lite';
    } else {
      delete document.documentElement.dataset.perf;
    }
  };

  const commit = (next: PerfTier) => {
    if (next === tier) return;
    tier = next;
    applyToDocument(next);
    listeners.forEach((listener) => listener());
  };

  const getTier = (): PerfTier => {
    if (tier === null) {
      const initial = resolveInitialTier();
      tier = initial.tier;
      needsMeasurement = initial.needsMeasurement;
      applyToDocument(tier);
    }
    return tier;
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const runMonitor = (): (() => void) => {
    let ready = false;
    let sampling = false;
    let frameHandle: number | null = null;
    let sampleStart = 0;
    let offsets: number[] = [];
    let cancelSchedule: () => void = () => undefined;

    const abortSample = () => {
      if (frameHandle !== null) deps.cancelFrame(frameHandle);
      frameHandle = null;
      sampling = false;
      offsets = [];
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        beginSample();
      } else {
        abortSample();
      }
    };

    const stop = () => {
      abortSample();
      cancelSchedule();
      document.removeEventListener('visibilitychange', handleVisibility);
    };

    const finish = () => {
      const next: PerfTier = estimateFps(offsets) < LITE_FPS_THRESHOLD ? 'lite' : 'full';
      stop();
      needsMeasurement = false;
      persistTier(next);
      commit(next);
    };

    const tick = () => {
      frameHandle = null;
      const elapsed = deps.now() - sampleStart;
      offsets.push(elapsed);
      if (elapsed >= SAMPLE_DURATION_MS) {
        finish();
        return;
      }
      frameHandle = deps.requestFrame(tick);
    };

    function beginSample() {
      if (!ready || sampling || document.visibilityState !== 'visible') return;
      sampling = true;
      offsets = [];
      sampleStart = deps.now();
      frameHandle = deps.requestFrame(tick);
    }

    document.addEventListener('visibilitychange', handleVisibility);
    cancelSchedule = deps.scheduleStart(() => {
      ready = true;
      beginSample();
    });

    return stop;
  };

  const start = (): (() => void) => {
    getTier();
    if (!needsMeasurement) return () => undefined;

    consumers += 1;
    if (consumers === 1) stopMonitor = runMonitor();

    let released = false;
    return () => {
      if (released) return;
      released = true;
      consumers -= 1;
      if (consumers === 0) {
        stopMonitor?.();
        stopMonitor = null;
      }
    };
  };

  return { getTier, subscribe, start };
}

let defaultStore: PerformanceTierStore | null = null;

function getDefaultStore(): PerformanceTierStore {
  if (!defaultStore) defaultStore = createPerformanceTierStore();
  return defaultStore;
}

const getServerTier = (): PerfTier => 'full';

/**
 * Current performance tier. Mounting it starts the (shared) fps measurement
 * when the session has no decision yet.
 */
export function usePerformanceTier(): PerfTier {
  const store = getDefaultStore();
  useEffect(() => store.start(), [store]);
  return useSyncExternalStore(store.subscribe, store.getTier, getServerTier);
}