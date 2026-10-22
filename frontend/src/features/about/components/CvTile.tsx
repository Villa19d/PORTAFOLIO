import { useTranslation } from 'react-i18next';
import { PROFILE_DATA } from '../../../data/profile';

export function CvTile() {
  const { t, i18n } = useTranslation('common');
  const lang = i18n.language?.startsWith('en') ? 'en' : 'es';
  const link = PROFILE_DATA.cv[lang];

  if (!link) {
    return null;
  }

  return (
    <a
      href={link}
      download
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
      {t(lang === 'en' ? 'about.cvDownloadEn' : 'about.cvDownloadEs')}
    </a>
  );
}
