import { useState, lazy, Suspense, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommandPaletteShortcut } from './useCommandPaletteShortcut';

const LazyCommandPalette = lazy(() => import('./CommandPalette').then(({ CommandPalette }) => ({ default: CommandPalette })));

type CommandPaletteTriggerProps = {
  /** `desktop` shows the keyboard hint; `mobile` only shows the icon (touch has no shortcut). */
  variant?: 'desktop' | 'mobile';
  /** Called right after the palette opens (the mobile menu uses it to close itself). */
  onOpen?: () => void;
};

function isApplePlatform() {
  const userAgentData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  const platform = userAgentData?.platform ?? navigator.platform ?? '';
  return /mac|iphone|ipad|ipod/i.test(platform);
}

export function CommandPaletteTrigger({ variant = 'desktop', onOpen }: CommandPaletteTriggerProps) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const isDesktop = variant === 'desktop';
  const isApple = isApplePlatform();

  const openPalette = useCallback(() => {
    setOpen(true);
    onOpen?.();
  }, [onOpen]);

  // Registered once, by the desktop trigger; the shortcut stays off on touch pointers.
  useCommandPaletteShortcut(isDesktop ? openPalette : null);

  return (
    <>
      <button
        type="button"
        className={[
          'min-h-[44px] items-center gap-2 rounded-[var(--radius-md)] border border-border-control px-3 font-mono text-xs text-text-muted',
          isDesktop ? 'hidden lg:inline-flex' : 'inline-flex lg:hidden',
        ].join(' ')}
        onClick={openPalette}
        aria-label={t('command.open')}
        aria-keyshortcuts={isDesktop ? (isApple ? 'Meta+K' : 'Control+K') : undefined}
      >
        {isDesktop ? (
          <span aria-hidden="true">{isApple ? '⌘K' : 'Ctrl K'}</span>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
        )}
        <span className="sr-only">{t('command.open')}</span>
      </button>
      {open && <Suspense fallback={null}><LazyCommandPalette onClose={() => setOpen(false)} /></Suspense>}
    </>
  );
}
