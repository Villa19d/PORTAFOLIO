import { lazy, Suspense, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { pickDefaultLang } from '../../cv/cvHelpers';
import { useCv } from '../../cv/useCv';

const LazyCvModal = lazy(() => import('../../cv/CvModal'));

const LANGS = ['es', 'en'] as const;

export function CvTile() {
  const { t, i18n } = useTranslation('common');
  const { cv, status } = useCv();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const availableLangs = LANGS.filter((code) => cv[code] !== null);

  if (availableLangs.length === 0) {
    return (
      <p className="px-4 text-center text-xs text-text-muted">
        {status === 'loading' ? t('cv.loading') : t('about.cvUnavailable')}
      </p>
    );
  }

  const closeModal = () => {
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(true)}
        className="
          inline-flex w-full items-center justify-center
          rounded-[--radius-sm] border border-border
          px-4 py-3 text-center text-sm font-mono font-semibold text-text
          transition-colors
          hover:bg-surface-elevated
          focus-visible:outline-2 focus-visible:outline-offset-2
          focus-visible:outline-accent
        "
      >
        {t('cv.open')}
      </button>
      <p className="text-xs text-text-muted">
        {availableLangs.map((code) => (code === 'es' ? t('cv.langEs') : t('cv.langEn'))).join(' · ')}
      </p>
      {isOpen && (
        <Suspense fallback={null}>
          <LazyCvModal
            cv={cv}
            initialLang={pickDefaultLang(cv, i18n.language ?? 'es')}
            onClose={closeModal}
          />
        </Suspense>
      )}
    </div>
  );
}

