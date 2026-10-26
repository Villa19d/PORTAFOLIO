import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { m, type Variants } from 'motion/react';
import { useSmoothScroll } from '../../../components/SmoothScrollProvider';
import { useSound } from '../../sound/SoundContext';
import { useCapabilities } from '../../../hooks/useCapabilities';
import { MagneticButton } from '../../../components/ui/MagneticButton';
import { HeroBackground } from './HeroBackground';
import { HeroPhoto } from './HeroPhoto';

const LITE_MOTION_SCALE = 0.4;

export function Hero() {
  const { t } = useTranslation('common');
  const { scrollTo } = useSmoothScroll();
  const { play } = useSound();
  const { prefersReducedMotion, perfTier } = useCapabilities();
  const sectionRef = useRef<HTMLElement | null>(null);

  // 1 in full tier (unchanged values), 0 with reduced motion, shorter entrances in lite tier.
  const motionScale = prefersReducedMotion ? 0 : perfTier === 'lite' ? LITE_MOTION_SCALE : 1;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12 * motionScale,
        delayChildren: 0.15 * motionScale,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.55 * motionScale,
        ease: [0.2, 0.8, 0.2, 1],
      },
    },
  };

  return (
    <section
      id="home"
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden pt-[72px] pb-16"
    >
      {/* Background layer */}
      <HeroBackground containerRef={sectionRef} />

      {/* Main Hero Content */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-10 md:gap-12 lg:flex-row lg:gap-16">
          {/* Text Column (Left on Desktop, Bottom on Mobile) */}
          <m.div
            className="order-2 w-full text-center lg:order-1 lg:max-w-xl lg:text-left"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Saludo */}
            <m.p
              variants={itemVariants}
              className="font-mono text-sm font-semibold tracking-wider text-text-muted uppercase"
            >
              {t('hero.greeting')}
            </m.p>

            {/* Nombre (H1) con gradiente de marca */}
            <m.h1
              id="hero-title"
              variants={itemVariants}
              className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
                {t('hero.name')}
              </span>
            </m.h1>

            {/* Rol */}
            <m.p
              variants={itemVariants}
              className="mt-3 font-display text-xl font-semibold text-text sm:text-2xl"
            >
              {t('hero.role')}
            </m.p>

            {/* Subtítulo */}
            <m.p
              variants={itemVariants}
              className="mt-4 text-base text-text-muted sm:text-lg sm:leading-relaxed"
            >
              {t('hero.subtitle')}
            </m.p>

            {/* CTAs */}
            <m.div
              variants={itemVariants}
              className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start"
            >
              {/* Primario: Ver proyectos */}
              <MagneticButton className="w-full sm:w-auto">
                <a
                  href="#projects"
                  onClick={(e) => {
                    e.preventDefault();
                    play('click');
                    play('whoosh');
                    scrollTo('#projects');
                  }}
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius)] bg-accent px-6 py-3 font-medium text-bg shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none sm:w-auto"
                >
                  {t('hero.ctaProjects')}
                </a>
              </MagneticButton>

              {/* Secundario: Contáctame */}
              <MagneticButton className="w-full sm:w-auto">
                <a
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    play('click');
                    play('whoosh');
                    scrollTo('#contact');
                  }}
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius)] border border-border-control bg-surface px-6 py-3 font-medium text-text transition-colors hover:bg-surface-elevated focus-visible:outline-none sm:w-auto"
                >
                  {t('hero.ctaContact')}
                </a>
              </MagneticButton>
            </m.div>
          </m.div>

          {/* Photo Column (Right on Desktop, Top on Mobile) */}
          <m.div
            className="order-1 w-full lg:order-2 lg:w-auto"
            initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.7 * motionScale,
              ease: [0.2, 0.8, 0.2, 1],
              delay: 0.1 * motionScale,
            }}
          >
            <HeroPhoto />
          </m.div>
        </div>
      </div>
    </section>
  );
}