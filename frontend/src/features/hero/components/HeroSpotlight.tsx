import { useEffect } from 'react';
import { m, useMotionValue, useSpring, useMotionTemplate } from 'motion/react';

interface HeroSpotlightProps {
  containerRef: React.RefObject<HTMLElement | null>;
  enabled?: boolean;
}

/**
 * Interactive spotlight following the user's cursor.
 * Always mounted to keep the DOM tree stable; the `enabled` prop turns the
 * pointer listeners on or off (lite tier / reduced motion).
 */
export function HeroSpotlight({ containerRef, enabled = true }: HeroSpotlightProps) {
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  const springConfig = { damping: 28, stiffness: 180, mass: 0.6 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const background = useMotionTemplate`radial-gradient(600px circle at ${smoothX}px ${smoothY}px, rgba(0, 229, 255, 0.12), transparent 75%)`;

  useEffect(() => {
    if (!enabled) {
      mouseX.set(-1000);
      mouseY.set(-1000);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    };

    const handlePointerLeave = () => {
      mouseX.set(-1000);
      mouseY.set(-1000);
    };

    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [containerRef, enabled, mouseX, mouseY]);

  return (
    <m.div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{ background }}
      aria-hidden="true"
      data-testid="hero-spotlight"
      data-spotlight-enabled={enabled ? 'true' : 'false'}
    />
  );
}