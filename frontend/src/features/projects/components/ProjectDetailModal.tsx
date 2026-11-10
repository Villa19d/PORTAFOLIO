import { lazy, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { m, useReducedMotion, type Variants } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useCapabilities } from '../../../hooks/useCapabilities';
import type { Project } from '../types';
import {
  getLocalized,
  getProjectGallery,
  getProjectRepos,
  getSafeExternalUrl,
} from '../utils/projectHelpers';
import { ProjectMediaGallery } from './ProjectMediaGallery';

const LazyMarkdown = lazy(() => import('react-markdown'));

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.3, 0, 0, 1] } },
};

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
  const { canUseHeavyEffects } = useCapabilities();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const animated = !prefersReducedMotion && canUseHeavyEffects;
  const title = getLocalized(project.title, i18n.language);
  const summary = getLocalized(project.summary, i18n.language);
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
        initial={animated ? { opacity: 0, y: 20, scale: 0.98 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: animated ? 0.32 : 0, ease: [0.3, 0, 0, 1] }}
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

          <m.div
            className="project-detail-modal__layout"
            variants={containerVariants}
            initial={animated ? 'hidden' : false}
            animate="show"
          >
            <m.div className="project-detail-modal__gallery" variants={itemVariants}>
              <ProjectMediaGallery items={gallery} slug={project.slug} title={title} />
            </m.div>

            <div className="project-detail-modal__info">
              <m.p className="project-detail-modal__eyebrow" variants={itemVariants}>
                {project.featured ? t('projects.detail.featured') : t('projects.detail.project')}
              </m.p>

              <m.h2
                id="project-detail-title"
                className="project-detail-modal__title"
                variants={itemVariants}
              >
                {title}
              </m.h2>

              <m.p className="project-detail-modal__summary" variants={itemVariants}>
                {summary}
              </m.p>

              <m.div variants={itemVariants}>
                <p className="project-detail-modal__label">{t('projects.detail.stack')}</p>
                <ul className="project-card__technologies" aria-label={t('projects.technologies')}>
                  {project.techStack.map((technology) => (
                    <li className="project-card__technology" key={technology}>
                      {technology}
                    </li>
                  ))}
                </ul>
              </m.div>

              <m.div className="project-detail-modal__actions" variants={itemVariants}>
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
              </m.div>
            </div>

            <m.section className="project-detail-modal__about" variants={itemVariants}>
              <h3 className="project-detail-modal__label">{t('projects.detail.about')}</h3>
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
            </m.section>
          </m.div>
        </div>
      </m.div>
    </dialog>
  );
}