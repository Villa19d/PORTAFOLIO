import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCapabilities } from '../../../hooks/useCapabilities';
import { HeroSceneBoundary } from '../three/HeroSceneBoundary';

const LazyCanvasText = lazy(() => import('./CanvasText'));

const NAME_FONT_CLASS =
  'font-display text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl';
const CANVAS_INTRO_KEY = 'hero-canvas-intro-seen';
const TYPEWRITER_KEY = 'hero-typewriter-seen';
const BOOT_INTRO_KEY = 'boot_intro_seen';
const CADENCE_MS = 70;
const START_DELAY_MS = 300;
const IDLE_TIMEOUT_MS = 2_000;
const IDLE_FALLBACK_MS = 200;
const BOOT_POLL_MS = 150;
const BOOT_WAIT_MAX_MS = 4_000;
/** How much taller than the glyphs the canvas box must be so TechText never shrinks them. */
const CANVAS_BOX_RATIO = 1.6;
/** TechText fills 90% of its box width; we mirror that so the HTML and the canvas share a size. */
const CANVAS_FILL_RATIO = 0.9;
/** TechText indents 5% when align="left"; the wrapper shifts left by the same amount to align. */
const CANVAS_SHIFT = '5%';
/** Smallest font-size change worth re-rendering the HTML with an inline size. */
const SIZE_EPSILON = 0.5;

interface TitleMetrics {
  /** Font size the responsive classes ask for. */
  cssSize: number;
  /** CSS line-height as a multiple of the font size. */
  lineRatio: number;
  /** Size both the HTML and the canvas render at: the CSS size capped to one line. */
  fitSize: number;
}

function readFlag(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeFlag(key: string): void {
  try {
    window.sessionStorage.setItem(key, '1');
  } catch {
    // A storage failure must never block the title from painting.
  }
}

/** Mirrors BootIntroLauncher.shouldBypass(): when the intro will not run there is nothing to wait for. */
function bootIntroWillNotRun(): boolean {
  if (readFlag(BOOT_INTRO_KEY)) return true;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return true;
  if (document.documentElement.dataset.perf === 'lite' || document.body.dataset.perf === 'lite') return true;
  const params = new URLSearchParams(window.location.search);
  if (params.get('intro') === '0' || params.get('perf') === 'lite') return true;
  try {
    if (window.sessionStorage.getItem('portfolio-perf-tier') === 'lite') return true;
  } catch {
    // Ignore storage failures.
  }
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  return (
    connection?.saveData === true || connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g'
  );
}

/** Resolves once the BootIntro overlay is gone, so the name never animates behind it. */
function useBootIntroSettled(): boolean {
  const [settled, setSettled] = useState(() => bootIntroWillNotRun());

  useEffect(() => {
    if (settled) return undefined;
    let timer = 0;
    const startedAt = Date.now();
    const poll = () => {
      if (readFlag(BOOT_INTRO_KEY) || Date.now() - startedAt > BOOT_WAIT_MAX_MS) {
        setSettled(true);
        return;
      }
      timer = window.setTimeout(poll, BOOT_POLL_MS);
    };
    timer = window.setTimeout(poll, BOOT_POLL_MS);
    return () => window.clearTimeout(timer);
  }, [settled]);

  return settled;
}

/** Requests the lazy canvas chunk only when the browser is idle and the display font is ready. */
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

interface TypewriterTitleProps {
  text: string;
  active: boolean;
}

/** Reveals the name one character at a time. Reduced motion and lite never reach here. */
function TypewriterTitle({ text, active }: TypewriterTitleProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    let index = 0;
    let interval = 0;
    const begin = () => {
      interval = window.setInterval(() => {
        index += 1;
        setCount(Math.min(index, text.length));
        if (index >= text.length) window.clearInterval(interval);
      }, CADENCE_MS);
    };
    const delay = window.setTimeout(begin, START_DELAY_MS);
    return () => {
      window.clearTimeout(delay);
      window.clearInterval(interval);
    };
  }, [active, text]);

  return (
    <>
      {text.slice(0, count)}
      {count < text.length && <span className="hero-title__caret" aria-hidden="true" />}
    </>
  );
}

/**
 * Hero name.
 * - Capable desktops: the interactive canvas IS the title from the very first paint.
 *   The real <h1> stays in the DOM for assistive tech but is visually transparent, so
 *   the HTML never flashes before the canvas.
 * - Mobile / ?perf=lite / reduced motion: no canvas is downloaded; an HTML typewriter
 *   plays once per session (static under reduced motion).
 * The gate reacts live: shrinking the viewport swaps the canvas back to the HTML.
 */
