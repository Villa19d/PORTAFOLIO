import { useTranslation } from 'react-i18next';
import { useSound } from './SoundContext';

export function SoundToggle() {
  const { t } = useTranslation('common');
  const { enabled, toggle } = useSound();

  return (
    <button
      type="button"
      aria-pressed={enabled}
      aria-label={enabled ? t('sound.disable') : t('sound.enable')}
      onClick={toggle}
      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-md)] border border-border-control text-text transition-colors hover:bg-surface-elevated"
    >
      <span aria-hidden="true">{enabled ? '🔊' : '🔇'}</span>
      <span className="sr-only">{enabled ? t('sound.enabled') : t('sound.disabled')}</span>
    </button>
  );
}
