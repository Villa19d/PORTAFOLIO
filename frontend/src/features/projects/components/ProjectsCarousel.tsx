import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useCapabilities } from '../../../hooks/useCapabilities';
import type { Project } from '../types';
import { resolveCarouselLayout } from '../utils/projectHelpers';
import { ProjectCard } from './ProjectCard';
import { ProjectCardSkeleton } from './ProjectCardSkeleton';
import { ScrollSnapTrack } from './ScrollSnapTrack';

const LazyCoverflowTrack = lazy(() =>
  import('./CoverflowTrack').then(({ CoverflowTrack }) => ({ default: CoverflowTrack })),
);
const SKELETON_COUNT = 3;

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

  // 1-3 projects: big cards side by side, no forced loop and no duplicated slides.
  if (resolveCarouselLayout(projects.length) === 'showcase') {
    return (
      <div
        className="projects-showcase"
        data-layout="showcase"
        data-count={projects.length}
        lang={i18n.language}
        role="group"
        aria-label={t('projects.showcase')}
      >
        {renderCards(projects)}
      </div>
    );
  }

  // 4 or more: the carousel, with the Coverflow only when heavy effects are allowed.
  return (
    <div className="projects-carousel" data-layout="carousel" lang={i18n.language}>
      {canUseHeavyEffects ? (
        <Suspense fallback={<ScrollSnapTrack>{renderCards(projects)}</ScrollSnapTrack>}>
          <LazyCoverflowTrack projects={projects} />
        </Suspense>
      ) : (
        <ScrollSnapTrack>{renderCards(projects)}</ScrollSnapTrack>
      )}
    </div>
  );
}
