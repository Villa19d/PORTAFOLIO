import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEntranceMotion } from './useEntranceMotion';

const capabilities = vi.hoisted(() => ({
  value: {
    hasFinePointer: true,
    isDesktopLayout: true,
    prefersReducedMotion: false,
    canUseHeavyEffects: true,
    perfTier: 'full' as 'full' | 'lite',
  },
}));

vi.mock('./useCapabilities', () => ({
  useCapabilities: () => capabilities.value,
}));

describe('useEntranceMotion', () => {
  beforeEach(() => {
    capabilities.value = {
      hasFinePointer: true,
      isDesktopLayout: true,
      prefersReducedMotion: false,
      canUseHeavyEffects: true,
      perfTier: 'full',
    };
  });

  it('does not skip entrance in full tier without reduced motion', () => {
    const { result } = renderHook(() => useEntranceMotion());
    expect(result.current.skipEntrance).toBe(false);
  });

  it('skips entrance in lite tier', () => {
    capabilities.value = { ...capabilities.value, perfTier: 'lite', canUseHeavyEffects: false };
    const { result } = renderHook(() => useEntranceMotion());
    expect(result.current.skipEntrance).toBe(true);
  });

  it('skips entrance when prefers-reduced-motion is set', () => {
    capabilities.value = {
      ...capabilities.value,
      prefersReducedMotion: true,
      canUseHeavyEffects: false,
    };
    const { result } = renderHook(() => useEntranceMotion());
    expect(result.current.skipEntrance).toBe(true);
  });

  it('skips entrance when both lite tier and reduced motion', () => {
    capabilities.value = {
      ...capabilities.value,
      perfTier: 'lite',
      prefersReducedMotion: true,
      canUseHeavyEffects: false,
    };
    const { result } = renderHook(() => useEntranceMotion());
    expect(result.current.skipEntrance).toBe(true);
  });
});