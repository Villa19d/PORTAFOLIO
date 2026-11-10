import { moveItem } from './adminListUtils';
import type { RepoItem } from './features/projects/types';

const MAX_REPOS = 5;

interface RepoManagerProps {
  value: RepoItem[];
  onChange: (items: RepoItem[]) => void;
}

export default function RepoManager({ value, onChange }: RepoManagerProps) {
  function update(index: number, patch: Partial<RepoItem>) {
    onChange(value.map((repo, repoIndex) => (repoIndex === index ? { ...repo, ...patch } : repo)));
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Repositorios</legend>
      <p className="text-xs text-text-muted">
        El primero es el principal. La etiqueta es opcional (por ejemplo, Frontend o Backend).
      </p>
      {value.map((repo, index) => (
        <div className="flex flex-wrap items-center gap-2" key={index}>
          <input
            aria-label={`Etiqueta del repositorio ${index + 1}`}
            className="w-32 rounded border border-border-control bg-bg px-3 py-2"
            maxLength={30}
            onChange={(event) => update(index, { label: event.target.value })}
            placeholder="Etiqueta"
            value={repo.label ?? ''}
          />
          <input
            aria-label={`URL del repositorio ${index + 1}`}
            className="min-w-0 flex-1 rounded border border-border-control bg-bg px-3 py-2"
            onChange={(event) => update(index, { url: event.target.value })}
            placeholder="https://github.com/..."
            type="url"
            value={repo.url}
          />
          <button
            aria-label={`Subir repositorio ${index + 1}`}
            disabled={index === 0}
            onClick={() => onChange(moveItem(value, index, index - 1))}
            type="button"
          >
            ↑
          </button>
          <button
            aria-label={`Bajar repositorio ${index + 1}`}
            disabled={index === value.length - 1}
            onClick={() => onChange(moveItem(value, index, index + 1))}
            type="button"
          >
            ↓
          </button>
          <button
            aria-label={`Quitar repositorio ${index + 1}`}
            onClick={() => onChange(value.filter((_, repoIndex) => repoIndex !== index))}
            type="button"
          >
            Quitar
          </button>
        </div>
      ))}
      <button
        disabled={value.length >= MAX_REPOS}
        onClick={() => onChange([...value, { label: '', url: '' }])}
        type="button"
      >
        Agregar repositorio
      </button>
    </fieldset>
  );
}