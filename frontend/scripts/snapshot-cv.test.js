import { describe, expect, it } from 'vitest';
import { isValidCvDocument, isValidCvState } from './snapshot-cv.mjs';

describe('snapshot-cv validation', () => {
  it('accepts null and well-formed documents', () => {
    expect(isValidCvDocument(null)).toBe(true);
    expect(
      isValidCvDocument({
        fileName: 'cv.pdf',
        url: 'https://res.cloudinary.com/demo/raw/upload/v1/portfolio/cv/cv.pdf',
      }),
    ).toBe(true);
  });

  it('rejects documents without url and fileName strings', () => {
    expect(isValidCvDocument({ url: 'x' })).toBe(false);
    expect(isValidCvDocument({ fileName: 'x' })).toBe(false);
    expect(isValidCvDocument('x')).toBe(false);
    expect(isValidCvDocument(undefined)).toBe(false);
  });

  it('validates the { es, en } shape', () => {
    expect(isValidCvState({ es: null, en: null })).toBe(true);
    expect(isValidCvState({ es: { url: 'u', fileName: 'f' }, en: null })).toBe(true);
    expect(isValidCvState({ es: null })).toBe(false);
    expect(isValidCvState({ es: { url: 'u' }, en: null })).toBe(false);
    expect(isValidCvState(null)).toBe(false);
  });
});
