import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../../lib/i18n';
import { CommandPalette } from '../CommandPalette';
import { CommandPaletteTrigger } from '../CommandPaletteTrigger';

const mocks = vi.hoisted(() => ({
  scrollTo: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  toggleTheme: vi.fn(),
  toggleSound: vi.fn(),
  playSound: vi.fn(),
}));

vi.mock('../../../components/SmoothScrollProvider', () => ({
  useSmoothScroll: () => ({
    scrollTo: mocks.scrollTo,
    pause: mocks.pause,
    resume: mocks.resume,
  }),
}));

vi.mock('../../../components/ThemeProvider', () => ({
  useTheme: () => ({ toggleTheme: mocks.toggleTheme }),
}));

vi.mock('../../sound/SoundContext', () => ({
  useSound: () => ({
    toggle: mocks.toggleSound,
    play: mocks.playSound,
  }),
}));

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');

function renderWithI18n(element: ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{element}</I18nextProvider>);
}

async function openWithShortcut(key: string, modifiers: KeyboardEventInit = {}) {
  fireEvent.keyDown(document, { key, ...modifiers });
  return screen.findByRole('dialog');
}

describe('CommandPalette', () => {
  beforeEach(() => {
    void i18n.changeLanguage('es');
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
    vi.clearAllMocks();
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
  });

  it.each([
    [{ ctrlKey: true }],
    [{ metaKey: true }],
  ])('opens with the command shortcut', async (modifiers) => {
    renderWithI18n(<CommandPaletteTrigger />);
    const dialog = await openWithShortcut('k', modifiers);
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveFocus();
  });

  it('opens with slash outside text fields but not inside an input or textarea', async () => {
    const { container } = renderWithI18n(
      <>
        <button type="button">Previous focus</button>
        <input aria-label="Outside input" />
        <textarea aria-label="Outside textarea" />
        <CommandPaletteTrigger />
      </>,
    );

    const input = screen.getByRole('textbox', { name: 'Outside input' });
    input.focus();
    fireEvent.keyDown(input, { key: '/' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    container.querySelector('button')?.focus();
    await openWithShortcut('/');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes with Escape and returns focus to the previously active element', async () => {
    renderWithI18n(
      <>
        <button type="button">Previous focus</button>
        <CommandPaletteTrigger />
      </>,
    );
    const trigger = screen.getByRole('button', { name: /abrir paleta/i });
    trigger.focus();
    await openWithShortcut('k', { ctrlKey: true });

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(trigger).toHaveFocus();
  });

  it('navigates options, updates aria-activedescendant and executes the active command', async () => {
    renderWithI18n(<CommandPalette onClose={vi.fn()} />);
    const dialog = await screen.findByRole('dialog');
    const search = screen.getByRole('combobox');
    const initialId = search.getAttribute('aria-activedescendant');

    fireEvent.keyDown(dialog, { key: 'ArrowDown' });
    expect(search.getAttribute('aria-activedescendant')).not.toBe(initialId);
    fireEvent.keyDown(dialog, { key: 'Enter' });

    expect(mocks.scrollTo).toHaveBeenCalled();
    expect(mocks.playSound).toHaveBeenCalledWith('click');
  });

  it('filters commands and never exposes the admin panel', async () => {
    renderWithI18n(<CommandPalette onClose={vi.fn()} />);
    await screen.findByRole('dialog');
    const search = screen.getByRole('combobox');

    fireEvent.change(search, { target: { value: 'proy' } });
    expect(screen.getByRole('option')).toHaveTextContent(/proyectos/i);
    expect(screen.queryByText(/admin/i)).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'admin' } });
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('closes with the visible close button', async () => {
    const onClose = vi.fn();
    renderWithI18n(<CommandPalette onClose={onClose} />);
    await screen.findByRole('dialog');

    fireEvent.click(screen.getByRole('button', { name: /cerrar paleta/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the backdrop is clicked', async () => {
    const onClose = vi.fn();
    renderWithI18n(<CommandPalette onClose={onClose} />);
    const dialog = await screen.findByRole('dialog');

    fireEvent.click(dialog);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('selects an option with the mouse', async () => {
    renderWithI18n(<CommandPalette onClose={vi.fn()} />);
    await screen.findByRole('dialog');
    const options = screen.getAllByRole('option');
    const hovered = options[2];

    expect(hovered).toBeDefined();
    fireEvent.mouseOver(hovered!.querySelector('button')!);

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-activedescendant', hovered!.id);
  });
});
