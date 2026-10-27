import type { ReactNode, Ref } from 'react';
import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useEntranceMotion } from '../../../hooks/useEntranceMotion';

interface BentoGridProps {
  children: ReactNode;
  containerRef?: Ref<HTMLDivElement>;
}

export function BentoGrid({ children, containerRef }: BentoGridProps) {
  const { t } = useTranslation('common');
  const { skipEntrance } = useEntranceMotion();

  // When entrance motion is skipped we render the grid with NO variants and
  // NO whileInView, so no descendant can inherit a `hidden` state. This keeps
  // the section content visible in lite tier / reduced motion regardless of
  // when the tier is resolved.
  return (
    <m.div
      ref={containerRef}
      role="group"
      aria-label={t('about.sectionLabel')}
      initial={skipEntrance ? false : 'hidden'}
      whileInView={skipEntrance ? undefined : 'visible'}
      viewport={skipEntrance ? undefined : { once: true, amount: 0.12 }}
      variants={
        skipEntrance
          ? undefined
          : {
              hidden: {},
              visible: {
                transition: {
                  delayChildren: 0.04,
                  staggerChildren: 0.075,
                },
              },
            }
      }
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