import { renderHook } from '@testing-library/react';
import { useCapabilities } from './useCapabilities';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('useCapabilities', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));

    vi.stubGlobal('navigator', {
      connection: {
        saveData: false,
      }
    });
  });

  it('should return default capabilities when nothing matches', () => {
    const { result } = renderHook(() => useCapabilities());
    expect(result.current.hasFinePointer).toBe(false);
    expect(result.current.isDesktopLayout).toBe(false);
    expect(result.current.prefersReducedMotion).toBe(false);
    expect(result.current.canUseHeavyEffects).toBe(false); // Because finePointer and desktopLayout are false
  });

  it('should enable heavy effects when all conditions are met', () => {
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: query === '(hover: hover) and (pointer: fine)' || query === '(min-width: 1024px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));

    const { result } = renderHook(() => useCapabilities());
    expect(result.current.hasFinePointer).toBe(true);
    expect(result.current.isDesktopLayout).toBe(true);
    expect(result.current.prefersReducedMotion).toBe(false);
    expect(result.current.canUseHeavyEffects).toBe(true);
  });

  it('should disable heavy effects if prefersReducedMotion is true', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: true, // all queries match, including prefersReducedMotion
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));

    const { result } = renderHook(() => useCapabilities());
    expect(result.current.prefersReducedMotion).toBe(true);
    expect(result.current.canUseHeavyEffects).toBe(false);
  });

  it('should disable heavy effects if saveData is true', () => {
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: query === '(hover: hover) and (pointer: fine)' || query === '(min-width: 1024px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));

    vi.stubGlobal('navigator', {
      connection: {
        saveData: true,
      }
    });

    const { result } = renderHook(() => useCapabilities());
    expect(result.current.canUseHeavyEffects).toBe(false);
  });
});
