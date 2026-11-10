import { useEffect, useRef, type ReactNode } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { useCapabilities } from '../../hooks/useCapabilities';

interface GlassModalProps {
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
}

export function GlassModal({ labelledBy, onClose, children }: GlassModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { canUseHeavyEffects } = useCapabilities();
  const prefersReducedMotion = useReducedMotion();
  const animated = !prefersReducedMotion && canUseHeavyEffects;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) {
      dialog.showModal();
    }

    const closeOnBackdropClick = (event: MouseEvent) => {
      if (event.target === dialog) {
        dialog.close();
      }
    };

    dialog.addEventListener('click', closeOnBackdropClick);
    return () => dialog.removeEventListener('click', closeOnBackdropClick);
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="glass-modal"
      aria-labelledby={labelledBy}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        dialogRef.current?.close();
      }}
    >
      <m.div
        className="glass-modal__panel"
        data-lenis-prevent="true"
        initial={animated ? { opacity: 0, y: 16, scale: 0.98 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: animated ? 0.28 : 0, ease: [0.3, 0, 0, 1] }}
      >
        {children}
      </m.div>
    </dialog>
  );
}
