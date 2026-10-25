import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteAdminMessage,
  getAdminMessages,
  type AdminMessagesPage,
} from './adminMessagesApi';

export const adminMessagesQueryKey = ['admin', 'messages'] as const;

export function useAdminMessages(page: number, size: number) {
  return useQuery<AdminMessagesPage>({
    queryKey: [...adminMessagesQueryKey, page, size],
    queryFn: () => getAdminMessages(page, size),
  });
}

export function useDeleteAdminMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAdminMessage(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminMessagesQueryKey }),
  });
}