export function HeroTitle() {
  const { t } = useTranslation('common');
  const { canUseHeavyEffects, prefersReducedMotion } = useCapabilities();
  const name = t('hero.name');
  const bootSettled = useBootIntroSettled();

  const [hasCanvasFailed, setHasCanvasFailed] = useState(false);
  const [metrics, setMetrics] = useState<TitleMetrics | null>(null);
  const [canvasIntroEligible] = useState(() => !readFlag(CANVAS_INTRO_KEY));
  const [typewriterEligible] = useState(() => !readFlag(TYPEWRITER_KEY));
  const [canvasIntro, setCanvasIntro] = useState(false);
  const [typewriter, setTypewriter] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  /** The canvas owns the title from the first paint; a chunk failure hands it back to the HTML. */
  const isCanvas = canUseHeavyEffects && !prefersReducedMotion && !hasCanvasFailed;
  const canvasChunkReady = useCanvasChunkReady(isCanvas);

  useEffect(() => {
    if (!isCanvas || !canvasIntroEligible || !bootSettled || canvasIntro) return;
    setCanvasIntro(true);
    writeFlag(CANVAS_INTRO_KEY);
  }, [isCanvas, canvasIntroEligible, bootSettled, canvasIntro]);

  useEffect(() => {
    if (isCanvas || prefersReducedMotion || !typewriterEligible || !bootSettled || typewriter) return;
    setTypewriter(true);
    writeFlag(TYPEWRITER_KEY);
  }, [isCanvas, prefersReducedMotion, typewriterEligible, bootSettled, typewriter]);

  /**
   * Measures the invisible probe (which keeps the responsive CSS size) to learn the font
   * size, the line-height ratio and the natural one-line width. TechText always fills 90%
   * of its box, so the HTML is capped to that same size and both stay identical on screen.
   */
  useLayoutEffect(() => {
    const box = boxRef.current;
    const probe = box?.querySelector<HTMLElement>('[data-hero-title-probe]');
    if (!box || !probe) return undefined;
    const measure = () => {
      const styles = getComputedStyle(probe);
      const cssSize = parseFloat(styles.fontSize) || 0;
      const cssLine = parseFloat(styles.lineHeight) || cssSize;
      const natural = probe.getBoundingClientRect().width;
      const boxWidth = box.clientWidth;
      if (cssSize <= 0 || cssLine <= 0 || natural <= 0 || boxWidth <= 0) return;
      const fitScale = Math.min(1, (boxWidth * CANVAS_FILL_RATIO) / natural);
      setMetrics({
        cssSize,
        lineRatio: cssLine / cssSize,
        fitSize: Math.round(cssSize * fitScale * 100) / 100,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    if (document.fonts?.ready) void document.fonts.ready.then(measure);
    return () => observer.disconnect();
  }, [name]);

  const handleCanvasError = useCallback(() => setHasCanvasFailed(true), []);

  const showTypewriter = !isCanvas && !prefersReducedMotion && typewriterEligible;
  const mode = isCanvas ? 'canvas' : showTypewriter ? 'typewriter' : 'static';
  const canvasSize = metrics?.fitSize ?? 0;
  const canvasTop = canvasSize > 0 ? `calc(50% - ${(canvasSize * CANVAS_BOX_RATIO) / 2}px)` : '0';
  const headingStyle =
    metrics && metrics.fitSize < metrics.cssSize - SIZE_EPSILON
       ? { fontSize: `${metrics.fitSize}px`, lineHeight: metrics.lineRatio }
      : undefined;

  return (
    <div ref={boxRef} className="relative w-full" data-testid="hero-title" data-mode={mode}>
      <span
        data-hero-title-probe=""
        aria-hidden="true"
        className={`pointer-events-none invisible absolute top-0 left-0 whitespace-nowrap ${NAME_FONT_CLASS}`}
      >
        {name}
      </span>

      <h1
        id="hero-title"
        className={`w-full ${NAME_FONT_CLASS}`}
        style={isCanvas ? { ...headingStyle, opacity: 0 } : headingStyle}
      >
        <span className="sr-only">{name}</span>
        <span aria-hidden="true" className="relative block">
          {showTypewriter && <span className="invisible block">{name}</span>}
          <span
            className={
              showTypewriter
                ? 'absolute inset-0 block bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent'
                : 'block bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent'
            }
          >
            {showTypewriter ? <TypewriterTitle text={name} active={typewriter} /> : name}
          </span>
        </span>
      </h1>

      {isCanvas && (
        <div
          className="absolute"
          aria-hidden="true"
          data-testid="hero-title-canvas"
          style={{
            top: canvasTop,
            left: 0,
            right: 0,
            height: canvasSize > 0 ? canvasSize * CANVAS_BOX_RATIO : '100%',
            transform: `translateX(-${CANVAS_SHIFT})`,
          }}
        >
          <HeroSceneBoundary onError={handleCanvasError}>
            <Suspense fallback={null}>
              {canvasChunkReady && canvasSize > 0 && (
                <LazyCanvasText
                  key={name}
                  text={name}
                  fontSize={canvasSize}
                  fontWeight={800}
                  color="gradient"
                  // color="solid"
                  align="left"
                  letterSpacing={-0.025}
                  // intro={canvasIntro ? 'type' : 'none'}
                  intro="none"
                />
              )}
            </Suspense>
          </HeroSceneBoundary>
        </div>
      )}
    </div>
  );
}

