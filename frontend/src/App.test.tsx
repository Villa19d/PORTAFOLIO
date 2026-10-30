import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { AppProviders } from './components/AppProviders';
import i18n from './lib/i18n';
import '@testing-library/jest-dom';

function renderApp() {
  return render(
    <AppProviders>
      <App />
    </AppProviders>
  );
}

describe('App Component', () => {
  it('renders the main content landmark', () => {
    renderApp();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders the navigation', () => {
    renderApp();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});

/**
 * S10 wiring, exercised on the real app tree (App plus its providers) instead of
 * the isolated components: the palette shortcut, the palette -> terminal command
 * and the Navbar terminal button.
 */
describe('App S10 wiring', () => {
  const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
  const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');

  beforeEach(() => {
    void i18n.changeLanguage('es');
    window.sessionStorage.setItem('boot_intro_seen', '1');
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.setAttribute('open', '');
      },
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.removeAttribute('open');
        this.dispatchEvent(new Event('close'));
      },
    });
  });

  afterEach(() => {
    if (originalShowModal) {
      Object.defineProperty(HTMLDialogElement.prototype, 'showModal', originalShowModal);
    } else {
      delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal;
    }
    if (originalClose) {
      Object.defineProperty(HTMLDialogElement.prototype, 'close', originalClose);
    } else {
      delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close;
    }
    window.sessionStorage.clear();
  });

  it('opens the command palette with Ctrl+K', async () => {
    renderApp();

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    // The lazy palette chunk is imported on demand, so allow more than the default 1 s.
    expect(await screen.findByRole('dialog', undefined, { timeout: 5_000 })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveFocus();
  });

  it('opens the terminal from the palette command', async () => {
    renderApp();

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    const palette = await screen.findByRole('dialog', undefined, { timeout: 5_000 });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'terminal' } });
    fireEvent.keyDown(palette, { key: 'Enter' });

    expect(await screen.findByRole('dialog', { name: 'Terminal' }, { timeout: 5_000 })).toBeInTheDocument();
    expect(screen.getByRole('log')).toBeInTheDocument();
  });

  it('opens the terminal from the Navbar button', async () => {
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: /ctrl/i }));

    expect(await screen.findByRole('dialog', { name: 'Terminal' }, { timeout: 5_000 })).toBeInTheDocument();
  });
});
