import { adminFetch } from './adminApi';

export type AdminMessageStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface AdminContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: AdminMessageStatus;
  createdAt: string;
  sentAt: string | null;
}

export interface AdminMessagesPage {
  content: AdminContactMessage[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

const MESSAGES_ENDPOINT = '/api/admin/messages';

export function getAdminMessages(page = 0, size = 20) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return adminFetch<AdminMessagesPage>(`${MESSAGES_ENDPOINT}?${params.toString()}`);
}

export function deleteAdminMessage(id: string) {
  return adminFetch<void>(`${MESSAGES_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
