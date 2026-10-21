import { type ReactNode } from 'react';

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
  return (
    <div
      role={label ? 'region' : undefined}
      aria-label={label}
      className={[
        'relative overflow-hidden rounded-[--radius-lg]',
        'bg-surface border border-border',
        'p-5 flex flex-col gap-3',
        'transition-colors duration-200',
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
