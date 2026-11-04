import type { LocalizedText } from '../types';

const CLOUDINARY_HOST = 'res.cloudinary.com';
const CLOUDINARY_WIDTHS = [400, 800, 1200] as const;
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

export type ProjectVideoSource =
  | { kind: 'youtube'; embedUrl: string }
  | { kind: 'cloudinary'; url: string };

export function getLocalized(text: LocalizedText, lang: string): string {
  return (lang.toLowerCase().startsWith('en') ? text.en : text.es) || text.es;
}

export function getSafeExternalUrl(url: string | null | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:', 'mailto:'].includes(parsedUrl.protocol) ? url : undefined;
  } catch {
    return undefined;
  }
}

function isAllowedVideoHost(hostname: string): boolean {
  return YOUTUBE_HOSTS.has(hostname);
}

function getYoutubeVideoId(url: URL): string | undefined {
  const hostname = url.hostname.toLowerCase();
  let videoId: string | null = null;

  if (hostname === 'youtu.be') {
    videoId = url.pathname.split('/').filter(Boolean)[0] ?? null;
  } else if (url.pathname === '/watch') {
    videoId = url.searchParams.get('v');
  } else if (/^\/(?:embed|shorts)\/[^/]+$/u.test(url.pathname)) {
    videoId = url.pathname.split('/')[2] ?? null;
  }

  return videoId && /^[A-Za-z0-9_-]{6,20}$/u.test(videoId) ? videoId : undefined;
}

export function getProjectVideoSource(url: string | null | undefined): ProjectVideoSource | undefined {
  if (!url) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    if (
      parsedUrl.protocol !== 'https:' ||
      (hostname !== CLOUDINARY_HOST && !isAllowedVideoHost(hostname))
    ) {
      return undefined;
    }

    if (hostname === CLOUDINARY_HOST) {
      return parsedUrl.pathname.toLowerCase().endsWith('.mp4')
        ? { kind: 'cloudinary', url: parsedUrl.toString() }
        : undefined;
    }

    const videoId = getYoutubeVideoId(parsedUrl);
    return videoId
      ? {
          kind: 'youtube',
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1`,
        }
      : undefined;
  } catch {
    return undefined;
  }
}

export function isCloudinaryImageUrl(url: string): boolean {
  try {
    return new URL(url).hostname === CLOUDINARY_HOST;
  } catch {
    return false;
  }
}

export function buildImageSrcSet(url: string): string {
  if (!isCloudinaryImageUrl(url)) {
    return url;
  }

  const uploadPath = '/upload/';
  const uploadIndex = url.indexOf(uploadPath);
  if (uploadIndex === -1) {
    return url;
  }

  const prefix = url.slice(0, uploadIndex + uploadPath.length);
  const assetPath = url.slice(uploadIndex + uploadPath.length);

  return CLOUDINARY_WIDTHS.map(
    (width) => `${prefix}f_auto,q_auto,w_${width}/${assetPath} ${width}w`
  ).join(', ');
}

export function isPlaceholderImageUrl(url: string): boolean {
  if (!url.trim()) {
    return true;
  }

  try {
    const imageUrl = new URL(url);
    return (
      imageUrl.hostname === 'example.com' ||
      imageUrl.hostname.endsWith('.example.com') ||
      (imageUrl.hostname === CLOUDINARY_HOST && imageUrl.pathname.startsWith('/demo/'))
    );
  } catch {
    return false;
  }
}

/** Up to this many projects the section uses the large showcase layout (ticket 12.6). */
export const SHOWCASE_MAX_PROJECTS = 3;

export type CarouselLayout = 'showcase' | 'carousel';

/**
 * Layout of the projects section: 1-3 projects get the big showcase (no forced loop and
 * no duplicated slides), 4 or more keep the carousel track. Pure so it can be unit tested.
 */
export function resolveCarouselLayout(count: number): CarouselLayout {
  return count > 0 && count <= SHOWCASE_MAX_PROJECTS ? 'showcase' : 'carousel';
}
