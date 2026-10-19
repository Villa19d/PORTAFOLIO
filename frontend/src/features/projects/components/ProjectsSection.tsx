import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { Section } from '../../../components/layout/Section';
import { useProjects } from '../api/useProjects';
import { ProjectCard } from './ProjectCard';
import { ProjectCardSkeleton } from './ProjectCardSkeleton';

const SKELETON_COUNT = 3;

function ProjectsContent() {
  const { i18n, t } = useTranslation('common');
  const { data, error, isError, isPending, isPlaceholderData } = useProjects();

  if (isError) {
    throw error;
  }

  const showSkeletons =
    !data || (data.length === 0 && (isPending || isPlaceholderData));

  return (
    showSkeletons ? (
      <div
        className="projects-grid"
        aria-label={t('projects.loading')}
        aria-busy="true"
        data-testid="projects-skeleton-grid"
      >
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <ProjectCardSkeleton key={index} label={t('projects.loadingCard')} />
        ))}
      </div>
    ) : data.length === 0 ? (
      <p className="projects-empty" role="status">
        {t('projects.empty')}
      </p>
    ) : (
      <div className="projects-grid" lang={i18n.language}>
        {data.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    )
  );
}

export function ProjectsSection() {
  const { t } = useTranslation('common');

  return (
    <Section
      id="projects"
      titleKey="sections.projects"
      title={t('sections.projects')}
      className="projects-section"
    >
      <ErrorBoundary>
        <ProjectsContent />
      </ErrorBoundary>
    </Section>
  );
}
