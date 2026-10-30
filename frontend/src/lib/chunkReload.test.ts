import { describe, expect, it } from 'vitest';
import { isOptionalChunkFailure } from './chunkReload';

const preloadFailure = (url: string) =>
  new Error(`Failed to fetch dynamically imported module: ${url}`);

describe('isOptionalChunkFailure', () => {
  it('recognises the optional 3D chunks', () => {
    expect(
      isOptionalChunkFailure(
        preloadFailure('https://www.rodrigodvillar.com/assets/three-BIEv_vHk.js'),
      ),
    ).toBe(true);
    expect(isOptionalChunkFailure(preloadFailure('/assets/HeroScene-4at_U5Dm.js'))).toBe(true);
    expect(isOptionalChunkFailure('assets/HeroScene-4at_U5Dm.js')).toBe(true);
  });

  it('ignores every other chunk', () => {
    expect(isOptionalChunkFailure(preloadFailure('/assets/App-Co0jUxwy.js'))).toBe(false);
    expect(isOptionalChunkFailure(preloadFailure('/assets/AppProviders-BZE6aUny.js'))).toBe(false);
    expect(isOptionalChunkFailure(preloadFailure('/assets/SoundContext-DGMZ_db1.js'))).toBe(false);
    expect(
      isOptionalChunkFailure(preloadFailure('/assets/TerminalModal-CKznPcAh.js')),
    ).toBe(false);
    expect(
      isOptionalChunkFailure(preloadFailure('/assets/CommandPalette-B0hD9YJq.js')),
    ).toBe(false);
  });

  it('ignores payloads it cannot read', () => {
    expect(isOptionalChunkFailure(undefined)).toBe(false);
    expect(isOptionalChunkFailure(null)).toBe(false);
    expect(isOptionalChunkFailure({ message: '/assets/three-BIEv_vHk.js' })).toBe(false);
  });
});
