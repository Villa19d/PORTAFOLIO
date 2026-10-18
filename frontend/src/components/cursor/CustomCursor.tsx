import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export function CustomCursor() {
  const pointX = useMotionValue(0);
  const pointY = useMotionValue(0);
  const ringX = useSpring(pointX, { stiffness: 500, damping: 35, mass: 0.5 });
  const ringY = useSpring(pointY, { stiffness: 500, damping: 35, mass: 0.5 });
  const ringScale = useMotionValue(1);
  const opacity = useMotionValue(0);
  const ringRef = useRef<HTMLDivElement>(null);
  const isInteractive = useRef(false);
  const isPressed = useRef(false);

  useEffect(() => {
    document.documentElement.classList.add('custom-cursor-active');

    const setInteractive = (interactive: boolean) => {
      if (isInteractive.current === interactive) {
        return;
      }

      isInteractive.current = interactive;
      ringRef.current?.classList.toggle('custom-cursor-ring--interactive', interactive);
      ringScale.set(isPressed.current ? 0.78 : interactive ? 1.5 : 1);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') {
        opacity.set(0);
        setInteractive(false);
        return;
      }

      pointX.set(event.clientX);
      pointY.set(event.clientY);

      const target = event.target;
      const element = target instanceof Element ? target : null;
      const isTextEntry = element?.closest(
        'input, textarea, [contenteditable]:not([contenteditable="false"])'
      );
      const isInteractiveTarget = element?.closest('a[href], button, [role="button"]');

      if (isTextEntry) {
        opacity.set(0);
        setInteractive(false);
        return;
      }

      opacity.set(1);
      setInteractive(Boolean(isInteractiveTarget));
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') {
        return;
      }

      isPressed.current = true;
      ringScale.set(0.78);
    };

    const handlePointerUp = () => {
      isPressed.current = false;
      ringScale.set(isInteractive.current ? 1.5 : 1);
    };

    const handlePointerLeave = () => {
      opacity.set(0);
      isPressed.current = false;
      setInteractive(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      document.documentElement.classList.remove('custom-cursor-active');
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [opacity, pointX, pointY, ringScale]);

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="custom-cursor-dot"
        style={{ x: pointX, y: pointY, opacity }}
      />
      <motion.div
        ref={ringRef}
        aria-hidden="true"
        className="custom-cursor-ring"
        style={{ x: ringX, y: ringY, scale: ringScale, opacity }}
      />
    </>
  );
}
