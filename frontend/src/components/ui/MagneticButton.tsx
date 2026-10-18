import { type PointerEvent as ReactPointerEvent, type ReactNode, useEffect, useRef } from 'react';
import { motion, useSpring } from 'motion/react';
import { useCapabilities } from '../../hooks/useCapabilities';

const INFLUENCE_RADIUS = 80;
const MAX_OFFSET = 10;

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
}

export function MagneticButton({ children, className = '' }: MagneticButtonProps) {
  const { canUseHeavyEffects } = useCapabilities();
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const x = useSpring(0, { stiffness: 260, damping: 20, mass: 0.5 });
  const y = useSpring(0, { stiffness: 260, damping: 20, mass: 0.5 });

  useEffect(() => {
    if (!canUseHeavyEffects) {
      x.set(0);
      y.set(0);
    }
  }, [canUseHeavyEffects, x, y]);

  const handlePointerMove = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (!canUseHeavyEffects || event.pointerType !== 'mouse') {
      return;
    }

    const wrapper = wrapperRef.current;
    if (!wrapper || wrapper.querySelector(':focus-visible')) {
      x.set(0);
      y.set(0);
      return;
    }

    const bounds = wrapper.getBoundingClientRect();
    const offsetX = event.clientX - (bounds.left + bounds.width / 2);
    const offsetY = event.clientY - (bounds.top + bounds.height / 2);
    const distance = Math.hypot(offsetX, offsetY);

    if (distance === 0 || distance >= INFLUENCE_RADIUS) {
      x.set(0);
      y.set(0);
      return;
    }

    const influence = 1 - distance / INFLUENCE_RADIUS;
    x.set((offsetX / distance) * MAX_OFFSET * influence);
    y.set((offsetY / distance) * MAX_OFFSET * influence);
  };

  const handlePointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.span
      ref={wrapperRef}
      className={`inline-flex ${className}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ x, y }}
    >
      {children}
    </motion.span>
  );
}
