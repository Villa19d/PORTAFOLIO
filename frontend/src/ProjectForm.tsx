import { useEffect, useMemo, useState, type FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import { ApiError } from './lib/api';
import { type ProjectInput } from './adminProjectsApi';
import ImageUpload from './ImageUpload';

interface ProjectFormProps {
  initialValue?: ProjectInput;
  onCancel?: () => void;
  onSubmit: (project: ProjectInput) => Promise<void>;
}

const emptyProject: ProjectInput = {
  slug: '',
  title: { es: '', en: '' },
  summary: { es: '', en: '' },
  description: { es: '', en: '' },
  techStack: [],
  imageUrl: '',
  videoUrl: null,
  repoUrl: '',
  liveUrl: null,
  featured: false,
  published: false,
  displayOrder: 0,
};

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function ProjectForm({ initialValue, onCancel, onSubmit }: ProjectFormProps) {
  const [project, setProject] = useState<ProjectInput>(initialValue ?? emptyProject);
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  const [tag, setTag] = useState('');
  const [slugEdited, setSlugEdited] = useState(Boolean(initialValue?.slug));
  const [slugError, setSlugError] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setProject(initialValue ?? emptyProject);
    setSlugEdited(Boolean(initialValue?.slug));
  }, [initialValue]);

  const description = project.description[language];
  const preview = useMemo(() => description || 'Escribe una descripción para ver la vista previa.', [description]);

  function updateField<K extends keyof ProjectInput>(field: K, value: ProjectInput[K]) {
    setProject((current) => ({ ...current, [field]: value }));
  }

  function updateLocalized(
    field: 'title' | 'summary' | 'description',
    value: string,
  ) {
    setProject((current) => ({
      ...current,
      [field]: { ...current[field], [language]: value },
    }));
  }

  function addTag() {
    const nextTag = tag.trim();
    if (!nextTag || nextTag.length > 40 || project.techStack.length >= 20 || project.techStack.includes(nextTag)) {
      return;
    }
    updateField('techStack', [...project.techStack, nextTag]);
    setTag('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const urls = [project.imageUrl, project.repoUrl, project.liveUrl, project.videoUrl].filter(
      (url): url is string => Boolean(url),
    );
    if (urls.some((url) => !url.startsWith('https://'))) {
      setError('Todas las URLs deben comenzar con https://.');
      return;
    }
    if (!project.slug.match(/^[a-z0-9]+(-[a-z0-9]+)*$/)) {
      setSlugError('Usa solo minúsculas, números y guiones.');
      return;
    }
    if (project.techStack.length < 1) {
      setError('Agrega al menos una tecnología.');
      return;
    }
    setError('');
    setSlugError('');
    setIsSaving(true);
    try {
      await onSubmit(project);
    } catch (submitError: unknown) {
      if (submitError instanceof ApiError && submitError.status === 409) {
        setSlugError('Este slug ya existe.');
      } else {
        setError('No se pudo guardar el proyecto.');
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-5 rounded-lg border border-border bg-surface p-6" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">{initialValue ? 'Editar proyecto' : 'Nuevo proyecto'}</h2>
        {onCancel && <button onClick={onCancel} type="button">Cancelar</button>}
      </div>
      <label className="block text-sm" htmlFor="project-slug">
        Slug
        <input
          className="mt-1 w-full rounded border border-border-control bg-bg px-3 py-2"
          id="project-slug"
          maxLength={80}
          onChange={(event) => {
            setSlugEdited(true);
            updateField('slug', event.target.value);
          }}
          required
          value={project.slug}
        />
        {slugError && <span className="text-sm text-red-500" role="alert">{slugError}</span>}
      </label>
      {(['title', 'summary', 'description'] as const).map((field) => {
        const maxLength = field === 'title' ? 120 : field === 'summary' ? 300 : 20000;
        return (
          <fieldset className="space-y-2" key={field}>
            <legend className="text-sm font-medium">{field === 'title' ? 'Título' : field === 'summary' ? 'Resumen' : 'Descripción'}</legend>
            <div className="flex gap-2">
              {(['es', 'en'] as const).map((tab) => (
                <button className={language === tab ? 'font-semibold text-accent' : 'text-text-muted'} key={tab} onClick={() => setLanguage(tab)} type="button">
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
            <textarea
              className="min-h-24 w-full rounded border border-border-control bg-bg px-3 py-2"
              maxLength={maxLength}
              onChange={(event) => {
                updateLocalized(field, event.target.value);
                if (field === 'title' && language === 'es' && !slugEdited) {
                  updateField('slug', slugify(event.target.value));
                }
              }}
              required
              value={project[field][language]}
            />
            <span className="text-xs text-text-muted">{project[field][language].length}/{maxLength}</span>
          </fieldset>
        );
      })}
      <ImageUpload onChange={(imageUrl) => updateField('imageUrl', imageUrl)} value={project.imageUrl} />
      <label className="block text-sm" htmlFor="project-tech">
        Tecnologías
        <div className="mt-1 flex gap-2">
          <input className="w-full rounded border border-border-control bg-bg px-3 py-2" id="project-tech" maxLength={40} onChange={(event) => setTag(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addTag(); } }} value={tag} />
          <button onClick={addTag} type="button">Agregar</button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {project.techStack.map((item) => (
            <button className="rounded-full border border-border-control px-3 py-1 text-sm" key={item} onClick={() => updateField('techStack', project.techStack.filter((tagItem) => tagItem !== item))} type="button">
              {item} ×
            </button>
          ))}
        </div>
      </label>
      {(['repoUrl', 'liveUrl', 'videoUrl'] as const).map((field) => (
        <label className="block text-sm" htmlFor={`project-${field}`} key={field}>
          {field}
          <input className="mt-1 w-full rounded border border-border-control bg-bg px-3 py-2" id={`project-${field}`} onChange={(event) => updateField(field, event.target.value || null)} type="url" value={project[field] ?? ''} />
        </label>
      ))}
      <label className="block text-sm" htmlFor="project-order">
        Orden
        <input className="mt-1 w-full rounded border border-border-control bg-bg px-3 py-2" id="project-order" min={0} onChange={(event) => updateField('displayOrder', Number(event.target.value))} type="number" value={project.displayOrder} />
      </label>
      <label className="flex gap-2"><input checked={project.featured} onChange={(event) => updateField('featured', event.target.checked)} type="checkbox" /> Destacado</label>
      <label className="flex gap-2"><input checked={project.published} onChange={(event) => updateField('published', event.target.checked)} type="checkbox" /> Publicado</label>
      <section aria-label="Vista previa de Markdown" className="rounded border border-border p-4">
        <h3 className="font-semibold">Vista previa</h3>
        <ReactMarkdown skipHtml>{preview}</ReactMarkdown>
      </section>
      {error && <p className="text-sm text-red-500" role="alert">{error}</p>}
      <button className="rounded bg-accent px-4 py-2 text-bg" disabled={isSaving} type="submit">
        {isSaving ? 'Guardando...' : 'Guardar proyecto'}
      </button>
    </form>
  );
}
