import { I18nextProvider } from 'react-i18next';
import { ThemeProvider } from '../../../components/ThemeProvider';
import i18n from '../../../lib/i18n';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContactForm } from './ContactForm';

vi.mock('./TurnstileWidget', () => ({
  TurnstileWidget: ({ onToken, resetSignal }: { onToken: (token: string | null) => void; resetSignal?: number }) => {
    onToken('test-turnstile-token');
    return <div data-testid="turnstile" data-reset-signal={resetSignal} />;
  },
}));

function renderForm() {
  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <ContactForm />
      </ThemeProvider>
    </I18nextProvider>,
  );
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana Example' } });
  fireEvent.change(screen.getByLabelText('Correo electrónico'), {
    target: { value: 'ana@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Mensaje'), {
    target: { value: 'Este es un mensaje válido.' },
  });
}

function response(status: number, body: unknown = {}, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

describe('ContactForm', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('es');
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows client validation and does not fetch invalid input', () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    expect(screen.getAllByRole('alert')).toHaveLength(3);
    expect(screen.getByText('Escribe tu nombre.')).toBeInTheDocument();
    expect(screen.getByText('Escribe tu correo electrónico.')).toBeInTheDocument();
    expect(screen.getByText('Escribe un mensaje.')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('transitions to waiting after eight seconds', async () => {
    vi.useFakeTimers();
    const pending = new Promise<Response>(() => {});
    vi.mocked(fetch).mockReturnValue(pending);
    renderForm();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    expect(screen.getByRole('button', { name: 'Enviando…' })).toBeDisabled();
    expect(screen.getByLabelText('Nombre')).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000);
    });

    expect(screen.getByText('El servidor se está despertando, puede tardar hasta un minuto.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Despertando servidor…' })).toBeDisabled();
  });

  it('prevents double submission while the request is pending', () => {
    const pending = new Promise<Response>(() => {});
    vi.mocked(fetch).mockReturnValue(pending);
    renderForm();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enviando…' }));

    expect(fetch).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('Correo electrónico')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Enviando…' })).toBeDisabled();
  });

  it('maps 429 and Retry-After', async () => {
    vi.mocked(fetch).mockResolvedValue(response(429, {}, { 'Retry-After': '42' }));
    renderForm();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Has alcanzado el límite de envíos.');
    expect(screen.getByText('Vuelve a intentarlo en 42 segundos.')).toBeInTheDocument();
  });

  it('maps 400 field errors without echoing the payload', async () => {
    vi.mocked(fetch).mockResolvedValue(
      response(400, {
        detail: 'Validation failed',
        errors: [{ field: 'email', message: 'Email inválido' }],
      }),
    );
    renderForm();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    expect(await screen.findByText('Email inválido')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText('ana@example.com')).not.toBeInTheDocument();
  });

  it('maps 403 and resets Turnstile', async () => {
    vi.mocked(fetch).mockResolvedValue(response(403));
    renderForm();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Falló la verificación');
    expect(screen.getByTestId('turnstile')).toHaveAttribute('data-reset-signal', '1');
  });

  it('keeps values after a network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Network error'));
    renderForm();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo enviar el mensaje. Inténtalo de nuevo.');
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana Example');
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('ana@example.com');
    expect(screen.getByLabelText('Mensaje')).toHaveValue('Este es un mensaje válido.');
  });

  it('maps the 90-second timeout and keeps the form values', async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementation((_input, init) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      });
    });
    renderForm();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(90000);
    });

    expect(screen.getByRole('alert')).toHaveTextContent('El servidor está tardando demasiado.');
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana Example');
  });

  it('clears values, resets Turnstile and focuses success on 202', async () => {
    vi.mocked(fetch).mockResolvedValue(response(202, { id: 'message-id', status: 'SENT' }));
    renderForm();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    const success = await screen.findByText('Mensaje enviado correctamente. Gracias por escribirme.');
    await waitFor(() => expect(success).toHaveFocus());
    expect(screen.getByLabelText('Nombre')).toHaveValue('');
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('');
    expect(screen.getByLabelText('Mensaje')).toHaveValue('');
    expect(screen.getByTestId('turnstile')).toHaveAttribute('data-reset-signal', '1');
  });

  it('exposes accessible live regions and error roles', async () => {
    vi.mocked(fetch).mockResolvedValue(response(503));
    renderForm();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Servicio temporalmente no disponible.');
    expect(screen.getByText('Servicio temporalmente no disponible.').parentElement).toHaveAttribute(
      'role',
      'alert',
    );
  });
});
