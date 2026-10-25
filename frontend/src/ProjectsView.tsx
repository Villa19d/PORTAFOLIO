import { useState } from 'react';
import type { Project } from './features/projects/types';
import type { ProjectInput } from './adminProjectsApi';
import ProjectForm from './ProjectForm';
import {
  useAdminProjects,
  useCreateAdminProject,
  useDeleteAdminProject,
  useUpdateAdminProject,
} from './useAdminProjects';

function toProjectInput(project: Project): ProjectInput {
  return {
    description: project.description,
    displayOrder: project.displayOrder,
    featured: project.featured,
    imageUrl: project.imageUrl,
    liveUrl: project.liveUrl,
    published: project.published,
    repoUrl: project.repoUrl,
    slug: project.slug,
    summary: project.summary,
    techStack: project.techStack,
    title: project.title,
    videoUrl: project.videoUrl,
  };
}

export default function ProjectsView() {
  const projectsQuery = useAdminProjects();
  const createMutation = useCreateAdminProject();
  const updateMutation = useUpdateAdminProject();
  const deleteMutation = useDeleteAdminProject();
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function saveProject(project: ProjectInput) {
    if (editingProject) {
      await updateMutation.mutateAsync({ id: editingProject.id, project });
    } else {
      await createMutation.mutateAsync(project);
    }
    setEditingProject(null);
    setShowForm(false);
  }

  if (showForm || editingProject) {
    return (
      <ProjectForm
        initialValue={editingProject ? toProjectInput(editingProject) : undefined}
        onCancel={() => { setShowForm(false); setEditingProject(null); }}
        onSubmit={saveProject}
      />
    );
  }

  if (projectsQuery.isLoading) return <p>Cargando proyectos...</p>;
  if (projectsQuery.isError) return <p role="alert">No se pudieron cargar los proyectos.</p>;

  return (
    <section aria-labelledby="projects-title" className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold" id="projects-title">Proyectos</h1>
        <button className="rounded bg-accent px-4 py-2 text-bg" onClick={() => setShowForm(true)} type="button">Nuevo proyecto</button>
      </div>
      <p className="text-sm text-text-muted">El snapshot de respaldo del sitio se regenera en cada deploy de Vercel.</p>
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-border"><th className="p-3">Título</th><th className="p-3">Publicado</th><th className="p-3">Destacado</th><th className="p-3">Orden</th><th className="p-3">Acciones</th></tr></thead>
          <tbody>
            {projectsQuery.data?.map((project) => (
              <tr className="border-b border-border" key={project.id}>
                <td className="p-3">{project.title.es}</td>
                <td className="p-3">{project.published ? 'Sí' : 'No'}</td>
                <td className="p-3">{project.featured ? 'Sí' : 'No'}</td>
                <td className="p-3">{project.displayOrder}</td>
                <td className="flex flex-wrap gap-2 p-3">
                  <button onClick={() => setEditingProject(project)} type="button">Editar</button>
                  <button onClick={() => void updateMutation.mutateAsync({ id: project.id, project: { ...toProjectInput(project), published: !project.published } })} type="button">{project.published ? 'Despublicar' : 'Publicar'}</button>
                  <button onClick={() => { if (window.confirm('¿Borrar este proyecto?')) void deleteMutation.mutateAsync(project.id); }} type="button">Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
