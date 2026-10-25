import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createAdminProject,
  deleteAdminProject,
  getAdminProjects,
  updateAdminProject,
  type ProjectInput,
} from './adminProjectsApi';
import type { Project } from './features/projects/types';

export const adminProjectsQueryKey = ['admin', 'projects'] as const;

export function useAdminProjects() {
  return useQuery<Project[]>({
    queryKey: adminProjectsQueryKey,
    queryFn: getAdminProjects,
  });
}

export function useCreateAdminProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (project: ProjectInput) => createAdminProject(project),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminProjectsQueryKey }),
  });
}

export function useUpdateAdminProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, project }: { id: string; project: ProjectInput }) =>
      updateAdminProject(id, project),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminProjectsQueryKey }),
  });
}

export function useDeleteAdminProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAdminProject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminProjectsQueryKey }),
  });
}
