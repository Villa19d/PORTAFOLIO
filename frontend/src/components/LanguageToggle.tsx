import { useTranslation } from 'react-i18next';

export function LanguageToggle() {
  const { t, i18n } = useTranslation('common');

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('es') ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      aria-label={t('language.toggle')}
      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[var(--radius-md)] bg-surface border border-border-control hover:bg-surface-elevated transition-colors font-mono text-sm font-bold uppercase"
    >
      {i18n.language.startsWith('es') ? 'ES' : 'EN'}
    </button>
  );
}
