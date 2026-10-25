import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SITE_CONFIG } from '../../data/site';
import { useSmoothScroll } from '../../components/SmoothScrollProvider';
import { useTheme } from '../../components/ThemeProvider';
import { useSound } from '../sound/SoundContext';
import { fuzzyMatch, type CommandSearchItem } from './fuzzySearch';

type CommandPaletteProps = { onClose: () => void };

export function CommandPalette({ onClose }: CommandPaletteProps) {
  const { t, i18n } = useTranslation('common');
  const { scrollTo, pause, resume } = useSmoothScroll();
  const { toggleTheme } = useTheme();
  const { toggle: toggleSound, play: playSound } = useSound();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const previousFocusRef = useRef<HTMLElement | null>(document.activeElement as HTMLElement);

  const commands = useMemo<CommandSearchItem[]>(() => [
    { id: 'home', label: t('command.home'), keywords: ['inicio', 'home'] },
    { id: 'about', label: t('command.about'), keywords: ['sobre', 'about', 'perfil'] },
    { id: 'experience', label: t('command.experience'), keywords: ['experiencia', 'experience', 'trabajo'] },
    { id: 'projects', label: t('command.projects'), keywords: ['proyectos', 'projects', 'portfolio'] },
    { id: 'contact', label: t('command.contact'), keywords: ['contacto', 'contact', 'email'] },
    { id: 'theme', label: t('command.theme'), keywords: ['tema', 'theme', 'dark', 'light'] },
    { id: 'language', label: t('command.language'), keywords: ['idioma', 'language', 'es', 'en'] },
    { id: 'sound', label: t('command.sound'), keywords: ['sonido', 'sound', 'audio'] },
    { id: 'linkedin', label: 'LinkedIn', keywords: ['linkedin', 'social'] },
    { id: 'github', label: 'GitHub', keywords: ['github', 'code', 'codigo'] },
  ], [t]);

  const filteredCommands = commands.filter((command) => fuzzyMatch(query, command));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    inputRef.current?.focus();
    pause();
    return () => {
      resume();
      if (dialog.open && typeof dialog.close === 'function') dialog.close();
    };
  }, [pause, resume]);

  useEffect(() => {
    setActiveIndex((index) => Math.min(index, Math.max(filteredCommands.length - 1, 0)));
  }, [filteredCommands.length]);

  const close = () => {
    onClose();
    requestAnimationFrame(() => previousFocusRef.current?.focus());
  };

  const execute = (id: string) => {
    playSound('click');
    const target = id === 'home' || id === 'about' || id === 'experience' || id === 'projects' || id === 'contact';
    if (target) scrollTo(`#${id}`);
    else if (id === 'theme') toggleTheme();
    else if (id === 'language') i18n.changeLanguage(i18n.language.startsWith('es') ? 'en' : 'es');
    else if (id === 'sound') toggleSound();
    else if (id === 'linkedin') window.open(SITE_CONFIG.linkedinUrl, '_blank', 'noopener,noreferrer');
    else if (id === 'github') window.open('https://github.com/Villa19d/PORTAFOLIO', '_blank', 'noopener,noreferrer');
    close();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, filteredCommands.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && filteredCommands[activeIndex]) {
      event.preventDefault();
      execute(filteredCommands[activeIndex].id);
    } else if (event.key === 'Tab') {
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('input, button, [tabindex]:not([tabindex="-1"])'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (first && last && ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last))) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    }
  };

  return (
    <dialog ref={dialogRef} onCancel={(event) => { event.preventDefault(); close(); }} onKeyDown={handleKeyDown} className="fixed inset-0 z-[100] m-auto w-[min(92vw,40rem)] rounded-[var(--radius-lg)] border border-border bg-surface p-0 text-text shadow-soft backdrop:bg-black/60">
      <div className="p-4">
        <label className="sr-only" htmlFor="command-palette-search">{t('command.search')}</label>
        <input
          ref={inputRef}
          id="command-palette-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('command.search')}
          role="combobox"
          aria-controls="command-palette-list"
          aria-expanded="true"
          aria-activedescendant={filteredCommands[activeIndex] ? `command-${filteredCommands[activeIndex].id}` : undefined}
          className="min-h-11 w-full rounded border border-border-control bg-surface-elevated px-3 text-text"
        />
        <ul id="command-palette-list" role="listbox" aria-label={t('command.results')} className="mt-3 max-h-80 overflow-y-auto">
          {filteredCommands.map((command, index) => (
            <li
              id={`command-${command.id}`}
              key={command.id}
              role="option"
              aria-selected={index === activeIndex}
              className={index === activeIndex ? 'rounded bg-accent/15 text-accent' : 'rounded'}
            >
              <button className="min-h-11 w-full px-3 text-left" type="button" onClick={() => execute(command.id)}>
                {command.label}
              </button>
            </li>
          ))}
          {!filteredCommands.length && <li className="p-3 text-text-muted">{t('command.noResults')}</li>}
        </ul>
      </div>
    </dialog>
  );
}
