import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSmoothScroll } from '../../components/SmoothScrollProvider';
import { useTheme } from '../../components/ThemeProvider';
import { useSound } from '../sound/SoundContext';
import { executeCommandLines, type TerminalLanguage } from './terminalInterpreter';

type TerminalModalProps = { onClose: () => void };

type TerminalLine = {
  kind: 'command' | 'output' | 'success' | 'error';
  text: string;
};

const SUGGESTIONS = ['help', 'about', 'skills', 'projects', 'experience', 'contact', 'whoami', 'ls', 'cat', 'history', 'clear', 'theme', 'lang', 'sound', 'sudo'];

/** The window never takes more than this share of the viewport. */
const MAX_HEIGHT_RATIO = 0.7;
const MIN_HEIGHT_PX = 240;
/** Shrink of the visual viewport that we read as "the on-screen keyboard is open". */
const KEYBOARD_THRESHOLD_PX = 120;

export function TerminalModal({ onClose }: TerminalModalProps) {
  const { i18n, t } = useTranslation('common');
  const { scrollTo } = useSmoothScroll();
  const { theme, toggleTheme } = useTheme();
  const { enabled, toggle: toggleSound, play } = useSound();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(document.activeElement as HTMLElement);
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [output, setOutput] = useState<TerminalLine[]>([]);

  const language = (i18n.language.startsWith('en') ? 'en' : 'es') as TerminalLanguage;
  const prompt = t('terminal.prompt');
  const context = useMemo(() => ({
    language,
    history,
    onContact: () => scrollTo('#contact'),
    onTheme: (nextTheme: 'dark' | 'light') => {
      if (nextTheme !== theme) toggleTheme();
    },
    onLanguage: (nextLanguage: TerminalLanguage) => void i18n.changeLanguage(nextLanguage),
    onSound: (nextEnabled: boolean) => {
      if (nextEnabled !== enabled) toggleSound();
    },
  }), [enabled, history, i18n, language, scrollTo, theme, toggleSound, toggleTheme]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    inputRef.current?.focus();

    const viewport = window.visualViewport;
    if (!viewport) return;

    const adjustForViewport = () => {
      // The window is centred by CSS. Only when the on-screen keyboard shrinks the
      // visual viewport do we pin it to the top so the prompt stays reachable.
      const keyboardOpen = viewport.height < window.innerHeight - KEYBOARD_THRESHOLD_PX;

      if (!keyboardOpen) {
        dialog.style.removeProperty('top');
        dialog.style.removeProperty('bottom');
        dialog.style.removeProperty('max-height');
        return;
      }

      const top = Math.max(viewport.offsetTop + 16, 16);
      const available = Math.min(viewport.height - 32, window.innerHeight * MAX_HEIGHT_RATIO);
      dialog.style.top = `${top}px`;
      dialog.style.bottom = 'auto';
      dialog.style.maxHeight = `${Math.max(available, MIN_HEIGHT_PX)}px`;
      inputRef.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    };

    adjustForViewport();
    viewport.addEventListener('resize', adjustForViewport);
    viewport.addEventListener('scroll', adjustForViewport);
    return () => {
      viewport.removeEventListener('resize', adjustForViewport);
      viewport.removeEventListener('scroll', adjustForViewport);
      if (dialog.open && typeof dialog.close === 'function') dialog.close();
    };
  }, []);

  // Clicking the body focuses the input; links, buttons and the input keep their behaviour.
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const focusInput = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('a, button, input, textarea')) return;
      inputRef.current?.focus();
    };
    body.addEventListener('click', focusInput);
    return () => body.removeEventListener('click', focusInput);
  }, []);

  // Keep the newest line in view.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [output]);

  const close = () => {
    onClose();
    requestAnimationFrame(() => previousFocusRef.current?.focus());
  };

  const submit = () => {
    const command = value.trim();
    if (!command) return;
    play('key');
    const lines = executeCommandLines(command, context);
    setHistory((items) => [...items, command]);
    setHistoryIndex(-1);
    setValue('');
    if (command.toLocaleLowerCase() === 'clear') {
      setOutput([]);
      return;
    }
    setOutput((items) => [...items, { kind: 'command', text: `${prompt} ${command}` }, ...lines]);
    play(lines.length ? (command.toLocaleLowerCase() === 'sudo' ? 'success' : 'click') : 'error');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.ctrlKey && event.key.toLowerCase() === 'l') {
      event.preventDefault();
      setOutput([]);
      setValue('');
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const next = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(next);
      setValue(history[history.length - 1 - next] ?? '');
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = Math.max(historyIndex - 1, -1);
      setHistoryIndex(next);
      setValue(next === -1 ? '' : history[history.length - 1 - next] ?? '');
    } else if (event.key === 'Tab') {
      const match = SUGGESTIONS.find((item) => item.startsWith(value.toLocaleLowerCase()));
      if (match) {
        event.preventDefault();
        setValue(match);
      }
    } else if (event.key.length === 1) {
      play('key');
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="terminal-title"
      onCancel={(event) => { event.preventDefault(); close(); }}
      className="terminal-window"
    >
      {/* The accessible name stays "Terminal"; the bar shows the shell prompt instead. */}
      <h2 id="terminal-title" className="sr-only">{t('terminal.title')}</h2>

      <div className="terminal-window__bar">
        <span className="terminal-window__status" aria-hidden="true" />
        <span className="terminal-window__window-title">{t('terminal.windowTitle')}</span>
        <button type="button" onClick={close} aria-label={t('terminal.close')} className="terminal-window__close">
          <span aria-hidden="true">×</span>
          <span className="terminal-window__close-key" aria-hidden="true">{t('terminal.closeKey')}</span>
        </button>
      </div>

      <div className="terminal-window__body" ref={bodyRef}>
        <div ref={logRef} role="log" aria-live="polite" className="terminal-window__log" data-lenis-prevent="true">
          <p className="terminal-window__line terminal-window__line--output terminal-window__welcome">{t('terminal.welcome')}</p>
          {output.map((line, index) => (
            <div key={`${index}-${line.text}`} className={`terminal-window__line terminal-window__line--${line.kind}`}>
              {line.text}
            </div>
          ))}
        </div>

        <div className="terminal-window__prompt-row">
          <span className="terminal-window__prompt" aria-hidden="true">{prompt}</span>
          {value === '' && <span className="terminal-window__caret" aria-hidden="true" />}
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            aria-label={t('terminal.input')}
            autoComplete="off"
            spellCheck={false}
            className="terminal-window__input"
          />
        </div>
      </div>

      <div className="terminal-window__footer">{t('terminal.footer')}</div>
    </dialog>
  );
}
