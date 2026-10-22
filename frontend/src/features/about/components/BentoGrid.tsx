import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface BentoGridProps {
  children: ReactNode;
}

export function BentoGrid({ children }: BentoGridProps) {
  const { t } = useTranslation('common');

  return (
    <div
      role="group"
      aria-label={t('about.sectionLabel')}
      className="
        grid
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-4
        auto-rows-[minmax(var(--bento-row),auto)]
        gap-4
        w-full
        mx-auto
      "
    >
      {children}
    </div>
  );
}
