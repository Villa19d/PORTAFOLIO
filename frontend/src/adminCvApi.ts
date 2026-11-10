import { adminFetch } from './adminApi';

export type CvLang = 'es' | 'en';

export interface CvDocument {
  url: string;
  fileName: string;
  updatedAt: string;
}

export interface CvState {
  es: CvDocument | null;
  en: CvDocument | null;
}

export interface CvUpsertInput {
  url: string;
  fileName: string;
}

export function getAdminCv() {
  return adminFetch<CvState>('/api/cv', { cache: 'no-store' });
}

export function saveAdminCv(lang: CvLang, cvDocument: CvUpsertInput) {
  return adminFetch<CvDocument>(`/api/admin/cv/${lang}`, {
    body: JSON.stringify(cvDocument),
    method: 'PUT',
  });
}

export function deleteAdminCv(lang: CvLang) {
  return adminFetch<void>(`/api/admin/cv/${lang}`, {
    method: 'DELETE',
  });
}
