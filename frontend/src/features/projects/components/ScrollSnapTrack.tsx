import type { ReactNode } from 'react';

interface ScrollSnapTrackProps {
  children: ReactNode;
  isLoading?: boolean;
  label?: string;
  lang?: string;
}

export function ScrollSnapTrack({
  children,
  isLoading = false,
  label,
  lang,
}: ScrollSnapTrackProps) {
  return (
    <div
      className="projects-track"
      lang={lang}
      aria-label={label}
      aria-busy={isLoading || undefined}
      data-testid={isLoading ? 'projects-skeleton-grid' : 'projects-scroll-snap-track'}
    >
      {children}
    </div>
  );
}
