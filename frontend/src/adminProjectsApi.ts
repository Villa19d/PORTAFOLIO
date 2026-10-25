import { adminFetch } from './adminApi';
import type { Project } from './features/projects/types';

export type ProjectInput = Omit<
  Project,
  'id' | 'createdAt' | 'updatedAt'
>;

const PROJECTS_ENDPOINT = '/api/admin/projects';

export function getAdminProjects() {
  return adminFetch<Project[]>(PROJECTS_ENDPOINT);
}

export function createAdminProject(project: ProjectInput) {
  return adminFetch<Project>(PROJECTS_ENDPOINT, {
    body: JSON.stringify(project),
    method: 'POST',
  });
}

export function updateAdminProject(id: string, project: ProjectInput) {
  return adminFetch<Project>(`${PROJECTS_ENDPOINT}/${encodeURIComponent(id)}`, {
    body: JSON.stringify(project),
    method: 'PUT',
  });
}

export function deleteAdminProject(id: string) {
  return adminFetch<void>(`${PROJECTS_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
