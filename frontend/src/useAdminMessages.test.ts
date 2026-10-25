import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { deleteAdminMessage } from './adminMessagesApi';
import { adminMessagesQueryKey, useDeleteAdminMessage } from './useAdminMessages';

vi.mock('./adminMessagesApi', () => ({
  deleteAdminMessage: vi.fn(),
  getAdminMessages: vi.fn(),
}));

describe('useAdminMessages', () => {
  it('deletes a message and invalidates all message pages', async () => {
    vi.mocked(deleteAdminMessage).mockResolvedValue(undefined);
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: PropsWithChildren) => (
      createElement(QueryClientProvider, { client: queryClient }, children)
    );
    const { result } = renderHook(() => useDeleteAdminMessage(), { wrapper });

    result.current.mutate('message-1');

    await waitFor(() => {
      expect(deleteAdminMessage).toHaveBeenCalledWith('message-1');
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: adminMessagesQueryKey });
    });
  });
});
