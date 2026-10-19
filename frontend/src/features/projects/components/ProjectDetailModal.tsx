import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import type { Project } from '../types';
import {
  buildImageSrcSet,
  getSafeExternalUrl,
  getLocalized,
  isCloudinaryImageUrl,
  isPlaceholderImageUrl,
} from '../utils/projectHelpers';
import { PlaceholderArt } from './PlaceholderArt';

const LazyMarkdown = lazy(() => import('react-markdown'));

interface ProjectDetailModalProps {
  project: Project;
  onClose: () => void;
}

function sanitizeMarkdownUrl(url: string): string | undefined {
  return getSafeExternalUrl(url);
}

interface SafeMarkdownLinkProps {
  href?: string;
  children?: ReactNode;
}

function SafeMarkdownLink({ href, children }: SafeMarkdownLinkProps) {
  const safeUrl = href ? sanitizeMarkdownUrl(href) : undefined;
  if (!safeUrl) {
    return <span>{children}</span>;
  }

  return (
    <a href={safeUrl} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  const { i18n, t } = useTranslation('common');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [failedImageUrl, setFailedImageUrl] = useState('');
  const title = getLocalized(project.title, i18n.language);
  const description = getLocalized(project.description, i18n.language);
  const showPlaceholder =
    isPlaceholderImageUrl(project.imageUrl) || failedImageUrl === project.imageUrl;
  const isCloudinaryImage = isCloudinaryImageUrl(project.imageUrl);
  const repoUrl = getSafeExternalUrl(project.repoUrl);
  const liveUrl = getSafeExternalUrl(project.liveUrl);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      closeButtonRef.current?.focus();
    }
    if (!dialog) {
      return;
    }
    const closeOnBackdropClick = (event: MouseEvent) => {
      if (event.target === dialog) {
        dialog.close();
      }
    };
    dialog.addEventListener('click', closeOnBackdropClick);
    return () => dialog.removeEventListener('click', closeOnBackdropClick);
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="project-detail-modal"
      aria-labelledby="project-detail-title"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        dialogRef.current?.close();
      }}
    >
      <motion.div
        className="project-detail-modal__panel"
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
      >
        <div className="project-detail-modal__scroll" data-lenis-prevent="true">
          <button
            ref={closeButtonRef}
            className="project-detail-modal__close"
            type="button"
            aria-label={t('projects.closeDetails')}
            onClick={() => dialogRef.current?.close()}
          >
            <span aria-hidden="true">×</span>
          </button>

          <div className="project-detail-modal__media">
            {showPlaceholder ? (
              <PlaceholderArt slug={project.slug} title={title} />
            ) : (
              <img
                className="project-detail-modal__image"
                src={project.imageUrl}
                srcSet={isCloudinaryImage ? buildImageSrcSet(project.imageUrl) : undefined}
                sizes="(min-width: 768px) 720px, 100vw"
                width={800}
                height={500}
                alt={t('projects.imageAlt', { title })}
                decoding="async"
                onError={() => setFailedImageUrl(project.imageUrl)}
              />
            )}
          </div>

          <div className="project-detail-modal__content">
            <h2 id="project-detail-title" className="project-detail-modal__title">
              {title}
            </h2>

            <ul className="project-card__technologies" aria-label={t('projects.technologies')}>
              {project.techStack.map((technology) => (
                <li className="project-card__technology" key={technology}>
                  {technology}
                </li>
              ))}
            </ul>

            <div className="project-detail-modal__actions">
              {repoUrl && (
                <a
                  className="project-card__action project-card__action--primary"
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('projects.code')}
                </a>
              )}
              {liveUrl && (
                <a
                  className="project-card__action project-card__action--secondary"
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('projects.demo')}
                </a>
              )}
            </div>

            <div className="project-detail-modal__markdown">
              <Suspense fallback={<p>{t('projects.loadingDetails')}</p>}>
                <LazyMarkdown
                  skipHtml
                  urlTransform={sanitizeMarkdownUrl}
                  components={{ a: SafeMarkdownLink }}
                >
                  {description}
                </LazyMarkdown>
              </Suspense>
            </div>
          </div>
        </div>
      </motion.div>
    </dialog>
  );
}
