import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminContactMessage, AdminMessagesPage } from './adminMessagesApi';
import MessagesView from './MessagesView';

const mocks = vi.hoisted(() => ({
  useAdminMessages: vi.fn(),
  useDeleteAdminMessage: vi.fn(),
}));

vi.mock('./useAdminMessages', () => mocks);

const message: AdminContactMessage = {
  id: 'message-1',
  name: 'Ana Pérez',
  email: 'ana@example.com',
  message: 'Mensaje de prueba',
  status: 'PENDING',
  createdAt: '2026-10-24T18:00:00Z',
  sentAt: null,
};

function page(overrides: Partial<AdminMessagesPage> = {}): AdminMessagesPage {
  return {
    content: [message],
    first: true,
    last: true,
    number: 0,
    size: 20,
    totalElements: 1,
    totalPages: 1,
    ...overrides,
  };
}

function setLoadedPage(data = page()) {
  mocks.useAdminMessages.mockReturnValue({ data, isError: false, isLoading: false });
}

describe('MessagesView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useDeleteAdminMessage.mockReturnValue({
      isError: false,
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue(undefined),
    });
    setLoadedPage();
  });

  it('renders hostile content literally as plain text', () => {
    const hostileMessage = '<script>alert(\'xss\')</script> <a href="javascript:alert(1)">click</a> <b>negrita</b>';
    setLoadedPage(page({ content: [{ ...message, message: hostileMessage }] }));

    render(<MessagesView />);

    expect(screen.getByText(hostileMessage)).toBeInTheDocument();
    expect(document.querySelector('script')).not.toBeInTheDocument();
    expect(document.querySelector('a[href^="javascript:"]')).not.toBeInTheDocument();
    expect(document.querySelector('b')).not.toBeInTheDocument();
  });

  it('shows an accessible confirmation and deletes the selected message', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    mocks.useDeleteAdminMessage.mockReturnValue({ isError: false, isPending: false, mutateAsync });
    const user = userEvent.setup();
    render(<MessagesView />);

    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

    expect(mutateAsync).toHaveBeenCalledWith('message-1');
  });

  it('navigates to the next page', async () => {
    const user = userEvent.setup();
    setLoadedPage(page({ first: true, last: false, number: 0, totalPages: 2, totalElements: 21 }));
    render(<MessagesView />);

    await user.click(screen.getByRole('button', { name: 'Siguientes' }));

    expect(mocks.useAdminMessages).toHaveBeenLastCalledWith(1, 20);
  });

  it('renders loading, empty and error states', () => {
    mocks.useAdminMessages.mockReturnValue({ data: undefined, isError: false, isLoading: true });
    const { rerender } = render(<MessagesView />);
    expect(screen.getByText('Cargando mensajes...')).toBeInTheDocument();

    mocks.useAdminMessages.mockReturnValue({ data: page({ content: [] }), isError: false, isLoading: false });
    rerender(<MessagesView />);
    expect(screen.getByText('No hay mensajes para mostrar.')).toBeInTheDocument();

    mocks.useAdminMessages.mockReturnValue({ data: undefined, isError: true, isLoading: false });
    rerender(<MessagesView />);
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar los mensajes.');
  });

  it('generates a mailto link with an encoded subject', () => {
    render(<MessagesView />);

    const link = screen.getByRole('link', { name: 'Responder' });
    expect(link).toHaveAttribute(
      'href',
      `mailto:ana@example.com?subject=${encodeURIComponent('Re: Mensaje de contacto de Ana Pérez')}`,
    );
  });
});
