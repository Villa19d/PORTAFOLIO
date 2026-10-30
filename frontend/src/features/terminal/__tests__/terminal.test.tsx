import { fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../../lib/i18n';
import { useSound } from '../../sound/SoundContext';
import { TerminalModal } from '../TerminalModal';
import { executeCommand, executeCommandLines, type TerminalContext } from '../terminalInterpreter';

vi.mock('../../../components/SmoothScrollProvider', () => ({
  useSmoothScroll: () => ({ scrollTo: vi.fn() }),
}));

vi.mock('../../../components/ThemeProvider', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }),
}));

vi.mock('../../sound/SoundContext', () => ({
  useSound: vi.fn(),
}));

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');

function createContext(overrides: Partial<TerminalContext> = {}): TerminalContext {
  return {
    language: 'es',
    history: [],
    username: 'guest',
    onContact: vi.fn(),
    onTheme: vi.fn(),
    onLanguage: vi.fn(),
    onSound: vi.fn(),
    ...overrides,
  };
}

function renderTerminal() {
  return render(
    <I18nextProvider i18n={i18n}>
      <TerminalModal onClose={vi.fn()} />
    </I18nextProvider>,
  );
}

describe('terminal interpreter', () => {
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
      },
    });
    vi.mocked(useSound).mockReturnValue({
      enabled: false,
      toggle: vi.fn(),
      play: vi.fn(),
    });
  });

  it.each(['help', 'about', 'skills', 'projects', 'experience', 'whoami', 'ls', 'history'])(
    'supports %s',
    (command) => {
      const result = executeCommand(command, createContext({ history: ['help'] }));
      expect(result.length).toBeGreaterThan(0);
      expect(result.join('\n')).not.toMatch(/@|correo|email/i);
    },
  );

  it('supports cat, clear, theme, language, sound and contact callbacks', () => {
    const context = createContext();
    expect(executeCommand('cat about.md', context).join('\n')).not.toMatch(/<script|<b>/i);
    expect(executeCommand('clear', context)).toEqual([]);
    executeCommand('theme light', context);
    executeCommand('lang en', context);
    executeCommand('sound on', context);
    executeCommand('contact', context);
    expect(context.onTheme).toHaveBeenCalledWith('light');
    expect(context.onLanguage).toHaveBeenCalledWith('en');
    expect(context.onSound).toHaveBeenCalledWith(true);
    expect(context.onContact).toHaveBeenCalledOnce();
  });

  it('supports the hiring easter egg and unknown commands', () => {
    const context = createContext();
    expect(executeCommand('sudo hire rodrigo', context).join('\n')).toMatch(/decisión|decision/i);
    expect(executeCommand('unknown-command', context).join('\n')).toMatch(/command not found/i);
  });

  it('tags each result line without changing the plain text API', () => {
    const context = createContext();
    expect(executeCommandLines('help', context).map((line) => line.kind)).toEqual(['output']);
    expect(executeCommandLines('theme light', context).map((line) => line.kind)).toEqual(['success']);
    expect(executeCommandLines('theme nope', context).map((line) => line.kind)).toEqual(['error']);
    expect(executeCommandLines('cat missing.txt', context).map((line) => line.kind)).toEqual(['error']);
    expect(executeCommandLines('sudo hire rodrigo', context).map((line) => line.kind)).toEqual(['success']);
    expect(executeCommandLines('clear', context)).toEqual([]);
    expect(executeCommandLines('help', context)[0]?.text).toBe(executeCommand('help', context)[0]);
  });
});

describe('TerminalModal', () => {
  beforeEach(() => {
    vi.mocked(useSound).mockReturnValue({
      enabled: false,
      toggle: vi.fn(),
      play: vi.fn(),
    });
  });

  afterEach(() => {
    if (originalShowModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', originalShowModal);
    if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, 'close', originalClose);
    vi.restoreAllMocks();
  });

  it('navigates command history and autocompletes with Tab', () => {
    renderTerminal();
    const input = screen.getByRole('textbox', { name: /comando de terminal/i });

    fireEvent.change(input, { target: { value: 'help' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(input).toHaveValue('about');

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input).toHaveValue('help');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveValue('');
  });

  it('renders command output as text and never as HTML', () => {
    renderTerminal();
    const input = screen.getByRole('textbox', { name: /comando de terminal/i });
    fireEvent.change(input, { target: { value: 'about' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('log').querySelector('script')).not.toBeInTheDocument();
    expect(screen.getByRole('log').textContent).not.toMatch(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    );
  });

  it('renders the window chrome and the welcome hint from i18n', () => {
    renderTerminal();

    expect(screen.getByText('rodrigo@portfolio: ~')).toBeInTheDocument();
    expect(screen.getByRole('log')).toHaveTextContent(/escribe help|type help/i);
    expect(screen.getByText(/esc salir|esc exit/i)).toBeInTheDocument();
  });

  it('colours the command echo, the output, the success and the error lines', () => {
    const { container } = renderTerminal();
    const input = screen.getByRole('textbox', { name: /comando de terminal/i });

    fireEvent.change(input, { target: { value: 'help' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.change(input, { target: { value: 'theme light' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.change(input, { target: { value: 'nope' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // welcome + help output
    expect(container.querySelectorAll('.terminal-window__line--output')).toHaveLength(2);
    expect(container.querySelectorAll('.terminal-window__line--command')).toHaveLength(3);
    expect(container.querySelectorAll('.terminal-window__line--success')).toHaveLength(1);
    expect(container.querySelectorAll('.terminal-window__line--error')).toHaveLength(1);
  });

  it('closes with the close button', () => {
    const onClose = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <TerminalModal onClose={onClose} />
      </I18nextProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /cerrar terminal|close terminal/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
