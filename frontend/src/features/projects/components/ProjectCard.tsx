import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TiltSurface } from '../../../components/ui/TiltSurface';
import { useCapabilities } from '../../../hooks/useCapabilities';
import type { Project } from '../types';
import {
  buildImageSrcSet,
  getSafeExternalUrl,
  getLocalized,
  isCloudinaryImageUrl,
  isPlaceholderImageUrl,
} from '../utils/projectHelpers';
import { PlaceholderArt } from './PlaceholderArt';
import { ProjectDetailModal } from './ProjectDetailModal';

interface ProjectCardProps {
  project: Project;
  isActive?: boolean;
}

export function ProjectCard({ project, isActive = true }: ProjectCardProps) {
  const { i18n, t } = useTranslation('common');
  const { canUseHeavyEffects } = useCapabilities();
  const detailsTriggerRef = useRef<HTMLButtonElement>(null);
  const title = getLocalized(project.title, i18n.language);
  const summary = getLocalized(project.summary, i18n.language);
  const [failedImageUrl, setFailedImageUrl] = useState('');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const showPlaceholder =
    isPlaceholderImageUrl(project.imageUrl) || failedImageUrl === project.imageUrl;
  const isCloudinaryImage = isCloudinaryImageUrl(project.imageUrl);
  const visibleTechnologies = project.techStack.slice(0, 5);
  const remainingTechnologies = Math.max(0, project.techStack.length - visibleTechnologies.length);
  const linkTabIndex = isActive ? undefined : -1;
  const repoUrl = getSafeExternalUrl(project.repoUrl);
  const liveUrl = getSafeExternalUrl(project.liveUrl);
  const cardContent = (
    <>
      <div className="project-card__media">
        {showPlaceholder ? (
          <PlaceholderArt slug={project.slug} title={title} />
        ) : (
          <img
            className="project-card__image"
            src={project.imageUrl}
            srcSet={isCloudinaryImage ? buildImageSrcSet(project.imageUrl) : undefined}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            width={800}
            height={500}
            alt={t('projects.imageAlt', { title })}
            loading="lazy"
            decoding="async"
            onError={() => setFailedImageUrl(project.imageUrl)}
          />
        )}
      </div>

      <div className="project-card__body">
        <h3 className="project-card__title" title={title}>
          {title}
        </h3>
        <p className="project-card__summary">{summary}</p>

        <ul className="project-card__technologies" aria-label={t('projects.technologies')}>
          {visibleTechnologies.map((technology) => (
            <li className="project-card__technology" key={technology} title={technology}>
              {technology}
            </li>
          ))}
          {remainingTechnologies > 0 && (
            <li
              className="project-card__technology project-card__technology--more"
              aria-label={t('projects.moreTechnologies', { count: remainingTechnologies })}
              title={t('projects.moreTechnologies', { count: remainingTechnologies })}
            >
              +{remainingTechnologies}
            </li>
          )}
        </ul>

        <div className="project-card__actions">
          {repoUrl && (
            <a
              className="project-card__action project-card__action--primary"
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={linkTabIndex}
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
              tabIndex={linkTabIndex}
            >
              {t('projects.demo')}
            </a>
          )}
          {isActive && (
            <button
              ref={detailsTriggerRef}
              className="project-card__action project-card__action--details"
              type="button"
              onClick={() => setIsDetailOpen(true)}
            >
              {t('projects.viewDetails')}
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      <article className="project-card">
        {isActive && canUseHeavyEffects ? (
          <TiltSurface>{cardContent}</TiltSurface>
        ) : (
          cardContent
        )}
      </article>
      {isDetailOpen && (
        <ProjectDetailModal
          project={project}
          onClose={() => {
            setIsDetailOpen(false);
            detailsTriggerRef.current?.focus();
          }}
        />
      )}
    </>
  );
}
