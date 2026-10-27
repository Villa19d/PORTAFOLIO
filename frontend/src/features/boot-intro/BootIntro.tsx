import { useEffect, useState } from 'react';

type BootIntroProps = {
  onDone: () => void;
};

const MESSAGES = [
  '> cargando rodrigo.exe...',
  '> inicializando portafolio...',
  '> sistema listo. ok',
];

export function BootIntro({ onDone }: BootIntroProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const messageTimer = window.setInterval(() => {
      setMessageIndex((index) => Math.min(index + 1, MESSAGES.length - 1));
    }, 420);
    const finishTimer = window.setTimeout(() => setExiting(true), 1_650);

    return () => {
      window.clearInterval(messageTimer);
      window.clearTimeout(finishTimer);
    };
  }, []);

  useEffect(() => {
    if (!exiting) return;
    const removeTimer = window.setTimeout(onDone, 140);
    return () => window.clearTimeout(removeTimer);
  }, [exiting, onDone]);

  useEffect(() => {
    const skipOnKey = () => setExiting(true);
    window.addEventListener('keydown', skipOnKey, { once: true });
    return () => window.removeEventListener('keydown', skipOnKey);
  }, []);

  const skip = () => setExiting(true);

  return (
    <div
      role="presentation"
      aria-hidden={exiting}
      className={[
        'fixed inset-0 z-[9999] flex items-center justify-center bg-bg px-6',
        'transition-opacity duration-150',
        exiting ? 'pointer-events-none opacity-0' : 'opacity-100',
      ].join(' ')}
      onClick={skip}
      onTouchStart={skip}
    >
      <div role="status" aria-live="polite" className="w-full max-w-xl font-mono text-sm text-accent sm:text-base">
        <p>{MESSAGES[messageIndex]}</p>
        <button
          type="button"
          onClick={skip}
          className="mt-6 min-h-11 rounded border border-border-control px-4 text-xs text-text-muted transition-colors hover:border-accent hover:text-accent"
        >
          Saltar / Skip
        </button>
      </div>
    </div>
  );
}