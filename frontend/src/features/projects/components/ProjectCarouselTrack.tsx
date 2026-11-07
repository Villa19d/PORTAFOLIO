import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import type { Swiper as SwiperInstance } from 'swiper';
import { A11y, Keyboard } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useCapabilities } from '../../../hooks/useCapabilities';
import type { Project } from '../types';
import { getLocalized } from '../utils/projectHelpers';
import { ProjectCard } from './ProjectCard';
import 'swiper/css';

/** Scale of the centred card. */
export const ACTIVE_SCALE = 1;
/** Scale of a card one slot away from the centre. */
export const IDLE_SCALE = 0.66;
/** Opacity of a card one slot away from the centre. */
export const IDLE_OPACITY = 0.55;
/** Gap between slides, in pixels. Matches the `spaceBetween` option below. */
export const SLIDE_GAP_PX = 24;
/** Default navigation speed, in milliseconds. */
export const DEFAULT_SPEED = 620;
export const AUTOPLAY_INTERVAL_MS = 5_000;
export const SWEEP_DURATION_MS = 600;
export const MAX_DISPERSION_PX = 4;
export const INTRO_DURATION_MS = 560;
/** 16:10 card media, configurable through the `cardAspect` prop. */
export const DEFAULT_CARD_ASPECT = 1.6;

interface FrameState {
  scale: number;
  opacity: number;
  veil: number;
}

/** Interpolates scale/opacity/veil from a slide progress (-1 … 0 … 1). Pure, unit tested. */
export function frameStateFor(progress: number): FrameState {
  const distance = Math.min(1, Math.abs(Number.isFinite(progress) ? progress : 0));
  return {
    scale: ACTIVE_SCALE - distance * (ACTIVE_SCALE - IDLE_SCALE),
    opacity: ACTIVE_SCALE - distance * (ACTIVE_SCALE - IDLE_OPACITY),
    veil: distance * 0.45,
  };
}

type SlideElement = HTMLElement & { progress?: number };

interface SlideFrame {
  frame: HTMLElement;
  progress: number;
}

/** Reads the current slide progress together with its frame element. */
function readFrames(swiper: SwiperInstance): SlideFrame[] {
  const frames: SlideFrame[] = [];
  (swiper.slides as SlideElement[]).forEach((slide, index) => {
    const frame = slide.querySelector<HTMLElement>('.project-carousel__frame');
    if (!frame) return;
    const fallback = index - swiper.activeIndex;
    const progress = typeof slide.progress === 'number' ? slide.progress : fallback;
    frames.push({ frame, progress });
  });
  return frames;
}

export interface ProjectCarouselCaptions {
  /** Accessible caption of one slide, built from the data ProjectCard already renders. */
  slideLabel: (project: Project, index: number, total: number) => string;
  /** Position announced after every navigation. */
  position: (index: number, total: number) => string;
}

export interface ProjectCarouselTrackProps {
  items: Project[];
  /** One-shot stack intro the first time the track enters the viewport. */
  intro?: boolean;
  pauseOnHover?: boolean;
  draggable?: boolean;
  speed?: number;
  captions?: ProjectCarouselCaptions;
  /** Card media aspect ratio (width / height). */
  cardAspect?: number;
  /** Full effect tier: sweep, dispersion, intro and autoplay. */
  effects?: boolean;
}


