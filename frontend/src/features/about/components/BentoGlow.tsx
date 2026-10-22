import { useEffect, useRef, type RefObject } from 'react';

interface BentoGlowProps {
  containerRef: RefObject<HTMLDivElement | null>;
}

export default function BentoGlow({ containerRef }: BentoGlowProps) {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const glow = glowRef.current;

    if (!container || !glow) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') {
        return;
      }

      const bounds = container.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;

      glow.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      glow.style.opacity = '1';
    };

    const hideGlow = () => {
      glow.style.opacity = '0';
    };

    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerleave', hideGlow, { passive: true });

    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', hideGlow);
    };
  }, [containerRef]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[--radius-lg]"
    >
      <div
        ref={glowRef}
        className="absolute left-0 top-0 h-72 w-72 rounded-full opacity-0 blur-3xl transition-opacity duration-300 will-change-transform"
        style={{
          background:
            'radial-gradient(circle, rgb(125 211 252 / 0.12) 0%, rgb(139 92 246 / 0.08) 38%, transparent 72%)',
          transform: 'translate3d(-1000px, -1000px, 0)',
        }}
      />
    </div>
  );
}
