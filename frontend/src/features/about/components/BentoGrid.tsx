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

  // When entrance motion is skipped we force the final state and drop all
  // variants. `animate` is explicit so motion overwrites any inline style
  // left by a previous entrance animation that already ran (full -> lite
  // transition in low-GPU browsers). This is the fix for the About section
  // staying at opacity: 0 in Brave / lite tier.
  return (
    <m.div
      ref={containerRef}
      role="group"
      aria-label={t('about.sectionLabel')}
      initial={skipEntrance ? false : 'hidden'}
      animate={skipEntrance ? { opacity: 1 } : undefined}
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