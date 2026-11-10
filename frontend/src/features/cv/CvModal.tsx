import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GlassModal } from '../../components/ui/GlassModal';
import {
  ArrowUpRightIcon,
  CloseIcon,
  DownloadIcon,
  FileTextIcon,
} from '../../components/icons/UiIcons';
import { useCapabilities } from '../../hooks/useCapabilities';
import { getCvDownloadUrl, pickDefaultLang } from './cvHelpers';
import type { CvState } from './useCv';

interface CvModalProps {
  cv: CvState;
  initialLang?: 'es' | 'en';
  onClose: () => void;
}

const LANGS = ['es', 'en'] as const;

export default function CvModal({ cv, initialLang, onClose }: CvModalProps) {
  const { t, i18n } = useTranslation('common');
  const { isDesktopLayout } = useCapabilities();
  const [lang, setLang] = useState<'es' | 'en'>(
    () => initialLang ?? pickDefaultLang(cv, i18n.language ?? 'es'),
  );
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const availableLangs = useMemo(() => LANGS.filter((code) => cv[code] !== null), [cv]);
  const cvDocument = cv[lang] ?? cv[availableLangs[0] ?? 'es'];

  useEffect(() => {
    setIframeLoaded(false);
  }, [lang]);

  if (!cvDocument) {
    return null;
  }

  return (
    <GlassModal labelledBy="cv-modal-title" onClose={onClose}>
      <header className="cv-modal__header">
        <div>
          <p className="cv-modal__eyebrow">{t('cv.title')}</p>
          <h2 className="cv-modal__title" id="cv-modal-title">{cvDocument.fileName}</h2>
        </div>
        <button
          className="cv-modal__close"
          onClick={onClose}
          type="button"
          aria-label={t('cv.close')}
        >
          <CloseIcon />
        </button>
      </header>

      {availableLangs.length > 1 && (
        <div className="cv-modal__lang" role="group" aria-label={t('cv.languageSwitch')}>
          {availableLangs.map((code) => (
            <button
              key={code}
              type="button"
              aria-pressed={lang === code}
              onClick={() => setLang(code)}
              className="cv-modal__lang-button"
            >
              {code === 'es' ? t('cv.langEs') : t('cv.langEn')}
            </button>
          ))}
        </div>
      )}

      <div className="cv-modal__body">
        {isDesktopLayout ? (
          <div className="cv-modal__viewer">
            {!iframeLoaded && (
              <div className="cv-modal__viewer-loading" role="status" aria-live="polite">
                {t('cv.loading')}
              </div>
            )}
            <iframe
              className="cv-modal__iframe"
              src={`${cvDocument.url}#view=FitH`}
              title={cvDocument.fileName}
              loading="lazy"
              onLoad={() => setIframeLoaded(true)}
            />
          </div>
        ) : (
          <div className="cv-modal__mobile">
            <FileTextIcon className="cv-modal__mobile-icon" />
            <p className="cv-modal__mobile-name">{cvDocument.fileName}</p>
            <p className="cv-modal__mobile-note">{t('cv.mobileNote')}</p>
          </div>
        )}

        <a
          className="cv-modal__new-tab"
          href={cvDocument.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('cv.openNewTab')}
          <ArrowUpRightIcon />
        </a>
      </div>

      <footer className="cv-modal__footer">
        <a
          className="cv-modal__download"
          href={getCvDownloadUrl(cvDocument.url)}
          download
          rel="noopener noreferrer"
        >
          <DownloadIcon />
          {t('cv.download')}
        </a>
        <button className="cv-modal__dismiss" onClick={onClose} type="button">
          {t('cv.close')}
        </button>
      </footer>
    </GlassModal>
  );
}
