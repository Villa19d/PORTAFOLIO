import { I18nextProvider } from 'react-i18next';
import { ThemeProvider } from '../../../components/ThemeProvider';
import i18n from '../../../lib/i18n';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TurnstileWidget } from './TurnstileWidget';

function renderWidget(onToken = vi.fn()) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <TurnstileWidget onToken={onToken} />
      </ThemeProvider>
    </I18nextProvider>,
  );
}

describe('TurnstileWidget', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('es');
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'test-site-key');
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    delete window.turnstile;
    document.querySelectorAll('script[data-turnstile-script]').forEach((script) => script.remove());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.turnstile;
    document.querySelectorAll('script[data-turnstile-script]').forEach((script) => script.remove());
    vi.restoreAllMocks();
  });

  it('lazy-loads the script when the container intersects and renders explicitly', async () => {
    const onToken = vi.fn();
    const { container: rendered } = renderWidget(onToken);
    const container = rendered.firstElementChild as HTMLElement;
    const observer = (IntersectionObserver as unknown as { instances: Array<{ triggerIntersection: (element: Element, value: boolean) => void }> }).instances.at(-1);

    expect(document.querySelector('script[data-turnstile-script]')).not.toBeInTheDocument();
    await act(async () => {
      observer?.triggerIntersection(container, true);
    });

    const script = await waitFor(() => {
      const element = document.querySelector<HTMLScriptElement>('script[data-turnstile-script]');
      expect(element).toBeInTheDocument();
      return element;
    });

    const renderMock = vi.fn(() => 'widget-id');
    window.turnstile = { render: renderMock, reset: vi.fn() };
    await act(async () => {
      fireEvent.load(script!);
    });

    await waitFor(() => expect(renderMock).toHaveBeenCalledWith(container, expect.objectContaining({
      sitekey: 'test-site-key',
      appearance: 'interaction-only',
    })));
  });

  it('shows the LinkedIn alternative when the script fails', async () => {
    const { container: rendered } = renderWidget();
    const container = rendered.firstElementChild as HTMLElement;
    const observer = (IntersectionObserver as unknown as { instances: Array<{ triggerIntersection: (element: Element, value: boolean) => void }> }).instances.at(-1);
    await act(async () => {
      observer?.triggerIntersection(container, true);
    });

    const script = await waitFor(() => document.querySelector<HTMLScriptElement>('script[data-turnstile-script]'));
    await act(async () => {
      fireEvent.error(script!);
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('El sistema antispam fue bloqueado');
    expect(screen.getByRole('link', { name: 'Abrir mi perfil de LinkedIn' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/rodrigo-villar',
    );
  });

  it('loads on focus and forwards the generated token', async () => {
    const onToken = vi.fn();
    const { container } = renderWidget(onToken);
    const widgetContainer = container.firstElementChild as HTMLElement;
    await act(async () => {
      fireEvent.focus(widgetContainer);
    });

    const script = await waitFor(() => document.querySelector<HTMLScriptElement>('script[data-turnstile-script]'));
    const renderMock = vi.fn((_node: HTMLElement, options: { callback?: (token: string) => void }) => {
      options.callback?.('generated-token');
      return 'widget-id';
    });
    window.turnstile = { render: renderMock, reset: vi.fn() };
    await act(async () => {
      fireEvent.load(script!);
    });

    await waitFor(() => expect(onToken).toHaveBeenCalledWith('generated-token'));
  });
});
