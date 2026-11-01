import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BentoWorldBoundary } from './BentoWorldBoundary';
import { useBentoWorldGate } from './useBentoWorldGate';
import type { BentoWorldMode } from './bentoWorldScene';

const LazyBentoWorldCanvas = lazy(() => import('./BentoWorldCanvas'));

/** The scene is requested this far before the tile becomes visible. */
const VIEWPORT_MARGIN = '300px';

const buttonClasses =
  'inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-border-control px-4 text-sm font-medium transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/**
 * Mini world tile. When the gate is open the scene loads by itself as soon as the tile
 * approaches the viewport, in showcase mode (drifting camera, no interaction). "Play"
 * only switches to the first-person mode and "Exit" returns to the showcase: the scene
 * is never unmounted or requested again. Any failure falls back to the static card.
 */
export function BentoWorldTile() {
  const { t } = useTranslation('common');
  const canUseWorld = useBentoWorldGate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldMount, setShouldMount] = useState(false);
  const [mode, setMode] = useState<BentoWorldMode>('showcase');
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    if (!canUseWorld || shouldMount) return;
    const container = containerRef.current;
    if (!container) return;

    if (typeof IntersectionObserver === 'undefined') {
      setShouldMount(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry?.isIntersecting) return;
        setShouldMount(true);
        observer.disconnect();
      },
      { rootMargin: VIEWPORT_MARGIN },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [canUseWorld, shouldMount]);

  const fail = useCallback(() => {
    setHasFailed(true);
    setMode('showcase');
  }, []);

  const isLive = canUseWorld && shouldMount && !hasFailed;
  const isInteractive = isLive && mode === 'interactive';

  return (
    <div ref={containerRef} className="bento-world relative h-full w-full" data-testid="bento-world">
      {isLive ? (
        <BentoWorldBoundary onError={fail}>
          <Suspense
            fallback={
              <div role="status" className="bento-world-loading">
                <span className="bento-world-loading__dot" aria-hidden="true" />
                <span className="sr-only">{t('about.worldLoading')}</span>
              </div>
            }
          >
            <LazyBentoWorldCanvas mode={mode} onFailure={fail} />
          </Suspense>
        </BentoWorldBoundary>
      ) : (
        <div
          data-testid="bento-world-card"
          className="bento-world-card flex h-full w-full flex-col items-start justify-between gap-3 p-5"
        >
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              {t('about.worldLabel')}
            </p>
            <h3 className="mt-1 font-display text-2xl font-bold text-text">{t('hero.name')}</h3>
            <p className="mt-1 text-sm text-text-muted">{t('about.worldHint')}</p>
          </div>
          {!(canUseWorld && !hasFailed) && (
            <p className="text-xs text-text-muted">{t('about.worldUnavailable')}</p>
          )}
        </div>
      )}

      {isLive && (
        <button
          type="button"
          onClick={() => setMode(isInteractive ? 'showcase' : 'interactive')}
          aria-label={isInteractive ? t('about.worldExit') : t('about.worldPlay')}
          className={`absolute bottom-3 left-3 z-10 bg-surface ${buttonClasses}`}
        >
          {isInteractive ? (
            <>
              <span aria-hidden="true">{'×'}</span>
              <span className="ml-1">{t('about.worldExit')}</span>
            </>
          ) : (
            t('about.worldPlay')
          )}
        </button>
      )}

      {isInteractive && (
        <p className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-[var(--radius-md)] bg-surface px-3 py-1 text-xs text-text">
          {t('about.worldLookHint')}
        </p>
      )}
    </div>
  );
}
