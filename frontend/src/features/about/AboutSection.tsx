import { useTranslation } from 'react-i18next';
import { SITE_CONFIG } from '../../data/site';
import { PROFILE_DATA } from '../../data/profile';
import { Section } from '../../components/layout/Section';
import {
  ReactIcon,
  TypeScriptIcon,
  ViteIcon,
  TailwindIcon,
} from '../../components/icons/stack/SimpleIcons';
import { BentoGrid } from './components/BentoGrid';
import { BentoTile } from './components/BentoTile';
import { CvTile } from './components/CvTile';
import { LocationTile } from './components/LocationTile';

const stackIcons = [
  { name: 'React', Icon: ReactIcon },
  { name: 'TypeScript', Icon: TypeScriptIcon },
  { name: 'Vite', Icon: ViteIcon },
  { name: 'Tailwind CSS', Icon: TailwindIcon },
];

export function AboutSection() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'es';

  return (
    <Section
      id="about"
      titleKey="about.title"
      title={t('about.title')}
    >
      <p className="mb-8 max-w-2xl text-base leading-relaxed text-text-muted">
        {t('about.subtitle')}
      </p>

      <BentoGrid>
        <BentoTile
          label={t('about.introLabel')}
          className="col-span-1 sm:col-span-2 lg:row-span-2"
        >
          <div className="flex h-full flex-col justify-end gap-3">
            <p className="font-mono text-sm uppercase tracking-widest text-accent">
              {t('about.introLabel')}
            </p>
            <h3 className="font-display text-3xl font-bold text-text">
              {t('hero.name')}
            </h3>
            <p className="text-lg text-text-muted">{t('hero.role')}</p>
            <p className="max-w-prose text-sm leading-relaxed text-text-muted">
              {t('hero.subtitle')}
            </p>
          </div>
        </BentoTile>

        <BentoTile
          label={t('about.stackLabel')}
          className="col-span-1 sm:col-span-2 lg:row-span-1"
        >
          <h3 className="text-sm font-mono uppercase tracking-widest text-text-muted">
            {t('about.stackLabel')}
          </h3>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stackIcons.map(({ name, Icon }) => (
              <li
                key={name}
                className="flex min-w-0 flex-col items-center justify-center gap-2 rounded-[--radius-sm] border border-border bg-surface-elevated p-3 text-center"
              >
                <Icon className="h-7 w-7 text-accent" />
                <span className="text-xs font-mono text-text-muted">{name}</span>
              </li>
            ))}
          </ul>
        </BentoTile>

        <BentoTile
          label={t('about.locationLabel')}
          className="col-span-1 lg:row-span-1 p-0"
        >
          <LocationTile />
        </BentoTile>

        <BentoTile
          label={t('about.hobbiesLabel')}
          className="col-span-1 lg:row-span-1"
        >
          <h3 className="text-sm font-mono uppercase tracking-widest text-text-muted">
            {t('about.hobbiesLabel')}
          </h3>
          <p className="text-sm leading-relaxed text-text">
            {PROFILE_DATA.hobbies[lang]}
          </p>
        </BentoTile>

        <BentoTile
          label={t('about.currentlyLabel')}
          className="col-span-1 sm:col-span-2 lg:row-span-1"
        >
          <h3 className="text-sm font-mono uppercase tracking-widest text-text-muted">
            {t('about.currentlyLabel')}
          </h3>
          <p className="text-sm leading-relaxed text-text">
            {PROFILE_DATA.currently[lang]}
          </p>
        </BentoTile>

        <BentoTile
          label={t('about.cvLabel')}
          className="col-span-1 lg:row-span-1 p-0 flex flex-col justify-center"
        >
          <CvTile />
        </BentoTile>

        <BentoTile
          label={t('about.linksLabel')}
          className="col-span-1 lg:row-span-1"
        >
          <h3 className="text-sm font-mono uppercase tracking-widest text-text-muted">
            {t('about.linksLabel')}
          </h3>
          <div className="mt-auto flex flex-col gap-2">
            <a
              href={SITE_CONFIG.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-[--radius-sm] border border-border px-3 py-2 text-sm text-text transition-colors hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              GitHub
            </a>
            <a
              href={SITE_CONFIG.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-[--radius-sm] border border-border px-3 py-2 text-sm text-text transition-colors hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              LinkedIn
            </a>
          </div>
        </BentoTile>
      </BentoGrid>
    </Section>
  );
}
