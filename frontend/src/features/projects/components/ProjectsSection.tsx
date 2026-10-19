import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { Section } from '../../../components/layout/Section';
import { useProjects } from '../api/useProjects';
import { ProjectsCarousel } from './ProjectsCarousel';

function ProjectsContent() {
  const { t } = useTranslation('common');
  const { data, error, isError, isPending, isPlaceholderData } = useProjects();

  if (isError) {
    throw error;
  }

  const isLoading = !data || (data.length === 0 && (isPending || isPlaceholderData));

  if (!isLoading && data?.length === 0) {
    return (
      <p className="projects-empty" role="status">
        {t('projects.empty')}
      </p>
    );
  }

  return <ProjectsCarousel projects={data ?? []} isLoading={isLoading} />;
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
