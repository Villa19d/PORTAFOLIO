import type { ReactNode } from 'react';

interface SectionProps {
  id: string;
  titleKey: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Section({ id, title, children, className = '' }: SectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`min-h-[calc(100svh-var(--nav-h))] flex flex-col justify-center py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto scroll-mt-[var(--nav-h)] ${className}`}
    >
      <h2
        id={headingId}
        className="text-4xl md:text-5xl font-display font-bold text-text mb-8"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
