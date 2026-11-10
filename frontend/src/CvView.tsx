import { useRef, useState } from 'react';
import type { CvDocument, CvLang } from './adminCvApi';
import { uploadAdminCv } from './cloudinaryUpload';
import { useAdminCv, useDeleteAdminCv, useSaveAdminCv } from './useAdminCv';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const CV_LANGS: CvLang[] = ['es', 'en'];
const langLabels: Record<CvLang, string> = { en: 'English', es: 'Español' };

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function CvCard({ lang, cvDocument }: { lang: CvLang; cvDocument: CvDocument | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const saveMutation = useSaveAdminCv();
  const deleteMutation = useDeleteAdminCv();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const isBusy = saveMutation.isPending || deleteMutation.isPending;
  const label = langLabels[lang];

  function resetInput() {
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setStatus('');
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (file.type !== 'application/pdf') {
      setError('El archivo debe ser un PDF.');
      setSelectedFile(null);
      resetInput();
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('El PDF no puede superar los 5 MB.');
      setSelectedFile(null);
      resetInput();
      return;
    }
    setError('');
    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setError('');
    setStatus('');
    try {
      const url = await uploadAdminCv(selectedFile);
      await saveMutation.mutateAsync({ lang, cvDocument: { url, fileName: selectedFile.name } });
      setStatus('Currículum actualizado.');
    } catch {
      setError('No se pudo subir el currículum. Inténtalo de nuevo.');
    } finally {
      setSelectedFile(null);
      resetInput();
    }
  }

  async function handleRemove() {
    if (!window.confirm('¿Quitar este currículum del sitio?')) return;
    setError('');
    setStatus('');
    try {
      await deleteMutation.mutateAsync(lang);
      setStatus('Currículum desvinculado.');
    } catch {
      setError('No se pudo quitar el currículum.');
    }
  }

  return (
    <article aria-labelledby={`cv-${lang}-title`} className="rounded-lg border border-border bg-surface p-5">
      <h2 className="font-semibold" id={`cv-${lang}-title`}>{label}</h2>

      {cvDocument ? (
        <div className="mt-2 space-y-1 text-sm">
          <p className="break-all">{cvDocument.fileName}</p>
          <p className="text-text-muted">
            Actualizado:{' '}
            <time dateTime={cvDocument.updatedAt}>{formatUpdatedAt(cvDocument.updatedAt)}</time>
          </p>
          <a className="text-accent hover:underline" href={cvDocument.url} rel="noopener noreferrer" target="_blank">
            Ver
          </a>
        </div>
      ) : (
        <p className="mt-2 text-sm text-text-muted">Sin archivo</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          accept=".pdf,application/pdf"
          aria-label={`Archivo PDF (${label})`}
          disabled={isBusy}
          onChange={handleFileChange}
          ref={inputRef}
          type="file"
        />
        <button
          className="rounded bg-accent px-4 py-2 text-bg disabled:opacity-50"
          disabled={!selectedFile || isBusy}
          onClick={() => void handleUpload()}
          type="button"
        >
          {cvDocument ? 'Reemplazar' : 'Subir'}
        </button>
        <button
          className="rounded-md border border-border-control px-3 py-2 text-sm disabled:opacity-50"
          disabled={!cvDocument || isBusy}
          onClick={() => void handleRemove()}
          type="button"
        >
          Quitar
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-500" role="alert">{error}</p>}
      <p aria-live="polite" className="mt-2 text-sm text-text-muted">{isBusy ? 'Procesando...' : status}</p>
    </article>
  );
}

export default function CvView() {
  const cvQuery = useAdminCv();

  return (
    <section aria-labelledby="cv-title" className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold" id="cv-title">Currículum</h1>
        <p className="mt-2 text-text-muted">Sube el PDF del currículum para cada idioma.</p>
      </div>

      <p className="rounded-md border border-border bg-surface p-4 text-sm text-text-muted">
        Quitar solo desvincula el CV del sitio; el archivo permanece en Cloudinary.
      </p>

      {cvQuery.isLoading && <p aria-live="polite" className="text-text-muted">Cargando currículum...</p>}
      {cvQuery.isError && (
        <p className="rounded-md border border-red-500/50 p-4 text-red-600" role="alert">
          No se pudo cargar el currículum.
        </p>
      )}

      {cvQuery.data && (
        <div className="grid gap-6 md:grid-cols-2">
          {CV_LANGS.map((lang) => (
            <CvCard key={lang} cvDocument={cvQuery.data[lang]} lang={lang} />
          ))}
        </div>
      )}
    </section>
  );
}
