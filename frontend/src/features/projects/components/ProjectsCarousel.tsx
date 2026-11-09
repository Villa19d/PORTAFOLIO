import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useCapabilities } from '../../../hooks/useCapabilities';
import type { Project } from '../types';
import { getLocalized, resolveCarouselLayout } from '../utils/projectHelpers';
import { ProjectCard } from './ProjectCard';
import { ProjectCardSkeleton } from './ProjectCardSkeleton';
import { ScrollSnapTrack } from './ScrollSnapTrack';

// The carousel (Swiper + effects) lives in its own lazy chunk, so the entry bundle
// never pays for it and the section can fall back to the plain scroll track.
const LazyProjectCarouselTrack = lazy(() =>
  import('./ProjectCarouselTrack').then(({ ProjectCarouselTrack }) => ({
    default: ProjectCarouselTrack,
  })),
);
const SKELETON_COUNT = 3;
/** 16:10 cards; kept here so the aspect ratio stays configurable from the section. */
const CARD_ASPECT = 1.6;
const CAROUSEL_SPEED = 620;

interface ProjectsCarouselProps {
  projects: Project[];
  isLoading: boolean;
}

/** Cards keep the slug key, so switching layout never remounts a card. */
function renderCards(projects: Project[]) {
  return projects.map((project) => <ProjectCard key={project.slug} project={project} />);
}

export function ProjectsCarousel({ projects, isLoading }: ProjectsCarouselProps) {
  const { i18n, t } = useTranslation('common');
  const { canUseHeavyEffects } = useCapabilities();

  if (isLoading) {
    return (
      <ScrollSnapTrack isLoading label={t('projects.loading')} lang={i18n.language}>
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <ProjectCardSkeleton key={`skeleton-${index}`} label={t('projects.loadingCard')} />
        ))}
      </ScrollSnapTrack>
    );
  }

  if (projects.length === 0) {
    return null;
  }

  const layout = resolveCarouselLayout(projects.length);

  // 1 project: one centred card. 2 projects: side by side, no loop and no autoplay.
  if (layout !== 'carousel') {
    return (
      <div
        className="project-stack"
        data-layout={layout}
        data-count={projects.length}
        lang={i18n.language}
        role="group"
        aria-label={t('projects.showcase')}
      >
        {renderCards(projects)}
      </div>
    );
  }

  // 3 or more: flat horizontal carousel with the active card centred.
  return (
    <div className="projects-carousel" data-layout="carousel" lang={i18n.language}>
      <Suspense fallback={<ScrollSnapTrack>{renderCards(projects)}</ScrollSnapTrack>}>
        <LazyProjectCarouselTrack
          items={projects}
          effects={canUseHeavyEffects}
          intro={canUseHeavyEffects}
          pauseOnHover
          draggable
          speed={CAROUSEL_SPEED}
          cardAspect={CARD_ASPECT}
          captions={{
            slideLabel: (project, index, total) =>
              `${getLocalized(project.title, i18n.language)} — ${t('projects.slidePosition', {
                current: index + 1,
                total,
              })}`,
            position: (index, total) =>
              t('projects.slidePosition', { current: index + 1, total }),
          }}
        />
      </Suspense>
    </div>
  );
}
