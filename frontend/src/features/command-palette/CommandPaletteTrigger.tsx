import { useState, lazy, Suspense, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommandPaletteShortcut } from './useCommandPaletteShortcut';

const LazyCommandPalette = lazy(() => import('./CommandPalette').then(({ CommandPalette }) => ({ default: CommandPalette })));

export function CommandPaletteTrigger() {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const openPalette = useCallback(() => setOpen(true), []);
  useCommandPaletteShortcut(openPalette);

  return (
    <>
      <button
        type="button"
        className="hidden min-h-[44px] items-center gap-2 rounded-[var(--radius-md)] border border-border-control px-3 font-mono text-xs text-text-muted lg:inline-flex"
        onClick={openPalette}
        aria-label={t('command.open')}
      >
        <span aria-hidden="true">⌘K</span>
        <span className="sr-only">{t('command.open')}</span>
      </button>
      {open && <Suspense fallback={null}><LazyCommandPalette onClose={() => setOpen(false)} /></Suspense>}
    </>
  );
}
