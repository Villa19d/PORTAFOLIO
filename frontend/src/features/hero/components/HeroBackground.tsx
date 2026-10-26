import { useEffect, useState } from 'react';
import { useCapabilities } from '../../../hooks/useCapabilities';
import { HeroSpotlight } from './HeroSpotlight';

interface HeroBackgroundProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Layered Hero background.
 * - Base Layer: Pure CSS animated mesh gradients & subtle radial masked tech grid (zero JS).
 * - Interactive Layer: Spotlight tracking cursor only when canUseHeavyEffects is true.
 * - Automatically pauses CSS animations when Hero is outside the viewport.
 * - In lite tier the blobs are hidden and replaced by a static gradient (see index.css).
 */
export function HeroBackground({ containerRef }: HeroBackgroundProps) {
  const { canUseHeavyEffects, prefersReducedMotion } = useCapabilities();
  const [isInViewport, setIsInViewport] = useState(true);

  // Pause CSS animations when Hero is scrolled out of view to save GPU/CPU cycles
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsInViewport(entry.isIntersecting);
        }
      },
      { threshold: 0 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);

  return (
    <div
      className={`hero-background pointer-events-none absolute inset-0 z-0 overflow-hidden ${
        !isInViewport ? 'hero-paused' : ''
      }`}
      aria-hidden="true"
      data-testid="hero-background"
    >
      {/* Base CSS Mesh: 3 drifting radial gradient blobs */}
      <div className="hero-blobs absolute inset-0">
        {/* Blob 1: Cyan accent (top-left) */}
        <div
          className={`absolute -top-[15%] -left-[10%] h-[400px] w-[400px] rounded-full bg-accent/20 blur-[100px] sm:h-[500px] sm:w-[500px] lg:h-[650px] lg:w-[650px] ${
            prefersReducedMotion ? '' : 'hero-blob-1'
          }`}
        />

        {/* Blob 2: Secondary green accent (middle-right) */}
        <div
          className={`absolute top-[25%] -right-[15%] h-[350px] w-[350px] rounded-full bg-accent-2/15 blur-[110px] sm:h-[450px] sm:w-[450px] lg:h-[600px] lg:w-[600px] ${
            prefersReducedMotion ? '' : 'hero-blob-2'
          }`}
        />

        {/* Blob 3: Soft cyan ambiance (bottom-center) */}
        <div
          className={`absolute -bottom-[10%] left-[25%] h-[300px] w-[300px] rounded-full bg-accent/10 blur-[90px] sm:h-[400px] sm:w-[400px] lg:h-[500px] lg:w-[500px] ${
            prefersReducedMotion ? '' : 'hero-blob-3'
          }`}
        />
      </div>

      {/* Subtle tech grid with radial falloff mask */}
      <div
        className="absolute inset-0 opacity-[0.22] dark:opacity-[0.16]"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 60% at 50% 50%, #000 35%, transparent 85%)',
          maskImage:
            'radial-gradient(ellipse 70% 60% at 50% 50%, #000 35%, transparent 85%)',
        }}
      />

      {/* Interactive spotlight: only mounted if hardware capabilities allow */}
      {canUseHeavyEffects && <HeroSpotlight containerRef={containerRef} />}
    </div>
  );
}