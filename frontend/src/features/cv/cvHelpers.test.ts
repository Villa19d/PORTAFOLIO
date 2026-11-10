import { describe, expect, it } from 'vitest';
import { getCvDownloadUrl, pickDefaultLang } from './cvHelpers';
import type { CvState } from './useCv';

const document = {
  fileName: 'cv.pdf',
  updatedAt: '2026-10-24T18:00:00Z',
  url: 'https://res.cloudinary.com/demo/raw/upload/v1793903492/portfolio/cv/cv.pdf',
};

describe('cvHelpers', () => {
  it('inserts fl_attachment right after /raw/upload/', () => {
    expect(getCvDownloadUrl(document.url)).toBe(
      'https://res.cloudinary.com/demo/raw/upload/fl_attachment/v1793903492/portfolio/cv/cv.pdf',
    );
  });

  it('returns the original url when the /raw/upload/ marker is missing', () => {
    expect(getCvDownloadUrl('https://example.com/cv.pdf')).toBe('https://example.com/cv.pdf');
  });

  it('prefers the ui language and falls back to the other one', () => {
    const onlyEn: CvState = { en: document, es: null };
    expect(pickDefaultLang(onlyEn, 'en')).toBe('en');
    expect(pickDefaultLang(onlyEn, 'es')).toBe('en');

    const onlyEs: CvState = { en: null, es: document };
    expect(pickDefaultLang(onlyEs, 'es')).toBe('es');
    expect(pickDefaultLang(onlyEs, 'en')).toBe('es');

    const both: CvState = { en: document, es: document };
    expect(pickDefaultLang(both, 'es')).toBe('es');
    expect(pickDefaultLang(both, 'en')).toBe('en');
  });
});
