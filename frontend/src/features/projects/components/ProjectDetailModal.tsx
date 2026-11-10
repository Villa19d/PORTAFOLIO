import { lazy, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import type { Project } from '../types';
import {
  getLocalized,
  getProjectGallery,
  getProjectRepos,
  getSafeExternalUrl,
} from '../utils/projectHelpers';
import { ProjectMediaGallery } from './ProjectMediaGallery';

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
  const title = getLocalized(project.title, i18n.language);
  const description = getLocalized(project.description, i18n.language);
  const gallery = useMemo(() => getProjectGallery(project), [project]);
  const repos = useMemo(() => getProjectRepos(project), [project]);
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
      <m.div
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

          <ProjectMediaGallery items={gallery} slug={project.slug} title={title} />

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
              {repos.map((repo, repoIndex) => (
                <a
                  className={`project-card__action ${
                    repoIndex === 0
                      ? 'project-card__action--primary'
                      : 'project-card__action--secondary'
                  }`}
                  href={repo.url}
                  key={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {repo.label ?? t('projects.code')}
                </a>
              ))}
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
      </m.div>
    </dialog>
  );
}