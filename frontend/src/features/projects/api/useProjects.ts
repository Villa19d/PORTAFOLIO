import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../../../lib/api';
import { type Project } from '../types';
import projectsSnapshot from '../../../data/projects.snapshot.json';

export function useProjects() {
  const query = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => fetchApi<Project[]>('/api/projects'),
    placeholderData: projectsSnapshot as Project[],
  });

  return {
    ...query,
    source: query.isPlaceholderData ? 'snapshot' : 'live',
  };
}

export function useProject(slug: string) {
  const query = useQuery<Project>({
    queryKey: ['projects', slug],
    queryFn: () => fetchApi<Project>(`/api/projects/${slug}`),
    placeholderData: () => {
      const found = (projectsSnapshot as Project[]).find((p) => p.slug === slug);
      return found ? found : undefined;
    },
  });

  return {
    ...query,
    source: query.isPlaceholderData ? 'snapshot' : 'live',
  };
}
