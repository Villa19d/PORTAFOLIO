import { useRef, useState } from 'react';
import { uploadAdminProjectImage } from './cloudinaryUpload';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [manualUrl, setManualUrl] = useState(value);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.has(file.type)) {
      setError('Selecciona una imagen JPEG, PNG, WebP o AVIF.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('La imagen no puede superar los 5 MB.');
      return;
    }

    setError('');
    setIsUploading(true);
    try {
      const url = await uploadAdminProjectImage(file);
      setManualUrl(url);
      onChange(url);
    } catch {
      setError('No se pudo subir la imagen. Inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleManualUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextUrl = event.target.value;
    setManualUrl(nextUrl);
    if (nextUrl && !nextUrl.startsWith('https://')) {
      setError('La URL de imagen debe comenzar con https://.');
      return;
    }
    setError('');
    onChange(nextUrl);
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Imagen del proyecto</legend>
      <div className="flex flex-wrap items-center gap-3">
        <input
          accept=".jpg,.jpeg,.png,.webp,.avif"
          disabled={isUploading}
          onChange={handleFileChange}
          ref={inputRef}
          type="file"
        />
        {isUploading && <span aria-live="polite">Subiendo imagen...</span>}
      </div>
      <label className="block text-sm" htmlFor="project-image-url">
        URL segura alternativa
        <input
          className="mt-1 w-full rounded border border-border-control bg-bg px-3 py-2"
          id="project-image-url"
          onChange={handleManualUrlChange}
          placeholder="https://..."
          type="url"
          value={manualUrl}
        />
      </label>
      {error && <p className="text-sm text-red-500" role="alert">{error}</p>}
      {value && (
        <img
          alt="Vista previa de la imagen del proyecto"
          className="max-h-48 rounded border border-border object-contain"
          src={value}
        />
      )}
    </fieldset>
  );
}