export function ProjectCarouselTrack({
  items,
  intro = true,
  pauseOnHover = true,
  draggable = true,
  speed = DEFAULT_SPEED,
  captions,
  cardAspect = DEFAULT_CARD_ASPECT,
  effects = false,
}: ProjectCarouselTrackProps) {
  const { i18n, t } = useTranslation('common');
  const { prefersReducedMotion } = useCapabilities();
  const rootRef = useRef<HTMLDivElement>(null);
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const introDoneRef = useRef(false);
  const lastTranslateRef = useRef({ value: 0, time: 0 });
  const dispersionTimerRef = useRef<number | undefined>(undefined);
  const sweepTimerRef = useRef<number | undefined>(undefined);
  const wheelTimeRef = useRef(0);

  const total = items.length;
  const autoplayEnabled = effects && total > 2;
  const effectiveSpeed = prefersReducedMotion ? 0 : speed;
  const slideLabel =
    captions?.slideLabel ??
    ((project: Project, index: number, count: number) =>
      `${getLocalized(project.title, i18n.language)} — ${t('projects.slideLabel', {
        index: index + 1,
        slidesLength: count,
      })}`);
  const positionLabel =
    captions?.position ??
    ((index: number, count: number) =>
      t('projects.slidePosition', { current: index + 1, total: count }));

  /** Writes scale/opacity/veil on every frame; `duration` is Swiper's own transition. */
  const paintFrames = useCallback((swiper: SwiperInstance, duration: number) => {
    for (const { frame, progress } of readFrames(swiper)) {
      const state = frameStateFor(progress);
      frame.style.setProperty('--frame-scale', state.scale.toFixed(3));
      frame.style.setProperty('--frame-opacity', state.opacity.toFixed(3));
      frame.style.setProperty('--frame-veil', state.veil.toFixed(3));
      frame.style.setProperty('--frame-shift', '0px');
      frame.style.setProperty('--frame-duration', `${duration}ms`);
    }
  }, []);

  /** Chromatic dispersion: two tinted overlays follow the current velocity (max 4px). */
  const paintDispersion = useCallback(
    (swiper: SwiperInstance) => {
      const root = rootRef.current;
      if (!root || !effects) return;
      const now = typeof performance === 'undefined' ? Date.now() : performance.now();
      const previous = lastTranslateRef.current;
      const translate = Number.isFinite(swiper.translate) ? swiper.translate : previous.value;
      const elapsed = Math.max(16, now - previous.time);
      const velocity = previous.time === 0 ? 0 : Math.abs(translate - previous.value) / elapsed;
      lastTranslateRef.current = { value: translate, time: now };
      const strength = Math.min(1, velocity / 1.2);
      root.style.setProperty('--dispersion-x', `${(strength * MAX_DISPERSION_PX).toFixed(2)}px`);
      root.style.setProperty('--dispersion-o', (strength * 0.5).toFixed(3));
      window.clearTimeout(dispersionTimerRef.current);
      dispersionTimerRef.current = window.setTimeout(() => {
        root.style.setProperty('--dispersion-x', '0px');
        root.style.setProperty('--dispersion-o', '0');
      }, 160);
    },
    [effects],
  );

  /** Stack intro: every card leaves a central pile towards its slot. */
  const runIntro = useCallback(() => {
    const swiper = swiperRef.current;
    if (!swiper) return;
    const frames = readFrames(swiper);
    if (frames.length === 0) return;
    const slotWidth = (swiper.slides[0] as HTMLElement | undefined)?.offsetWidth ?? 0;
    const step = slotWidth > 0 ? slotWidth + SLIDE_GAP_PX : 0;

    for (const { frame, progress } of frames) {
      frame.style.setProperty('--frame-duration', '0ms');
      frame.style.setProperty('--frame-shift', `${(-progress * step).toFixed(1)}px`);
      frame.style.setProperty('--frame-scale', '0.55');
      frame.style.setProperty('--frame-opacity', '0');
    }

    const play = () => {
      for (const { frame, progress } of frames) {
        const state = frameStateFor(progress);
        frame.style.setProperty('--frame-duration', `${INTRO_DURATION_MS}ms`);
        frame.style.setProperty('--frame-shift', '0px');
        frame.style.setProperty('--frame-scale', state.scale.toFixed(3));
        frame.style.setProperty('--frame-opacity', state.opacity.toFixed(3));
      }
      window.setTimeout(() => {
        for (const { frame } of frames) frame.style.setProperty('--frame-duration', '0ms');
      }, INTRO_DURATION_MS + 80);
    };

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => requestAnimationFrame(play));
      return;
    }
    play();
  }, []);

  useEffect(() => {
    if (!effects || !intro || !isReady || !isInView || introDoneRef.current) return;
    introDoneRef.current = true;
    runIntro();
  }, [effects, intro, isReady, isInView, runIntro]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        setIsInView(entry.isIntersecting && entry.intersectionRatio >= 0.15);
      },
      { threshold: [0, 0.15, 0.5] },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleVisibility = () => setIsDocumentVisible(document.visibilityState !== 'hidden');
    handleVisibility();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const canPlay =
    autoplayEnabled &&
    isPlaying &&
    isInView &&
    isDocumentVisible &&
    !(pauseOnHover && isHovered) &&
    !hasFocus;

  useEffect(() => {
    if (!canPlay) return;
    const handle = window.setInterval(() => {
      const swiper = swiperRef.current;
      // An open detail modal pauses the carousel without touching its state.
      if (!swiper || document.querySelector('dialog[open]')) return;
      if (swiper.activeIndex >= total - 1) swiper.slideTo(0, effectiveSpeed);
      else swiper.slideNext(effectiveSpeed);
    }, AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(handle);
  }, [canPlay, effectiveSpeed, total]);

  /** Wheel: only a horizontal-dominant gesture navigates, and vertical is never prevented. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      if (Math.abs(event.deltaX) < 16) return;
      const swiper = swiperRef.current;
      if (!swiper) return;
      const now = Date.now();
      if (now - wheelTimeRef.current < 320) return;
      wheelTimeRef.current = now;
      if (event.deltaX > 0) swiper.slideNext(effectiveSpeed);
      else swiper.slidePrev(effectiveSpeed);
    };
    root.addEventListener('wheel', handleWheel, { passive: true });
    return () => root.removeEventListener('wheel', handleWheel);
  }, [effectiveSpeed]);

  useEffect(
    () => () => {
      window.clearTimeout(dispersionTimerRef.current);
      window.clearTimeout(sweepTimerRef.current);
    },
    [],
  );

  const handleSwiper = (swiper: SwiperInstance) => {
    swiperRef.current = swiper;
    setActiveIndex(swiper.activeIndex);
    paintFrames(swiper, 0);
    setIsReady(true);
  };

  const handleFocus = (event: ReactFocusEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    // Only focus on the slides pauses autoplay. The controls (prev/next/pause) must not
    // pause it, otherwise the pause button would cancel itself and never resume.
    const insideSlides = Boolean(target?.closest('.project-carousel__swiper'));
    setHasFocus(insideSlides);
    if (!effects || !insideSlides) return;
    const frame = target?.closest<HTMLElement>('.project-carousel__frame');
    if (!frame || frame.dataset.active !== 'true' || frame.dataset.sweep === 'true') return;
    frame.dataset.sweep = 'true';
    window.clearTimeout(sweepTimerRef.current);
    sweepTimerRef.current = window.setTimeout(() => {
      delete frame.dataset.sweep;
    }, SWEEP_DURATION_MS + 80);
  };

  const handleBlur = (event: ReactFocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as HTMLElement | null;
    const staysInside = next instanceof HTMLElement && Boolean(next.closest('.project-carousel__swiper'));
    if (!staysInside) setHasFocus(false);
  };

  const rootStyle = { '--project-card-aspect': cardAspect } as CSSProperties;


  return (
    <div
      ref={rootRef}
      className="project-carousel"
      data-testid="project-carousel"
      data-effects={effects ? 'true' : 'false'}
      style={rootStyle}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onFocusCapture={handleFocus}
      onBlurCapture={handleBlur}
    >
      <Swiper
        modules={[Keyboard, A11y]}
        className="project-carousel__swiper"
        centeredSlides
        slidesPerView="auto"
        spaceBetween={SLIDE_GAP_PX}
        loop={false}
        // With three (or fewer) slides wide enough, Swiper would lock itself and ignore
        // slideNext()/slideTo(): the track must always be able to centre the active card.
        watchOverflow={false}
        watchSlidesProgress
        grabCursor={draggable}
        allowTouchMove={draggable}
        speed={effectiveSpeed}
        keyboard={{ enabled: true, onlyInViewport: true }}
        a11y={{
          enabled: true,
          containerMessage: t('projects.carousel'),
          prevSlideMessage: t('projects.previous'),
          nextSlideMessage: t('projects.next'),
          firstSlideMessage: t('projects.firstSlide'),
          lastSlideMessage: t('projects.lastSlide'),
        }}
        onSwiper={handleSwiper}
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        onSetTranslate={(swiper) => {
          paintFrames(swiper, 0);
          paintDispersion(swiper);
        }}
        onSetTransition={(swiper, duration) => paintFrames(swiper, duration)}
        onResize={(swiper) => paintFrames(swiper, 0)}
      >
        {items.map((project, index) => (
          <SwiperSlide
            className="project-carousel__slide"
            key={project.slug}
            onClickCapture={(event) => {
              const swiper = swiperRef.current;
              if (swiper && index !== swiper.activeIndex) {
                event.preventDefault();
                event.stopPropagation();
                swiper.slideTo(index, effectiveSpeed);
              }
            }}
          >
            {({ isActive }) => (
              <div className="project-carousel__frame" data-active={isActive ? 'true' : 'false'}>
                {effects && (
                  <>
                    <span
                      className="project-carousel__ghost project-carousel__ghost--cyan"
                      aria-hidden="true"
                    />
                    <span
                      className="project-carousel__ghost project-carousel__ghost--warm"
                      aria-hidden="true"
                    />
                  </>
                )}
                <div className="project-carousel__card">
                  <ProjectCard project={project} isActive={isActive} />
                  {effects && <span className="project-carousel__veil" aria-hidden="true" />}
                  {effects && (
                    <span className="project-carousel__sweep" aria-hidden="true">
                      <span className="project-carousel__sweep-line" />
                    </span>
                  )}
                </div>
                <span className="sr-only">{slideLabel(project, index, total)}</span>
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="project-carousel__controls">
        <button
          className="project-carousel__navigation"
          type="button"
          aria-label={t('projects.previous')}
          disabled={activeIndex === 0}
          onClick={() => swiperRef.current?.slidePrev(effectiveSpeed)}
        >
          <span aria-hidden="true">←</span>
        </button>
        <div
          className="project-carousel__pagination"
          role="group"
          aria-label={t('projects.pagination')}
        >
          {items.map((project, index) => (
            <button
              className="project-carousel__pagination-button"
              type="button"
              key={project.slug}
              aria-label={t('projects.goToSlide', { current: index + 1, total })}
              aria-current={activeIndex === index ? 'true' : undefined}
              onClick={() => swiperRef.current?.slideTo(index, effectiveSpeed)}
            />
          ))}
        </div>
        <button
          className="project-carousel__navigation"
          type="button"
          aria-label={t('projects.next')}
          disabled={activeIndex === total - 1}
          onClick={() => swiperRef.current?.slideNext(effectiveSpeed)}
        >
          <span aria-hidden="true">→</span>
        </button>
        {autoplayEnabled && (
          <button
            className="project-carousel__playback"
            type="button"
            data-playing={isPlaying ? 'true' : 'false'}
            aria-label={isPlaying ? t('projects.pauseAutoplay') : t('projects.resumeAutoplay')}
            onClick={() => setIsPlaying((current) => !current)}
          >
            <span aria-hidden="true">{isPlaying ? '❚❚' : '▶'}</span>
            <span className="project-carousel__playback-label">
              {isPlaying ? t('projects.pause') : t('projects.resume')}
            </span>
          </button>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {positionLabel(activeIndex, total)}
      </p>
    </div>
  );
}

