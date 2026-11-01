import { type PointerEvent as ReactPointerEvent, type ReactNode, useEffect, useRef } from 'react';
import { m, useMotionValue, useSpring, useTransform } from 'motion/react';

interface TiltSurfaceProps {
  children: ReactNode;
  /**
   * When false, the same DOM tree is kept but pointer listeners are not
   * attached and motion values are settled at rest. Used to disable the
   * effect in lite tier / reduced motion without unmounting (which would
   * remount children and lose state, e.g. Swiper slide position).
   */
  enabled?: boolean;
}

const MAX_ROTATION = 8;

/**
 * Spotlight position as CSS variables written straight onto the node, so the
 * follow-the-cursor effect never goes through React's render cycle. `null` removes
 * them, which sends the highlight back to the CSS default (centred, static).
 */
function applySpotlight(surface: HTMLElement | null, x: number | null, y: number | null): void {
  if (!surface) return;
  if (x === null || y === null) {
    surface.style.removeProperty('--spot-x');
    surface.style.removeProperty('--spot-y');
    return;
  }
  surface.style.setProperty('--spot-x', `${((x + 1) / 2) * 100}%`);
  surface.style.setProperty('--spot-y', `${((y + 1) / 2) * 100}%`);
}

export function TiltSurface({ children, enabled = true }: TiltSurfaceProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const boundsRef = useRef<DOMRect | null>(null);
  const isPointerDownRef = useRef(false);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 240, damping: 26, mass: 0.4 });
  const springY = useSpring(pointerY, { stiffness: 240, damping: 26, mass: 0.4 });
  const rotateX = useTransform(springY, [-1, 1], [MAX_ROTATION, -MAX_ROTATION]);
  const rotateY = useTransform(springX, [-1, 1], [-MAX_ROTATION, MAX_ROTATION]);
  const glareX = useTransform(springX, [-1, 1], ['-20%', '20%']);
  const glareY = useTransform(springY, [-1, 1], ['-20%', '20%']);
  const glareOpacity = useTransform(springX, (x) => Math.min(0.28, Math.abs(x) * 0.2));

  // Settle motion values when disabled so the surface returns to rest
  // without needing any listener. Also clear stale pointer state.
  useEffect(() => {
    if (enabled) return;
    pointerX.set(0);
    pointerY.set(0);
    boundsRef.current = null;
    isPointerDownRef.current = false;
    applySpotlight(surfaceRef.current, null, null);
  }, [enabled, pointerX, pointerY]);

  const resetTilt = () => {
    pointerX.set(0);
    pointerY.set(0);
    applySpotlight(surfaceRef.current, null, null);
  };

  const handlePointerEnter = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.buttons !== 0) {
      boundsRef.current = null;
      return;
    }
    boundsRef.current = surfaceRef.current?.getBoundingClientRect() ?? null;
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.buttons !== 0 || isPointerDownRef.current) {
      resetTilt();
      return;
    }
    const bounds = boundsRef.current;
    if (!bounds || bounds.width === 0 || bounds.height === 0) {
      return;
    }
    const normalizedX = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    const normalizedY = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
    const clampedX = Math.max(-1, Math.min(1, normalizedX));
    const clampedY = Math.max(-1, Math.min(1, normalizedY));
    pointerX.set(clampedX);
    pointerY.set(clampedY);
    applySpotlight(surfaceRef.current, clampedX, clampedY);
  };

  const handlePointerDown = () => {
    isPointerDownRef.current = true;
    resetTilt();
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
  };

  const handlePointerLeave = () => {
    isPointerDownRef.current = false;
    boundsRef.current = null;
    resetTilt();
  };

  return (
    <div
      ref={surfaceRef}
      className="tilt-surface"
      data-tilt-enabled={enabled ? 'true' : 'false'}
      onPointerEnter={enabled ? handlePointerEnter : undefined}
      onPointerMove={enabled ? handlePointerMove : undefined}
      onPointerDown={enabled ? handlePointerDown : undefined}
      onPointerUp={enabled ? handlePointerUp : undefined}
      onPointerCancel={enabled ? handlePointerLeave : undefined}
      onPointerLeave={enabled ? handlePointerLeave : undefined}
    >
      <m.div
        className="tilt-surface__content"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      >
        {children}
        <m.div
          className="tilt-surface__glare"
          aria-hidden="true"
          style={{ x: glareX, y: glareY, opacity: glareOpacity }}
        />
      </m.div>
    </div>
  );
}