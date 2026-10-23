import { useTranslation } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { Section } from '../../../components/layout/Section';
import { useProjects } from '../api/useProjects';
import { ProjectsCarousel } from './ProjectsCarousel';

const projectsQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
  },
});

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
    <QueryClientProvider client={projectsQueryClient}>
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
    </QueryClientProvider>
  );
}
