import { act, renderHook } from '@testing-library/react';
import type { RefObject } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hasWebGL2, useHeroSceneGate } from './useHeroSceneGate';

const capabilities = vi.hoisted(() => ({
  current: { canUseHeavyEffects: true, perfTier: 'full' as 'full' | 'lite' },
}));

vi.mock('../../../hooks/useCapabilities', () => ({
  useCapabilities: () => capabilities.current,
}));

class FakeIntersectionObserver {
  static latest: FakeIntersectionObserver | null = null;
  readonly callback: IntersectionObserverCallback;
  readonly observe = vi.fn();
  readonly disconnect = vi.fn();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.latest = this;
  }

  report(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

function setReadyState(state: DocumentReadyState) {
  Object.defineProperty(document, 'readyState', { configurable: true, get: () => state });
}

function stubWebGL(available: boolean) {
  const loseContext = vi.fn();
  const context = { getExtension: vi.fn(() => ({ loseContext })) };
  const getContext = vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockImplementation(((type: string) =>
      available && type === 'webgl2' ? context : null) as unknown as HTMLCanvasElement['getContext']);
  return { getContext, loseContext };
}

function renderGate() {
  const ref: RefObject<HTMLElement | null> = { current: document.createElement('section') };
  return renderHook(() => useHeroSceneGate(ref));
}

function reportVisible(isVisible: boolean) {
  act(() => {
    FakeIntersectionObserver.latest?.report(isVisible);
  });
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe('useHeroSceneGate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    FakeIntersectionObserver.latest = null;
    capabilities.current = { canUseHeavyEffects: true, perfTier: 'full' };
    setReadyState('complete');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    Reflect.deleteProperty(document, 'readyState');
  });

  it('opens once the page is loaded, the browser is idle, the Hero is visible and WebGL2 exists', () => {
    const { loseContext } = stubWebGL(true);
    const { result } = renderGate();
    expect(result.current).toBe(false);

    reportVisible(true);
    expect(result.current).toBe(false);

    advance(200);
    expect(result.current).toBe(true);
    expect(loseContext).toHaveBeenCalledTimes(1);
  });

  it('also opens when the idle moment arrives before the Hero becomes visible', () => {
    stubWebGL(true);
    const { result } = renderGate();

    advance(200);
    expect(result.current).toBe(false);

    reportVisible(true);
    expect(result.current).toBe(true);
  });

  it('uses requestIdleCallback when the browser provides it', () => {
    stubWebGL(true);
    vi.stubGlobal('requestIdleCallback', (callback: IdleRequestCallback) => {
      callback({ didTimeout: false, timeRemaining: () => 0 });
      return 1;
    });
    vi.stubGlobal('cancelIdleCallback', vi.fn());
    const { result } = renderGate();

    reportVisible(true);

    expect(result.current).toBe(true);
  });

  it('waits for the window load event', () => {
    stubWebGL(true);
    setReadyState('loading');
    const { result } = renderGate();

    reportVisible(true);
    advance(1_000);
    expect(result.current).toBe(false);

    act(() => {
      setReadyState('complete');
      window.dispatchEvent(new Event('load'));
    });
    advance(200);
    expect(result.current).toBe(true);
  });

  it('stays closed while the Hero is not visible', () => {
    stubWebGL(true);
    const { result } = renderGate();

    advance(5_000);
    expect(result.current).toBe(false);

    reportVisible(false);
    expect(result.current).toBe(false);
  });

  it('does not even probe WebGL when heavy effects are not allowed', () => {
    const { getContext } = stubWebGL(true);
    capabilities.current = { canUseHeavyEffects: false, perfTier: 'full' };
    const { result } = renderGate();

    reportVisible(true);
    advance(5_000);

    expect(result.current).toBe(false);
    expect(getContext).not.toHaveBeenCalled();
    expect(FakeIntersectionObserver.latest).toBeNull();
  });

  it('does not probe WebGL in the lite tier', () => {
    const { getContext } = stubWebGL(true);
    capabilities.current = { canUseHeavyEffects: true, perfTier: 'lite' };
    const { result } = renderGate();

    reportVisible(true);
    advance(5_000);

    expect(result.current).toBe(false);
    expect(getContext).not.toHaveBeenCalled();
  });

  it('stays closed when WebGL2 is not available', () => {
    stubWebGL(false);
    const { result } = renderGate();

    reportVisible(true);
    advance(200);

    expect(result.current).toBe(false);
  });

  it('closes again when the tier changes to lite after opening', () => {
    stubWebGL(true);
    const { result, rerender } = renderGate();
    reportVisible(true);
    advance(200);
    expect(result.current).toBe(true);

    capabilities.current = { canUseHeavyEffects: false, perfTier: 'lite' };
    rerender();

    expect(result.current).toBe(false);
  });

  it('cancels timers and disconnects the observer on unmount', () => {
    stubWebGL(true);
    const { unmount } = renderGate();
    const observer = FakeIntersectionObserver.latest;

    unmount();

    expect(observer?.disconnect).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('hasWebGL2', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when the browser cannot create a webgl2 context', () => {
    stubWebGL(false);
    expect(hasWebGL2()).toBe(false);
  });

  it('returns false when probing throws', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(hasWebGL2()).toBe(false);
  });

  it('returns true and releases the probe context', () => {
    const { loseContext } = stubWebGL(true);
    expect(hasWebGL2()).toBe(true);
    expect(loseContext).toHaveBeenCalledTimes(1);
  });
});