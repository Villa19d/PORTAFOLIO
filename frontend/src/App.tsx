import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from './components/layout/Navbar';
import { Section } from './components/layout/Section';
import { Hero } from './features/hero/components/Hero';
import { SITE_CONFIG } from './data/site';

const LazyAboutSection = lazy(() =>
  import('./features/about/AboutSection').then(({ AboutSection }) => ({
    default: AboutSection,
  })),
);

const LazyProjectsSection = lazy(() =>
  import('./features/projects/components/ProjectsSection').then(({ ProjectsSection }) => ({
    default: ProjectsSection,
  })),
);

const LazyExperienceSection = lazy(() =>
  import('./features/experience/ExperienceSection').then(({ ExperienceSection }) => ({
    default: ExperienceSection,
  })),
);

interface DeferredFeatureSectionProps {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  rootMargin?: string;
}

function DeferredFeatureSection({
  id,
  title,
  description,
  children,
  rootMargin = '280px 0px',
}: DeferredFeatureSectionProps) {
  const { t } = useTranslation('common');
  const sectionRef = useRef<HTMLElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    if (!('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [rootMargin]);

  const placeholder = (
    <section
      id={id}
      ref={sectionRef}
      aria-labelledby={`${id}-heading`}
      className="mx-auto flex min-h-screen w-full max-w-6xl scroll-mt-[72px] flex-col justify-center px-4 py-24 sm:px-6 lg:px-8"
    >
      <h2 id={`${id}-heading`} className="mb-8 font-display text-4xl font-bold text-text md:text-5xl">
        {title}
      </h2>
      {description && <p className="mb-8 max-w-2xl text-base leading-relaxed text-text-muted">{description}</p>}
      {shouldLoad && <span role="status" className="sr-only">{t('experience.loading')}</span>}
      <div
        aria-hidden="true"
        className={id === 'about'
          ? 'grid grid-cols-1 auto-rows-[minmax(var(--bento-row),auto)] gap-4 sm:grid-cols-2 lg:grid-cols-4'
          : 'flex gap-4 overflow-hidden'}
      >
        {(id === 'about'
          ? [
              'col-span-1 sm:col-span-2 lg:row-span-2',
              'col-span-1 sm:col-span-2 lg:col-span-2 lg:row-span-2',
              'col-span-1 lg:row-span-1',
              'col-span-1 lg:row-span-1',
              'col-span-1 sm:col-span-2 lg:row-span-1',
              'col-span-1 lg:row-span-1',
              'col-span-1 lg:row-span-1',
            ]
          : ['projects-placeholder-card', 'projects-placeholder-card', 'projects-placeholder-card']
        ).map((tileClass, item) => (
          <div
            key={item}
            className={`rounded-[--radius-xl] border border-border bg-surface p-6 ${
              id === 'about' ? tileClass : 'h-[26rem] min-w-[min(82vw,22rem)]'
            }`}
          >
            <div className="h-3 w-28 animate-pulse rounded bg-surface-elevated" />
            <div className="mt-5 h-6 w-3/4 animate-pulse rounded bg-surface-elevated" />
            <div className="mt-5 h-4 w-full animate-pulse rounded bg-surface-elevated" />
          </div>
        ))}
      </div>
    </section>
  );

  return shouldLoad ? <Suspense fallback={placeholder}>{children}</Suspense> : placeholder;
}

interface ExperiencePlaceholderProps {
  title: string;
  subtitle: string;
  loadingLabel?: string;
}

function ExperiencePlaceholder({ title, subtitle, loadingLabel }: ExperiencePlaceholderProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-24 sm:px-6 lg:px-8">
      <h2 className="mb-8 font-display text-4xl font-bold text-text md:text-5xl">{title}</h2>
      <p className="mb-12 max-w-2xl text-base leading-relaxed text-text-muted">{subtitle}</p>
      {loadingLabel && <p role="status" className="sr-only">{loadingLabel}</p>}
      <div aria-hidden="true" className="ml-2 flex flex-col gap-6 border-l border-border pl-7 sm:ml-4 sm:pl-10">
        {[0, 1, 2].map((item) => (
          <div key={item} className="rounded-[--radius-xl] border border-border bg-surface p-6">
            <div className="h-3 w-28 animate-pulse rounded bg-surface-elevated" />
            <div className="mt-4 h-6 w-3/4 animate-pulse rounded bg-surface-elevated" />
            <div className="mt-5 h-4 w-full animate-pulse rounded bg-surface-elevated" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DeferredExperienceSection() {
  const { t } = useTranslation('common');
  const sectionRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    if (!('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '360px 0px' },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const placeholder = (
    <ExperiencePlaceholder
      title={t('experience.title')}
      subtitle={t('experience.subtitle')}
      loadingLabel={shouldLoad ? t('experience.loading') : undefined}
    />
  );

  return (
    <div
      id="experience"
      ref={sectionRef}
      role="region"
      aria-label={t('experience.title')}
      className="min-h-screen scroll-mt-[72px]"
    >
      {shouldLoad ? (
        <Suspense fallback={placeholder}>
          <LazyExperienceSection />
        </Suspense>
      ) : (
        placeholder
      )}
    </div>
  );
}

export default function App() {
  const { t } = useTranslation('common');
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main id="main-content" className="flex-1">
        <Hero />

        <DeferredFeatureSection
          id="about"
          title={t('about.title')}
          description={t('about.subtitle')}
          rootMargin="0px"
        >
          <LazyAboutSection />
        </DeferredFeatureSection>

        <DeferredFeatureSection id="projects" title={t('sections.projects')}>
          <LazyProjectsSection />
        </DeferredFeatureSection>

        <DeferredExperienceSection />

        <Section id="contact" titleKey="sections.contact" title={t('sections.contact')}>
          <p className="text-text-muted text-lg max-w-prose">{t('sections.contactPlaceholder')}</p>
        </Section>
      </main>

      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-muted">
          <span>
            &copy; {currentYear} {SITE_CONFIG.authorName}. {t('footer.rights')}
          </span>
          <div className="flex items-center gap-6">
            {SITE_CONFIG.githubUrl && (
              <a
                href={SITE_CONFIG.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
              >
                GitHub
              </a>
            )}
            <a
              href={SITE_CONFIG.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
