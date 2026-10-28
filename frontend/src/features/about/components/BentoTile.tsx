import { type ReactNode } from 'react';
import { m } from 'motion/react';
import { useCapabilities } from '../../../hooks/useCapabilities';
import { useEntranceMotion } from '../../../hooks/useEntranceMotion';

export type BentoSize =
  | 'wide'      // col-span-2, row-span-1
  | 'tall'      // col-span-1, row-span-2
  | 'square'    // col-span-1, row-span-1
  | 'feature';  // col-span-2, row-span-2

interface BentoTileProps {
  size?: BentoSize;
  className?: string;
  children: ReactNode;
  /** Optional aria-label for the tile when it acts as a landmark */
  label?: string;
}

const sizeClasses: Record<BentoSize, string> = {
  wide: 'col-span-2 row-span-1',
  tall: 'col-span-1 row-span-2',
  square: 'col-span-1 row-span-1',
  feature: 'col-span-2 row-span-2',
};

export function BentoTile({
  size = 'square',
  className = '',
  children,
  label,
}: BentoTileProps) {
  const { hasFinePointer, prefersReducedMotion } = useCapabilities();
  const { skipEntrance } = useEntranceMotion();

  // See BentoGrid: when entrance motion is skipped we must force the final
  // state (opacity 1, y 0) to overwrite any inline style left by a previous
  // entrance animation. Without this, a full -> lite transition leaves the
  // tile stuck at opacity: 0.
  const hoverProps =
    !skipEntrance && hasFinePointer && !prefersReducedMotion
      ? { y: -3, transition: { duration: 0.18 } }
      : undefined;

  return (
    <m.div
      role={label ? 'region' : undefined}
      aria-label={label}
      initial={skipEntrance ? false : undefined}
      animate={skipEntrance ? { opacity: 1, y: 0 } : undefined}
      variants={
        skipEntrance
          ? undefined
          : {
              hidden: { opacity: 0, y: 12 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
              },
            }
      }
      whileHover={hoverProps}
      className={[
        'relative overflow-hidden rounded-[--radius-lg]',
        'border border-border bg-surface',
        'p-5 flex flex-col gap-3',
        'transition-transform duration-200',
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </m.div>
  );
}