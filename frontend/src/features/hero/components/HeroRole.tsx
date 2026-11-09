import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCapabilities } from '../../../hooks/useCapabilities';
import { HeroSceneBoundary } from '../three/HeroSceneBoundary';

const LazyCanvasText = lazy(() => import('./CanvasText'));

const ROLE_FONT_CLASS = 'font-display text-xl font-semibold text-text sm:text-2xl';
const CANVAS_BOX_RATIO = 1.6;
const IDLE_TIMEOUT_MS = 2_000;
const IDLE_FALLBACK_MS = 200;

function useCanvasChunkReady(enabled: boolean): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled || ready) return undefined;
    let cancelled = false;
    let cancelIdle: () => void = () => undefined;

    const schedule = () => {
      const idleWindow = window as Window & {
        requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
        cancelIdleCallback?: (handle: number) => void;
      };
      if (idleWindow.requestIdleCallback) {
        const handle = idleWindow.requestIdleCallback(() => setReady(true), { timeout: IDLE_TIMEOUT_MS });
        cancelIdle = () => idleWindow.cancelIdleCallback?.(handle);
      } else {
        const handle = window.setTimeout(() => setReady(true), IDLE_FALLBACK_MS);
        cancelIdle = () => window.clearTimeout(handle);
      }
    };

    const fonts = document.fonts;
    if (fonts?.ready) {
      void fonts.ready.then(() => {
        if (!cancelled) schedule();
      });
    } else {
      schedule();
    }

    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, [enabled, ready]);

  return enabled && ready;
}

/**
 * Hero role ("Full-Stack Developer"). Same gate as the name: on capable desktops the
 * interactive canvas replaces the plain <p> from the first paint; elsewhere the HTML
 * paragraph is shown. Its canvas keeps the body text colour (white in dark theme).
 */
export function HeroRole() {
  const { t } = useTranslation('common');
  const { canUseHeavyEffects, prefersReducedMotion } = useCapabilities();
  const role = t('hero.role');
  const isCanvas = canUseHeavyEffects && !prefersReducedMotion;

  const [hasCanvasFailed, setHasCanvasFailed] = useState(false);
  const [fontSize, setFontSize] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const canvasChunkReady = useCanvasChunkReady(isCanvas && !hasCanvasFailed);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const probe = box?.querySelector<HTMLElement>('[data-hero-role-probe]');
    if (!box || !probe) return undefined;
    const measure = () => {
      const size = parseFloat(getComputedStyle(probe).fontSize) || 0;
      if (size > 0) setFontSize(size);
      const rect = probe.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) setAspectRatio(Math.round((rect.width / rect.height) * 1000) / 1000);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    if (document.fonts?.ready) void document.fonts.ready.then(measure);
    return () => observer.disconnect();
  }, [role]);

  const handleCanvasError = useCallback(() => setHasCanvasFailed(true), []);
  const canvasTop = fontSize > 0 ? `calc(50% - ${(fontSize * CANVAS_BOX_RATIO) / 2}px)` : '0';

  return (
    <div
      ref={boxRef}
      className="relative flex w-full items-center"
      data-testid="hero-role"
      data-mode={isCanvas ? 'canvas' : 'text'}
      style={aspectRatio !== null ? { aspectRatio: String(aspectRatio) } : undefined}
    >
      <span
        data-hero-role-probe=""
        aria-hidden="true"
        className={`pointer-events-none invisible absolute inset-x-0 top-0 ${ROLE_FONT_CLASS}`}
      >
        {role}
      </span>

      <p className={`w-full ${ROLE_FONT_CLASS}`} style={isCanvas ? { opacity: 0 } : undefined}>
        {role}
      </p>

      {isCanvas && (
        <div
          className="absolute"
          data-testid="hero-role-canvas"
          style={{
            top: canvasTop,
            height: fontSize > 0 ? fontSize * CANVAS_BOX_RATIO : '100%',
            left: 0,
            right: 0,
            transform: 'translateX(-5%)',
          }}
        >
          <HeroSceneBoundary onError={handleCanvasError}>
            <Suspense fallback={null}>
              {canvasChunkReady && fontSize > 0 && (
                <LazyCanvasText key={role} text={role} fontSize={fontSize} color="solid" letterSpacing={0} align="left" />
              )}
            </Suspense>
          </HeroSceneBoundary>
        </div>
      )}
    </div>
  );
}
