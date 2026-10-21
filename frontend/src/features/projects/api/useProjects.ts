import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../../../lib/api';
import { type Project } from '../types';
import projectsSnapshot from '../../../data/projects.snapshot.json';

export function useProjects() {
  const query = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => fetchApi<Project[]>('/api/projects'),
    // Usamos initialData en lugar de placeholderData
    initialData: projectsSnapshot as Project[],
    // Infinity evita que haga peticiones HTTP de fondo (adiós error 500/HTML)
    staleTime: Infinity,
  });

  return {
    ...query,
    source: 'snapshot',
  };
}

export function useProject(slug: string) {
  const query = useQuery<Project>({
    queryKey: ['projects', slug],
    queryFn: () => fetchApi<Project>(`/api/projects/${slug}`),
    initialData: () => {
      const found = (projectsSnapshot as Project[]).find((p) => p.slug === slug);
      return found ? found : undefined;
    },
    staleTime: Infinity,
  });

  return {
    ...query,
    source: 'snapshot',
  };
}