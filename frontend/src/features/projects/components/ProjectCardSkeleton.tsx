interface ProjectCardSkeletonProps {
  label: string;
}

export function ProjectCardSkeleton({ label }: ProjectCardSkeletonProps) {
  return (
    <article className="project-card project-card--skeleton" aria-label={label}>
      <div className="project-card__media project-skeleton__media">
        <span className="project-skeleton__block project-skeleton__image" aria-hidden="true" />
      </div>
      <div className="project-card__body">
        <span className="project-skeleton__block project-skeleton__title" aria-hidden="true" />
        <span className="project-skeleton__block project-skeleton__summary" aria-hidden="true" />
        <span className="project-skeleton__block project-skeleton__technologies" aria-hidden="true" />
        <span className="project-skeleton__actions" aria-hidden="true">
          <span className="project-skeleton__block project-skeleton__action" />
          <span className="project-skeleton__block project-skeleton__action" />
        </span>
      </div>
    </article>
  );
}
