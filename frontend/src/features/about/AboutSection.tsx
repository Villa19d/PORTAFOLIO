import { lazy, Suspense, useRef, type ComponentType, type SVGProps } from 'react';
import { useTranslation } from 'react-i18next';
import { SITE_CONFIG } from '../../data/site';
import { PROFILE_DATA } from '../../data/profile';
import { Section } from '../../components/layout/Section';
import {
  DockerIcon,
  PostgreSQLIcon,
  ReactIcon,
  SpringBootIcon,
  TailwindIcon,
  TypeScriptIcon,
} from '../../components/icons/stack/SimpleIcons';
import { BentoGrid } from './components/BentoGrid';
import { BentoTile } from './components/BentoTile';
import { CvTile } from './components/CvTile';
import { LocationTile } from './components/LocationTile';
import { useCapabilities } from '../../hooks/useCapabilities';

const BentoGlow = lazy(() => import('./components/BentoGlow'));

type StackIcon = ComponentType<SVGProps<SVGSVGElement>>;

const stackIconById: Record<string, StackIcon> = {
  react: ReactIcon,
  typescript: TypeScriptIcon,
  tailwind: TailwindIcon,
  'java-spring': SpringBootIcon,
  'postgresql-mysql': PostgreSQLIcon,
  docker: DockerIcon,
};

export function AboutSection() {
  const { t, i18n } = useTranslation('common');
  const { canUseHeavyEffects } = useCapabilities();
  const bentoRef = useRef<HTMLDivElement>(null);
  const lang = i18n.language?.startsWith('en') ? 'en' : 'es';
  const links = [
    { label: 'GitHub', href: SITE_CONFIG.githubUrl },
    { label: 'LinkedIn', href: SITE_CONFIG.linkedinUrl },
  ].flatMap(({ label, href }) => (href ? [{ label, href }] : []));

  const bentoGrid = (
    <BentoGrid containerRef={bentoRef}>
      <BentoTile label={t('about.introLabel')} className="col-span-1 sm:col-span-2 lg:row-span-2">
        <div className="flex h-full flex-col justify-end gap-3">
          <img
            src="/assets/rodrigo/rodrigo-480.webp"
            alt={t('hero.photoAlt')}
            width={160}
            height={200}
            loading="lazy"
            className="h-32 w-28 rounded-[--radius-md] object-cover"
          />
          <p className="font-mono text-sm uppercase tracking-widest text-accent">
            {t('about.introLabel')}
          </p>
          <h3 className="font-display text-3xl font-bold text-text">
            {t('hero.name')}
          </h3>
          <p className="text-lg text-text-muted">{t('hero.role')}</p>
          <p className="max-w-prose text-sm leading-relaxed text-text-muted">
            {PROFILE_DATA.bio[lang]}
          </p>
        </div>
      </BentoTile>

      <BentoTile label={t('about.stackLabel')} className="col-span-1 sm:col-span-2 lg:col-span-2 lg:row-span-2">
        <h3 className="text-sm font-mono uppercase tracking-widest text-text-muted">
          {t('about.stackLabel')}
        </h3>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {PROFILE_DATA.stack.map(({ id, label, monogram }) => {
            const Icon = stackIconById[id];
            return (
              <li
                key={id}
                className="group flex min-w-0 flex-col items-center justify-center gap-2 rounded-[--radius-sm] border border-border bg-surface-elevated p-2 text-center transition-colors duration-200 hover:border-accent/45 hover:bg-surface motion-safe:hover:-translate-y-0.5 motion-safe:transition-transform motion-safe:duration-200"
              >
                {Icon ? (
                  <Icon className="h-6 w-6 text-accent transition-transform duration-200 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3" />
                ) : (
                  <span aria-hidden="true" className="flex h-6 min-w-6 items-center justify-center font-mono text-xs font-bold text-accent transition-transform duration-200 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3">
                    {monogram}
                  </span>
                )}
                <span className="w-full text-xs font-mono text-text-muted">{label}</span>
              </li>
            );
          })}
        </ul>
      </BentoTile>

      <BentoTile label={t('about.locationLabel')} className="col-span-1 lg:row-span-1 !p-0">
        <LocationTile />
      </BentoTile>

      <BentoTile label={t('about.hobbiesLabel')} className="col-span-1 lg:row-span-1">
        <h3 className="text-sm font-mono uppercase tracking-widest text-text-muted">
          {t('about.hobbiesLabel')}
        </h3>
        <p className="text-sm leading-relaxed text-text">{PROFILE_DATA.hobbies[lang]}</p>
      </BentoTile>

      <BentoTile label={t('about.currentlyLabel')} className="col-span-1 sm:col-span-2 lg:row-span-1">
        <h3 className="text-sm font-mono uppercase tracking-widest text-text-muted">
          {t('about.currentlyLabel')}
        </h3>
        <p className="text-sm leading-relaxed text-text">{PROFILE_DATA.currently[lang]}</p>
      </BentoTile>

      <BentoTile label={t('about.cvLabel')} className="col-span-1 lg:row-span-1 !p-0 flex flex-col justify-center">
        <CvTile />
        {!PROFILE_DATA.cv[lang] && (
          <p className="px-4 text-center text-xs text-text-muted">
            {t('about.cvUnavailable')}
          </p>
        )}
      </BentoTile>

      <BentoTile label={t('about.linksLabel')} className="col-span-1 lg:row-span-1">
        <h3 className="text-sm font-mono uppercase tracking-widest text-text-muted">
          {t('about.linksLabel')}
        </h3>
        <div className="mt-auto flex flex-col gap-2">
          {links.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="rounded-[--radius-sm] border border-border px-3 py-2 text-sm text-text transition-colors hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {label}
            </a>
          ))}
        </div>
      </BentoTile>
    </BentoGrid>
  );

  return (
    <Section id="about" titleKey="about.title" title={t('about.title')}>
      <p className="mb-8 max-w-2xl text-base leading-relaxed text-text-muted">
        {t('about.subtitle')}
      </p>

      <div className="relative isolate">
        {bentoGrid}
        {canUseHeavyEffects && (
          <Suspense fallback={null}>
            <BentoGlow containerRef={bentoRef} />
          </Suspense>
        )}
      </div>
    </Section>
  );
}
