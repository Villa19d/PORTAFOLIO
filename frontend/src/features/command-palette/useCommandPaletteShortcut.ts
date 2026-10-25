import { useEffect } from 'react';

function isTextField(target: EventTarget | null) {
  return target instanceof HTMLElement &&
    (target.matches('input, textarea, select, [contenteditable="true"]') ||
      target.isContentEditable);
}

export function useCommandPaletteShortcut(onOpen: () => void) {
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const commandKey = event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey);
      const slashKey = event.key === '/' && !isTextField(event.target);
      if (!commandKey && !slashKey) return;

      event.preventDefault();
      onOpen();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpen]);
}
