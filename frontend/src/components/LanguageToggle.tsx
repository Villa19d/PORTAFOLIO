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
      className="p-2 rounded-xl bg-surface border border-border-subtle hover:bg-border-subtle transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet font-mono text-sm font-bold uppercase"
    >
      {i18n.language.startsWith('es') ? 'ES' : 'EN'}
    </button>
  );
}
