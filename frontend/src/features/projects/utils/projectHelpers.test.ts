import { describe, expect, it } from 'vitest';
import {
  parseYoutubeUrl,
  getProjectGallery,
  getProjectRepos,
  buildImageSrcSet,
  getSafeExternalUrl,
  getLocalized,
  getProjectVideoSource,
  isCloudinaryImageUrl,
  isPlaceholderImageUrl,
  nextIndex,
  resolveCarouselLayout,
  type CarouselDirection,
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

  describe('getProjectVideoSource', () => {
    it('accepts only HTTPS YouTube URLs and Cloudinary MP4 files', () => {
      expect(getProjectVideoSource('https://www.youtube.com/watch?v=abc123_DEF')).toEqual({
        kind: 'youtube',
        embedUrl: 'https://www.youtube-nocookie.com/embed/abc123_DEF?rel=0&playsinline=1',
      });
      expect(getProjectVideoSource('https://res.cloudinary.com/portfolio/video/upload/demo.mp4')).toEqual({
        kind: 'cloudinary',
        url: 'https://res.cloudinary.com/portfolio/video/upload/demo.mp4',
      });
      expect(getProjectVideoSource('https://videos.example.com/demo.mp4')).toBeUndefined();
      expect(getProjectVideoSource('http://www.youtube.com/watch?v=abc123_DEF')).toBeUndefined();
    });
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

describe('resolveCarouselLayout', () => {
  it('picks the single, duo and carousel layout by amount of projects', () => {
    expect(resolveCarouselLayout(0)).toBe('single');
    expect(resolveCarouselLayout(1)).toBe('single');
    expect(resolveCarouselLayout(2)).toBe('duo');
    expect(resolveCarouselLayout(3)).toBe('carousel');
    expect(resolveCarouselLayout(4)).toBe('carousel');
    expect(resolveCarouselLayout(9)).toBe('carousel');
  });
});

describe('nextIndex', () => {
  it('bounces at the ends instead of looping (n=3, from index 1, direction +1)', () => {
    let state: { index: number; direction: CarouselDirection } = { index: 1, direction: 1 };
    const visited = [state.index];

    for (let step = 0; step < 5; step += 1) {
      state = nextIndex(state.index, state.direction, 3);
      visited.push(state.index);
    }

    expect(visited).toEqual([1, 2, 1, 0, 1, 2]);
  });
});

describe('parseYoutubeUrl', () => {
  it('parses supported link shapes into embed, thumbnail and watch URLs', () => {
    expect(parseYoutubeUrl('https://youtu.be/abc123_DEF')).toEqual({
      videoId: 'abc123_DEF',
      embedUrl: 'https://www.youtube-nocookie.com/embed/abc123_DEF?rel=0&playsinline=1&autoplay=1',
      thumbnailUrl: 'https://i.ytimg.com/vi/abc123_DEF/hqdefault.jpg',
      watchUrl: 'https://www.youtube.com/watch?v=abc123_DEF',
    });
    expect(parseYoutubeUrl('https://www.youtube.com/shorts/abc123_DEF')?.videoId).toBe('abc123_DEF');
  });

  it('rejects other hosts, http and malformed links', () => {
    expect(parseYoutubeUrl('https://vimeo.com/123456789')).toBeUndefined();
    expect(parseYoutubeUrl('http://www.youtube.com/watch?v=abc123_DEF')).toBeUndefined();
    expect(parseYoutubeUrl('https://www.youtube.com/watch')).toBeUndefined();
    expect(parseYoutubeUrl(null)).toBeUndefined();
  });
});

describe('getProjectGallery', () => {
  const base = { imageUrl: 'https://images.test/cover.webp', videoUrl: null };

  it('returns only the cover for a snapshot without media', () => {
    expect(getProjectGallery(base)).toEqual([{ kind: 'image', url: base.imageUrl }]);
  });

  it('keeps the cover first and the media order, dropping invalid and duplicate entries', () => {
    const gallery = getProjectGallery({
      ...base,
      media: [
        { type: 'YOUTUBE', url: 'https://youtu.be/abc123_DEF' },
        { type: 'IMAGE', url: 'https://images.test/2.webp' },
        { type: 'IMAGE', url: base.imageUrl },
        { type: 'IMAGE', url: 'http://insecure.test/3.webp' },
        { type: 'YOUTUBE', url: 'https://vimeo.com/123456789' },
      ],
    });

    expect(gallery.map((item) => item.kind)).toEqual(['image', 'youtube', 'image']);
    expect(gallery[2]?.url).toBe('https://images.test/2.webp');
  });

  it('uses the legacy videoUrl only when media is empty', () => {
    const videoUrl = 'https://www.youtube.com/watch?v=abc123_DEF';
    expect(getProjectGallery({ ...base, videoUrl }).map((item) => item.kind)).toEqual(['image', 'youtube']);
    expect(
      getProjectGallery({ ...base, videoUrl, media: [{ type: 'IMAGE', url: 'https://images.test/2.webp' }] })
        .map((item) => item.kind),
    ).toEqual(['image', 'image']);
  });
});

describe('getProjectRepos', () => {
  it('falls back to repoUrl when repos is missing or empty', () => {
    expect(getProjectRepos({ repoUrl: 'https://github.com/a/b' })).toEqual([
      { label: null, url: 'https://github.com/a/b' },
    ]);
    expect(getProjectRepos({ repoUrl: 'https://github.com/a/b', repos: [] })).toHaveLength(1);
  });

  it('keeps order, trims labels and drops unsafe URLs', () => {
    expect(
      getProjectRepos({
        repoUrl: 'https://github.com/a/front',
        repos: [
          { label: ' Frontend ', url: 'https://github.com/a/front' },
          { label: null, url: 'javascript:alert(1)' },
          { label: '  ', url: 'https://github.com/a/back' },
        ],
      }),
    ).toEqual([
      { label: 'Frontend', url: 'https://github.com/a/front' },
      { label: null, url: 'https://github.com/a/back' },
    ]);
  });
});