import type { LocalizedText } from '../types';

const CLOUDINARY_HOST = 'res.cloudinary.com';
const CLOUDINARY_WIDTHS = [400, 800, 1200] as const;

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
