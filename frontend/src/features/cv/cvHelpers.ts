import type { CvState } from './useCv';

const RAW_UPLOAD_MARKER = '/raw/upload/';

export function getCvDownloadUrl(url: string): string {
  const index = url.indexOf(RAW_UPLOAD_MARKER);
  if (index === -1) {
    return url;
  }
  const insertAt = index + RAW_UPLOAD_MARKER.length;
  return `${url.slice(0, insertAt)}fl_attachment/${url.slice(insertAt)}`;
}

export function pickDefaultLang(cv: CvState, uiLang: string): 'es' | 'en' {
  const preferred: 'es' | 'en' = uiLang.startsWith('en') ? 'en' : 'es';
  const fallback: 'es' | 'en' = preferred === 'en' ? 'es' : 'en';
  return cv[preferred] ? preferred : fallback;
}
