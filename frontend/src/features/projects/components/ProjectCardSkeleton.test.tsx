import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProjectCardSkeleton } from './ProjectCardSkeleton';

describe('ProjectCardSkeleton', () => {
  it('renders all fixed card regions needed to reserve card geometry', () => {
    const { container } = render(<ProjectCardSkeleton label="Loading project" />);

    expect(screen.getByRole('article', { name: 'Loading project' })).toBeInTheDocument();
    expect(container.querySelector('.project-skeleton__image')).toBeInTheDocument();
    expect(container.querySelector('.project-skeleton__title')).toBeInTheDocument();
    expect(container.querySelector('.project-skeleton__summary')).toBeInTheDocument();
    expect(container.querySelector('.project-skeleton__technologies')).toBeInTheDocument();
    expect(container.querySelectorAll('.project-skeleton__action')).toHaveLength(2);
  });
});
