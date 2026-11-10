import { useRef, useState, type ChangeEvent } from 'react';
import { moveItem } from './adminListUtils';
import { uploadAdminProjectImage } from './cloudinaryUpload';
import type { MediaItem } from './features/projects/types';
import { parseYoutubeUrl } from './features/projects/utils/projectHelpers';

const MAX_IMAGES = 10;
const MAX_VIDEOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

interface MediaManagerProps {
  value: MediaItem[];
  onChange: (items: MediaItem[]) => void;
}

export default function MediaManager({ value, onChange }: MediaManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const imageCount = value.filter((item) => item.type === 'IMAGE').length;
  const videoCount = value.length - imageCount;

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (inputRef.current) inputRef.current.value = '';
    if (files.length === 0) return;

    const room = MAX_IMAGES - imageCount;
    if (files.length > room) {
      setError(`Solo caben ${room} imágenes más (máximo ${MAX_IMAGES}).`);
      return;
    }
    if (files.some((file) => !ACCEPTED_TYPES.has(file.type))) {
      setError('Selecciona imágenes JPEG, PNG, WebP o AVIF.');
      return;
    }
    if (files.some((file) => file.size > MAX_FILE_SIZE)) {
      setError('Cada imagen debe pesar 5 MB o menos.');
      return;
    }

    setError('');
    setIsUploading(true);
    let next = [...value];
    try {
      for (const file of files) {
        const url = await uploadAdminProjectImage(file);
        next = [...next, { type: 'IMAGE', url }];
        onChange(next);
      }
    } catch {
      setError('No se pudo subir una imagen. Las anteriores se conservaron.');
    } finally {
      setIsUploading(false);
    }
  }

  function addVideo() {
    const link = parseYoutubeUrl(videoUrl.trim());
    if (!link) {
      setError('Pega un enlace https de YouTube válido (watch, youtu.be o shorts).');
      return;
    }
    if (videoCount >= MAX_VIDEOS) {
      setError(`Máximo ${MAX_VIDEOS} videos.`);
      return;
    }
    const duplicate = value.some(
      (item) => item.type === 'YOUTUBE' && parseYoutubeUrl(item.url)?.videoId === link.videoId,
    );
    if (duplicate) {
      setError('Ese video ya está en la lista.');
      return;
    }
    setError('');
    setVideoUrl('');
    onChange([...value, { type: 'YOUTUBE', url: link.watchUrl }]);
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Galería (imágenes extra y videos)</legend>
      <p className="text-xs text-text-muted">
        La portada va arriba. Aquí el orden de la lista es el orden del modal.
        Imágenes {imageCount}/{MAX_IMAGES} · Videos {videoCount}/{MAX_VIDEOS}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <input
          accept=".jpg,.jpeg,.png,.webp,.avif"
          aria-label="Subir imágenes a la galería"
          disabled={isUploading || imageCount >= MAX_IMAGES}
          multiple
          onChange={handleFiles}
          ref={inputRef}
          type="file"
        />
        {isUploading && <span aria-live="polite">Subiendo imágenes...</span>}
      </div>

      <div className="flex gap-2">
        <input
          aria-label="Enlace de YouTube"
          className="w-full rounded border border-border-control bg-bg px-3 py-2"
          onChange={(event) => setVideoUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addVideo();
            }
          }}
          placeholder="https://www.youtube.com/watch?v=..."
          type="url"
          value={videoUrl}
        />
        <button disabled={isUploading || !videoUrl.trim()} onClick={addVideo} type="button">
          Agregar video
        </button>
      </div>

      {error && <p className="text-sm text-red-500" role="alert">{error}</p>}

      {value.length > 0 && (
        <ol className="space-y-2">
          {value.map((item, index) => {
            const link = item.type === 'YOUTUBE' ? parseYoutubeUrl(item.url) : undefined;
            const preview = link?.thumbnailUrl ?? item.url;
            return (
              <li
                className="flex items-center gap-3 rounded border border-border p-2"
                key={`${item.url}-${index}`}
              >
                <img alt="" className="h-14 w-24 rounded object-cover" height={56} src={preview} width={96} />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {item.type === 'YOUTUBE' ? '▶ Video' : 'Imagen'} {index + 1}
                </span>
                <button
                  aria-label={`Subir elemento ${index + 1}`}
                  disabled={index === 0 || isUploading}
                  onClick={() => onChange(moveItem(value, index, index - 1))}
                  type="button"
                >
                  ↑
                </button>
                <button
                  aria-label={`Bajar elemento ${index + 1}`}
                  disabled={index === value.length - 1 || isUploading}
                  onClick={() => onChange(moveItem(value, index, index + 1))}
                  type="button"
                >
                  ↓
                </button>
                <button
                  aria-label={`Quitar elemento ${index + 1}`}
                  disabled={isUploading}
                  onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
                  type="button"
                >
                  Quitar
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </fieldset>
  );
}