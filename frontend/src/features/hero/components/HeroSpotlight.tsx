import { useEffect } from 'react';
import { m, useMotionValue, useSpring, useMotionTemplate } from 'motion/react';

interface HeroSpotlightProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Interactive spotlight following the user's cursor.
 * Uses useMotionValue + useSpring to update the CSS gradient directly in the DOM.
 * Zero React state or re-renders during mousemove.
 */
export function HeroSpotlight({ containerRef }: HeroSpotlightProps) {
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  const springConfig = { damping: 28, stiffness: 180, mass: 0.6 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const background = useMotionTemplate`radial-gradient(600px circle at ${smoothX}px ${smoothY}px, rgba(0, 229, 255, 0.12), transparent 75%)`;

  useEffect(() => {
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
  }, [containerRef, mouseX, mouseY]);

  return (
    <m.div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{ background }}
      aria-hidden="true"
      data-testid="hero-spotlight"
    />
  );
}
