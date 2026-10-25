import { lazy, Suspense, useCallback, useEffect, useState } from 'react';

const LazyTerminalModal = lazy(() => import('./TerminalModal').then(({ TerminalModal }) => ({ default: TerminalModal })));

export function openTerminal() {
  window.dispatchEvent(new Event('portfolio:open-terminal'));
}

export function TerminalLauncher() {
  const [open, setOpen] = useState(false);
  const openTerminalModal = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const onOpen = () => openTerminalModal();
    const onShortcut = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === '`' && !window.matchMedia('(pointer: coarse)').matches) {
        event.preventDefault();
        openTerminalModal();
      }
    };
    window.addEventListener('portfolio:open-terminal', onOpen);
    document.addEventListener('keydown', onShortcut);
    return () => {
      window.removeEventListener('portfolio:open-terminal', onOpen);
      document.removeEventListener('keydown', onShortcut);
    };
  }, [openTerminalModal]);

  return open ? <Suspense fallback={null}><LazyTerminalModal onClose={() => setOpen(false)} /></Suspense> : null;
}
