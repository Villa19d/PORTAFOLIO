import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPerformanceTierStore, PERF_STORAGE_KEY } from './usePerformanceTier';

function createStore() {
  const cancelSchedule = vi.fn();
  const scheduleStart = vi.fn(() => cancelSchedule);
  const store = createPerformanceTierStore({
    now: () => 0,
    requestFrame: () => 1,
    cancelFrame: () => undefined,
    scheduleStart,
  });
  return { store, cancelSchedule, scheduleStart };
}

describe('PerformanceTierStore.requestLite', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { hardwareConcurrency: 8 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/');
    delete document.documentElement.dataset.perf;
  });

  it('switches to lite, persists the decision and notifies once', () => {
    const { store } = createStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.start();

    store.requestLite();

    expect(store.getTier()).toBe('lite');
    expect(document.documentElement.dataset.perf).toBe('lite');
    expect(window.sessionStorage.getItem(PERF_STORAGE_KEY)).toBe('lite');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('stops the running measurement', () => {
    const { store, cancelSchedule } = createStore();
    store.start();

    store.requestLite();

    expect(cancelSchedule).toHaveBeenCalled();
  });

  it('does not notify again when the tier is already lite', () => {
    const { store } = createStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.requestLite();
    store.requestLite();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('works before start() and prevents a later measurement', () => {
    const { store, scheduleStart } = createStore();

    store.requestLite();
    store.start();

    expect(store.getTier()).toBe('lite');
    expect(scheduleStart).not.toHaveBeenCalled();
  });
});