import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSmoothScroll } from '../../components/SmoothScrollProvider';
import { useTheme } from '../../components/ThemeProvider';
import { useSound } from '../sound/SoundContext';
import { executeCommand, type TerminalLanguage } from './terminalInterpreter';

type TerminalModalProps = { onClose: () => void };

export function TerminalModal({ onClose }: TerminalModalProps) {
  const { i18n, t } = useTranslation('common');
  const { scrollTo } = useSmoothScroll();
  const { theme, toggleTheme } = useTheme();
  const { enabled, toggle: toggleSound, play } = useSound();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(document.activeElement as HTMLElement);
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [output, setOutput] = useState<string[]>([]);

  const language = (i18n.language.startsWith('en') ? 'en' : 'es') as TerminalLanguage;
  const prompt = language === 'es' ? 'invitado@portfolio:~$' : 'guest@portfolio:~$';
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
      const top = Math.max(viewport.offsetTop + 16, 16);
      const height = Math.max(viewport.height - 32, 240);
      dialog.style.top = `${top}px`;
      dialog.style.bottom = 'auto';
      dialog.style.maxHeight = `${height}px`;
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

  const close = () => {
    onClose();
    requestAnimationFrame(() => previousFocusRef.current?.focus());
  };

  const submit = () => {
    const command = value.trim();
    if (!command) return;
    play('key');
    const lines = executeCommand(command, context);
    setHistory((items) => [...items, command]);
    setHistoryIndex(-1);
    setValue('');
    if (command.toLocaleLowerCase() === 'clear') {
      setOutput([]);
      return;
    }
    setOutput((items) => [...items, `${prompt} ${command}`, ...lines]);
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
      const suggestions = ['help', 'about', 'skills', 'projects', 'experience', 'contact', 'whoami', 'ls', 'cat', 'history', 'clear', 'theme', 'lang', 'sound', 'sudo'];
      const match = suggestions.find((item) => item.startsWith(value.toLocaleLowerCase()));
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
      className="fixed inset-0 z-[110] m-auto w-[min(94vw,52rem)] rounded-[var(--radius-lg)] border border-border bg-surface p-0 text-text shadow-soft backdrop:bg-black/70"
    >
      <div className="p-4 font-mono text-sm">
        <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
          <h2 id="terminal-title">{t('terminal.title')}</h2>
          <button type="button" aria-label={t('terminal.close')} onClick={close} className="min-h-11 min-w-11 rounded border border-border-control">×</button>
        </div>
        <div role="log" aria-live="polite" className="max-h-[55vh] overflow-y-auto whitespace-pre-wrap" data-lenis-prevent="true">
          {output.map((line, index) => <div key={`${index}-${line}`}>{line}</div>)}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span aria-hidden="true">{prompt}</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            aria-label={t('terminal.input')}
            autoComplete="off"
            spellCheck={false}
            className="min-h-11 min-w-0 flex-1 bg-transparent outline-none"
          />
        </div>
      </div>
    </dialog>
  );
}
