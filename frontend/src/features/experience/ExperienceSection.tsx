import { LazyMotion, domAnimation, m } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Section } from '../../components/layout/Section';
import { PROFILE_DATA, type TimelineEntryKind } from '../../data/profile';
import { useEntranceMotion } from '../../hooks/useEntranceMotion';
import { formatTimelinePeriod, sortTimelineEntries } from './utils/timeline';

const kindStyles: Record<TimelineEntryKind, string> = {
  work: 'border-accent/35 bg-accent/10 text-accent',
  education: 'border-accent-2/35 bg-accent-2/10 text-accent-2',
  certification: 'border-border bg-surface-elevated text-text-muted',
};

export function ExperienceSection() {
  const { t, i18n } = useTranslation('common');
  const { skipEntrance } = useEntranceMotion();
  const language = i18n.language?.startsWith('en') ? 'en' : 'es';
  const entries = sortTimelineEntries(PROFILE_DATA.timeline);

  return (
    <LazyMotion features={domAnimation}>
      <Section
        id="experience-content"
        titleKey="experience.title"
        title={t('experience.title')}
        className="experience-section"
      >
        <p className="mb-12 max-w-2xl text-base leading-relaxed text-text-muted">
          {t('experience.subtitle')}
        </p>

        <ol
          data-testid="experience-timeline"
          aria-label={t('experience.timelineLabel')}
          className="relative ml-2 flex flex-col gap-6 before:absolute before:inset-y-2 before:-left-px before:w-px before:bg-gradient-to-b before:from-accent/80 before:via-border before:to-transparent sm:ml-4 sm:gap-8"
        >
          {entries.map((entry, index) => (
            <m.li
              key={entry.id}
              initial={skipEntrance ? false : { opacity: 0, y: 18 }}
              whileInView={skipEntrance ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.16 }}
              transition={{ duration: 0.42, delay: Math.min(index * 0.045, 0.27), ease: 'easeOut' }}
              className="relative pl-7 sm:pl-10"
            >
              <span
                aria-hidden="true"
                className="absolute -left-[0.43rem] top-6 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-accent/70 bg-bg"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              </span>

              <article className="group rounded-[--radius-xl] border border-border bg-surface p-5 transition-transform duration-200 motion-safe:hover:-translate-y-0.5 sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-text-muted">
                      {entry.organization}
                    </p>
                    <h3 className="font-display text-xl font-semibold leading-snug text-text sm:text-2xl">
                      {entry.title[language]}
                    </h3>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 font-mono text-[0.68rem] uppercase tracking-wider ${kindStyles[entry.kind]}`}
                    >
                      {t(`experience.kinds.${entry.kind}`)}
                    </span>
                    <time className="rounded-full border border-border bg-surface-elevated px-3 py-1 font-mono text-xs text-text-muted">
                      {formatTimelinePeriod(entry, language)}
                    </time>
                  </div>
                </div>

                {entry.bullets.length > 0 && (
                  <ul className="mt-5 flex flex-col gap-2 border-t border-border pt-4">
                    {entry.bullets.map((bullet, bulletIndex) => (
                      <li
                        key={`${entry.id}-bullet-${bulletIndex}`}
                        className="flex gap-3 text-sm leading-relaxed text-text-muted sm:text-base"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-[0.65em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent/80"
                        />
                        <span>{bullet[language]}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {entry.tags && entry.tags.length > 0 && (
                  <ul className="mt-5 flex flex-wrap gap-2" aria-label={t('experience.tagsLabel')}>
                    {entry.tags.map((tag) => (
                      <li
                        key={`${entry.id}-${tag}`}
                        className="rounded-full border border-border px-2.5 py-1 font-mono text-xs text-text-muted"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </m.li>
          ))}
        </ol>
      </Section>
    </LazyMotion>
  );
}