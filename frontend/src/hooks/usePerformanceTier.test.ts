import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createPerformanceTierStore,
  estimateFps,
  PERF_STORAGE_KEY,
  usePerformanceTier,
} from './usePerformanceTier';

function createFakeClock() {
  let time = 0;
  let nextHandle = 1;
  let pending = new Map<number, () => void>();
  let startCallback: (() => void) | null = null;
  const cancelSchedule = vi.fn();
  const requestFrame = vi.fn((callback: () => void) => {
    const handle = nextHandle++;
    pending.set(handle, callback);
    return handle;
  });

  return {
    now: () => time,
    requestFrame,
    cancelFrame: (handle: number) => {
      pending.delete(handle);
    },
    scheduleStart: vi.fn((callback: () => void) => {
      startCallback = callback;
      return cancelSchedule;
    }),
    cancelSchedule,
    fireReady: () => startCallback?.(),
    runFrames(totalMs: number, frameMs: (elapsed: number) => number) {
      let elapsed = 0;
      while (elapsed < totalMs) {
        const step = frameMs(elapsed);
        time += step;
        elapsed += step;
        const callbacks = [...pending.values()];
        pending = new Map();
        callbacks.forEach((callback) => callback());
      }
    },
  };
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('estimateFps', () => {
  it('returns about 60 for a steady 60 fps sample', () => {
    const offsets = Array.from({ length: 120 }, (_, i) => ((i + 1) * 1_000) / 60);
    expect(estimateFps(offsets)).toBeGreaterThanOrEqual(58);
  });

  it('returns 20 for a steady 20 fps sample', () => {
    const offsets = Array.from({ length: 40 }, (_, i) => (i + 1) * 50);
    expect(estimateFps(offsets)).toBe(20);
  });

  it('ignores frames from the first half second', () => {
    expect(estimateFps([100, 200, 300, 400, 500])).toBe(0);
  });
});

describe('createPerformanceTierStore', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 8 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/');
    delete document.documentElement.dataset.perf;
    Reflect.deleteProperty(document, 'visibilityState');
  });

  it('enters lite with low simulated fps and persists the decision', () => {
    const clock = createFakeClock();
    const store = createPerformanceTierStore(clock);
    const listener = vi.fn();
    store.subscribe(listener);

    store.start();
    clock.fireReady();
    clock.runFrames(2_300, () => 50);

    expect(store.getTier()).toBe('lite');
    expect(document.documentElement.dataset.perf).toBe('lite');
    expect(window.sessionStorage.getItem(PERF_STORAGE_KEY)).toBe('lite');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('stays full with high simulated fps', () => {
    const clock = createFakeClock();
    const store = createPerformanceTierStore(clock);
    const listener = vi.fn();
    store.subscribe(listener);

    store.start();
    clock.fireReady();
    clock.runFrames(2_300, () => 16.7);

    expect(store.getTier()).toBe('full');
    expect(document.documentElement.dataset.perf).toBeUndefined();
    expect(window.sessionStorage.getItem(PERF_STORAGE_KEY)).toBe('full');
    expect(listener).not.toHaveBeenCalled();
  });

  it('ignores a slow first half second', () => {
    const clock = createFakeClock();
    const store = createPerformanceTierStore(clock);

    store.start();
    clock.fireReady();
    clock.runFrames(2_300, (elapsed) => (elapsed < 500 ? 250 : 16.7));

    expect(store.getTier()).toBe('full');
  });

  it('uses the median so a single slow window does not trigger lite', () => {
    const clock = createFakeClock();
    const store = createPerformanceTierStore(clock);

    store.start();
    clock.fireReady();
    clock.runFrames(2_300, (elapsed) => (elapsed >= 1_000 && elapsed < 1_500 ? 50 : 16.7));

    expect(store.getTier()).toBe('full');
  });

  it('?perf=lite forces lite without measuring or persisting', () => {
    window.history.replaceState({}, '', '/?perf=lite');
    const clock = createFakeClock();
    const store = createPerformanceTierStore(clock);

    store.start();

    expect(store.getTier()).toBe('lite');
    expect(document.documentElement.dataset.perf).toBe('lite');
    expect(clock.scheduleStart).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem(PERF_STORAGE_KEY)).toBeNull();
  });

  it('does not persist a decision taken while a tier is forced by the URL', () => {
    window.history.replaceState({}, '', '/?perf=full');
    const clock = createFakeClock();
    const store = createPerformanceTierStore(clock);
    store.start();

    store.requestLite();

    expect(store.getTier()).toBe('lite');
    expect(document.documentElement.dataset.perf).toBe('lite');
    expect(window.sessionStorage.getItem(PERF_STORAGE_KEY)).toBeNull();
  });

  it('still persists automatic decisions when no tier is forced', () => {
    const clock = createFakeClock();
    const store = createPerformanceTierStore(clock);
    store.start();

    store.requestLite();

    expect(window.sessionStorage.getItem(PERF_STORAGE_KEY)).toBe('lite');
  });

  it('?perf=full wins over a stored lite decision', () => {
    window.sessionStorage.setItem(PERF_STORAGE_KEY, 'lite');
    window.history.replaceState({}, '', '/?perf=full');
    const clock = createFakeClock();
    const store = createPerformanceTierStore(clock);

    expect(store.getTier()).toBe('full');
    expect(document.documentElement.dataset.perf).toBeUndefined();
    expect(window.sessionStorage.getItem(PERF_STORAGE_KEY)).toBe('lite');
  });

  it('ignores an invalid ?perf value and measures normally', () => {
    window.history.replaceState({}, '', '/?perf=turbo');
    const clock = createFakeClock();
    const store = createPerformanceTierStore(clock);

    store.start();

    expect(store.getTier()).toBe('full');
    expect(clock.scheduleStart).toHaveBeenCalledTimes(1);
  });

  it('enters lite when hardwareConcurrency <= 2 without measuring', () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 2 });
    const clock = createFakeClock();
    const store = createPerformanceTierStore(clock);

    store.start();

    expect(store.getTier()).toBe('lite');
    expect(clock.scheduleStart).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem(PERF_STORAGE_KEY)).toBe('lite');
  });

  it('enters lite when deviceMemory <= 2', () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 8, deviceMemory: 2 });
    const store = createPerformanceTierStore(createFakeClock());

    expect(store.getTier()).toBe('lite');
  });

  it('ignores non-numeric hardware values', () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 'two', deviceMemory: null });
    const clock = createFakeClock();
    const store = createPerformanceTierStore(clock);

    store.start();

    expect(store.getTier()).toBe('full');
    expect(clock.scheduleStart).toHaveBeenCalledTimes(1);
  });

  it.each(['lite', 'full'] as const)('does not measure again when the session stored %s', (stored) => {
    window.sessionStorage.setItem(PERF_STORAGE_KEY, stored);
    const clock = createFakeClock();
    const store = createPerformanceTierStore(clock);

    store.start();

    expect(store.getTier()).toBe(stored);
    expect(clock.scheduleStart).not.toHaveBeenCalled();
  });

  it('does not sample while the tab is hidden and resumes when visible', () => {
    setVisibility('hidden');
    const clock = createFakeClock();
    const store = createPerformanceTierStore(clock);

    store.start();
    clock.fireReady();
    expect(clock.requestFrame).not.toHaveBeenCalled();

    setVisibility('visible');
    expect(clock.requestFrame).toHaveBeenCalledTimes(1);

    clock.runFrames(2_300, () => 16.7);
    expect(store.getTier()).toBe('full');
  });

  it('cancels the scheduled measurement when the last consumer leaves', () => {
    const clock = createFakeClock();
    const store = createPerformanceTierStore(clock);

    const release = store.start();
    release();

    expect(clock.cancelSchedule).toHaveBeenCalled();
  });

  it('keeps working when sessionStorage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    const clock = createFakeClock();
    const store = createPerformanceTierStore(clock);

    store.start();
    clock.fireReady();
    clock.runFrames(2_300, () => 50);

    expect(store.getTier()).toBe('lite');
    expect(document.documentElement.dataset.perf).toBe('lite');
  });
});

describe('usePerformanceTier', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState({}, '', '/');
    delete document.documentElement.dataset.perf;
  });

  it('reads the forced tier from the URL', () => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 8 });
    window.history.replaceState({}, '', '/?perf=lite');

    const { result } = renderHook(() => usePerformanceTier());

    expect(result.current).toBe('lite');
  });
});