import { useEffect } from 'react';

function isTextField(target: EventTarget | null) {
  return target instanceof HTMLElement &&
    (target.matches('input, textarea, select, [contenteditable="true"]') ||
      target.isContentEditable);
}

/** `null` disables the shortcut (the mobile trigger registers nothing on touch). */
export function useCommandPaletteShortcut(onOpen: (() => void) | null) {
  useEffect(() => {
    if (!onOpen) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const open = onOpen;
    const handleKeyDown = (event: KeyboardEvent) => {
      const commandKey = event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey);
      const slashKey = event.key === '/' && !isTextField(event.target);
      if (!commandKey && !slashKey) return;

      event.preventDefault();
      open();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpen]);
}
