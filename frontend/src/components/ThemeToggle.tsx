import { useTheme } from './ThemeProvider';
import { useTranslation } from 'react-i18next';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation('common');

  return (
    <button
      onClick={toggleTheme}
      aria-label={t('theme.toggle', 'Cambiar tema')}
      className="p-2 rounded-xl bg-surface border border-border-subtle hover:bg-border-subtle transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet"
    >
      {theme === 'dark' ? '🌞' : '🌙'}
    </button>
  );
}
