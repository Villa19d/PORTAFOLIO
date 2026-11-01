import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useCapabilities } from '../../../hooks/useCapabilities';
import type { Project } from '../types';
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

  if (projects.length <= 2) {
    return (
      <div className="projects-static" lang={i18n.language}>
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    );
  }

  if (canUseHeavyEffects) {
    return (
      <Suspense
        fallback={
          <ScrollSnapTrack lang={i18n.language}>
            {projects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </ScrollSnapTrack>
        }
      >
        <LazyCoverflowTrack projects={projects} />
      </Suspense>
    );
  }

  return (
    <ScrollSnapTrack lang={i18n.language}>
      {projects.map((project) => (
        <ProjectCard key={project.slug} project={project} />
      ))}
    </ScrollSnapTrack>
  );
}
