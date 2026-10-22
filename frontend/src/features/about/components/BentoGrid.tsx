import type { ReactNode, Ref } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface BentoGridProps {
  children: ReactNode;
  containerRef?: Ref<HTMLDivElement>;
}

export function BentoGrid({ children, containerRef }: BentoGridProps) {
  const { t } = useTranslation('common');
  const prefersReducedMotion = useReducedMotion();

  return (
    <m.div
      ref={containerRef}
      role="group"
      aria-label={t('about.sectionLabel')}
      initial={prefersReducedMotion ? false : 'hidden'}
      whileInView={prefersReducedMotion ? undefined : 'visible'}
      viewport={{ once: true, amount: 0.12 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: 0.04,
            staggerChildren: 0.075,
          },
        },
      }}
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
    </m.div>
  );
}
