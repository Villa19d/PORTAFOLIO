import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveBentoWorldAvailability, useBentoWorldGate } from './useBentoWorldGate';

const mocks = vi.hoisted(() => ({ canUseHeavyEffects: true, webgl: true }));

vi.mock('../../../hooks/useCapabilities', () => ({
  useCapabilities: () => ({ canUseHeavyEffects: mocks.canUseHeavyEffects }),
}));

vi.mock('../../hero/three/useHeroSceneGate', () => ({
  hasWebGL2: () => mocks.webgl,
}));

describe('resolveBentoWorldAvailability', () => {
  it.each([
    { heavy: true, webgl: true, expected: true, why: 'capable desktop with WebGL2' },
    { heavy: true, webgl: false, expected: false, why: 'no WebGL2 context' },
    { heavy: false, webgl: true, expected: false, why: 'mobile, lite tier or reduced motion' },
    { heavy: false, webgl: false, expected: false, why: 'neither condition' },
  ])('returns $expected for $why', ({ heavy, webgl, expected }) => {
    expect(resolveBentoWorldAvailability(heavy, webgl)).toBe(expected);
  });
});

describe('useBentoWorldGate', () => {
  afterEach(() => {
    mocks.canUseHeavyEffects = true;
    mocks.webgl = true;
  });

  it('opens the gate once the WebGL2 probe has run on a capable desktop', async () => {
    const { result } = renderHook(() => useBentoWorldGate());

    await waitFor(() => expect(result.current).toBe(true));
  });

  it('stays closed when heavy effects are not allowed', () => {
    mocks.canUseHeavyEffects = false;

    const { result } = renderHook(() => useBentoWorldGate());

    expect(result.current).toBe(false);
  });
});
