import { describe, expect, it } from 'vitest';
import {
  buildImageSrcSet,
  getSafeExternalUrl,
  getLocalized,
  isCloudinaryImageUrl,
  isPlaceholderImageUrl,
} from './projectHelpers';

describe('getLocalized', () => {
  const text = { es: 'Proyecto', en: 'Project' };

  it('returns the requested translation', () => {
    expect(getLocalized(text, 'en')).toBe('Project');
    expect(getLocalized(text, 'en-US')).toBe('Project');
    expect(getLocalized(text, 'es')).toBe('Proyecto');
  });

  it('falls back to Spanish for unsupported or empty translations', () => {
    expect(getLocalized(text, 'fr')).toBe('Proyecto');
    expect(getLocalized({ es: 'Proyecto', en: '' }, 'en')).toBe('Proyecto');
  });
});

describe('getSafeExternalUrl', () => {
  it('allows absolute HTTP, HTTPS, and mailto URLs only', () => {
    expect(getSafeExternalUrl('https://example.org/project')).toBe(
      'https://example.org/project',
    );
    expect(getSafeExternalUrl('http://example.org/project')).toBe(
      'http://example.org/project',
    );
    expect(getSafeExternalUrl('mailto:hello@example.org')).toBe('mailto:hello@example.org');
    expect(getSafeExternalUrl('javascript:alert(1)')).toBeUndefined();
    expect(getSafeExternalUrl('/relative/path')).toBeUndefined();
    expect(getSafeExternalUrl(null)).toBeUndefined();
  });
});

describe('buildImageSrcSet', () => {
  it('adds Cloudinary format, quality, and responsive width transforms', () => {
    expect(
      buildImageSrcSet('https://res.cloudinary.com/demo/image/upload/sample.jpg')
    ).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_400/sample.jpg 400w, ' +
        'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800/sample.jpg 800w, ' +
        'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_1200/sample.jpg 1200w'
    );
  });

  it('leaves URLs from other hosts unchanged', () => {
    const url = 'https://images.example.org/project.webp';
    expect(buildImageSrcSet(url)).toBe(url);
    expect(isCloudinaryImageUrl(url)).toBe(false);
    expect(isCloudinaryImageUrl('https://res.cloudinary.com/portfolio/image/upload/project.jpg'))
      .toBe(true);
  });
});

describe('isPlaceholderImageUrl', () => {
  it('recognizes empty, example.com, and Cloudinary demo images', () => {
    expect(isPlaceholderImageUrl('')).toBe(true);
    expect(isPlaceholderImageUrl('https://example.com/image.webp')).toBe(true);
    expect(isPlaceholderImageUrl('https://cdn.example.com/image.webp')).toBe(true);
    expect(
      isPlaceholderImageUrl('https://res.cloudinary.com/demo/image/upload/sample.jpg')
    ).toBe(true);
  });

  it('accepts real image URLs', () => {
    expect(isPlaceholderImageUrl('https://res.cloudinary.com/portfolio/image/upload/project.jpg'))
      .toBe(false);
  });
});
