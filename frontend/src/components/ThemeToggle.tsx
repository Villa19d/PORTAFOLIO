import { useTheme } from './ThemeProvider';
import { useTranslation } from 'react-i18next';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation('common');

  return (
    <button
      onClick={toggleTheme}
      aria-label={t('theme.toggle')}
      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[var(--radius-md)] bg-surface border border-border-control hover:bg-surface-elevated transition-colors"
    >
      {theme === 'dark' ? '🌞' : '🌙'}
    </button>
  );
}
