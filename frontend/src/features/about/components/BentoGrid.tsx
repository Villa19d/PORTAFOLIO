import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface BentoGridProps {
  children: ReactNode;
}

export function BentoGrid({ children }: BentoGridProps) {
  const { t } = useTranslation();

  return (
    <div
      role="group"
      aria-label={t('about.sectionLabel')}
      className="
        grid
        grid-cols-2
        auto-rows-[--bento-row]
        gap-4
        w-full
        mx-auto
      "
    >
      {children}
    </div>
  );
}
