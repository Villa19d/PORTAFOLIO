import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  buildImageSrcSet,
  isCloudinaryImageUrl,
  isPlaceholderImageUrl,
  type GalleryItem,
} from '../utils/projectHelpers';
import { PlaceholderArt } from './PlaceholderArt';

interface ProjectMediaGalleryProps {
  items: GalleryItem[];
  slug: string;
  title: string;
}

export function ProjectMediaGallery({ items, slug, title }: ProjectMediaGalleryProps) {
  const { t } = useTranslation('common');
  const rootRef = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [failedUrls, setFailedUrls] = useState<ReadonlySet<string>>(() => new Set());
  const total = items.length;
  const safeIndex = Math.min(index, Math.max(total - 1, 0));
  const current = items[safeIndex];

  const step = useCallback(
    (delta: number) => {
      setIndex((value) => (value + delta + total) % total);
      setIsPlaying(false);
    },
    [total],
  );

  const goTo = (next: number) => {
    setIndex(next);
    setIsPlaying(false);
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root || total < 2) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        return;
      }
      event.preventDefault();
      step(event.key === 'ArrowRight' ? 1 : -1);
    };
    root.addEventListener('keydown', onKeyDown);
    return () => root.removeEventListener('keydown', onKeyDown);
  }, [total, step]);

  if (!current) {
    return null;
  }

  const markFailed = (url: string) =>
    setFailedUrls((previous) => new Set(previous).add(url));

  const isBroken = (url: string) => isPlaceholderImageUrl(url) || failedUrls.has(url);

  const imageAlt =
    total === 1
      ? t('projects.imageAlt', { title })
      : t('projects.gallery.imageAlt', { title, current: safeIndex + 1, total });

  return (
    <section ref={rootRef} className="project-gallery" aria-label={t('projects.gallery.label')}>
      <div className="project-detail-modal__media">
        <div key={safeIndex} className="project-gallery__slide">
          {current.kind === 'youtube' ? (
            isPlaying ? (
              <iframe
                className="project-detail-modal__video"
                src={current.embedUrl}
                title={t('projects.videoTitle', { title })}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <>
                {failedUrls.has(current.thumbnailUrl) ? (
                  <PlaceholderArt slug={slug} title={title} />
                ) : (
                  <img
                    className="project-detail-modal__image"
                    src={current.thumbnailUrl}
                    alt=""
                    width={800}
                    height={500}
                    decoding="async"
                    onError={() => markFailed(current.thumbnailUrl)}
                  />
                )}
                <button
                  className="project-detail-modal__play"
                  type="button"
                  aria-label={t('projects.playVideo', { title })}
                  onClick={() => setIsPlaying(true)}
                >
                  <span aria-hidden="true">▶</span>
                </button>
              </>
            )
          ) : isBroken(current.url) ? (
            <PlaceholderArt slug={slug} title={title} />
          ) : (
            <img
              className="project-detail-modal__image"
              src={current.url}
              srcSet={isCloudinaryImageUrl(current.url) ? buildImageSrcSet(current.url) : undefined}
              sizes="(min-width: 768px) 720px, 100vw"
              width={800}
              height={500}
              alt={imageAlt}
              decoding="async"
              onError={() => markFailed(current.url)}
            />
          )}
        </div>

        {total > 1 && (
          <>
            <button
              className="project-gallery__nav project-gallery__nav--prev"
              type="button"
              aria-label={t('projects.gallery.previous')}
              onClick={() => step(-1)}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              className="project-gallery__nav project-gallery__nav--next"
              type="button"
              aria-label={t('projects.gallery.next')}
              onClick={() => step(1)}
            >
              <span aria-hidden="true">›</span>
            </button>
            <span className="project-gallery__counter" aria-live="polite" aria-atomic="true">
              {safeIndex + 1} / {total}
            </span>
          </>
        )}
      </div>

      {current.kind === 'youtube' && (
        <a
          className="project-detail-modal__video-link"
          href={current.watchUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('projects.openVideo')}
        </a>
      )}

      {total > 1 && (
        <ul className="project-gallery__strip" aria-label={t('projects.gallery.thumbnails')}>
          {items.map((item, itemIndex) => (
            <li key={`${item.url}-${itemIndex}`}>
              <button
                className="project-gallery__thumb"
                type="button"
                aria-current={itemIndex === safeIndex ? 'true' : undefined}
                aria-label={
                  item.kind === 'youtube'
                    ? t('projects.gallery.goToVideo', { current: itemIndex + 1, total })
                    : t('projects.gallery.goToImage', { current: itemIndex + 1, total })
                }
                onClick={() => goTo(itemIndex)}
              >
                {item.kind === 'youtube' ? (
                  <>
                    <img
                      src={item.thumbnailUrl}
                      alt=""
                      width={88}
                      height={55}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="project-gallery__thumb-badge" aria-hidden="true">▶</span>
                  </>
                ) : isBroken(item.url) ? (
                  <PlaceholderArt slug={slug} title={title} />
                ) : (
                  <img
                    src={item.url}
                    srcSet={isCloudinaryImageUrl(item.url) ? buildImageSrcSet(item.url) : undefined}
                    sizes="88px"
                    alt=""
                    width={88}
                    height={55}
                    loading="lazy"
                    decoding="async"
                    onError={() => markFailed(item.url)}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}