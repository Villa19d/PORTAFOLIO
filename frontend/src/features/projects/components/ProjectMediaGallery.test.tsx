import { fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '../../../lib/i18n';
import type { GalleryItem } from '../utils/projectHelpers';
import { ProjectMediaGallery } from './ProjectMediaGallery';

const image = (n: number): GalleryItem => ({ kind: 'image', url: `https://images.test/${n}.webp` });
const youtube = (id: string): GalleryItem => ({
  kind: 'youtube',
  url: `https://youtu.be/${id}`,
  videoId: id,
  embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1&autoplay=1`,
  thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  watchUrl: `https://www.youtube.com/watch?v=${id}`,
});

function renderGallery(items: GalleryItem[]) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ProjectMediaGallery items={items} slug="demo" title="Proyecto" />
    </I18nextProvider>,
  );
}

describe('ProjectMediaGallery', () => {
  beforeEach(() => {
    void i18n.changeLanguage('es');
  });

  it('shows no controls when there is a single item', () => {
    renderGallery([image(1)]);

    expect(screen.queryByRole('button', { name: 'Elemento siguiente' })).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Miniaturas de la galería' })).not.toBeInTheDocument();
  });

  it('wraps around with the arrows and jumps with the thumbnails', () => {
    renderGallery([image(1), image(2), image(3)]);

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Elemento siguiente' }));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Elemento anterior' }));
    fireEvent.click(screen.getByRole('button', { name: 'Elemento anterior' }));
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ver imagen 1 de 3' }));
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver imagen 1 de 3' })).toHaveAttribute('aria-current', 'true');
  });

  it('navigates with the arrow keys', () => {
    renderGallery([image(1), image(2)]);
    const gallery = screen.getByRole('region', { name: 'Galería del proyecto' });

    fireEvent.keyDown(gallery, { key: 'ArrowRight' });
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    fireEvent.keyDown(gallery, { key: 'ArrowLeft' });
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('mounts at most one YouTube iframe, and only after the facade is clicked', () => {
    renderGallery([image(1), youtube('abc123_DEF'), youtube('xyz789_GHI')]);

    fireEvent.click(screen.getByRole('button', { name: 'Ver video 2 de 3' }));
    expect(document.querySelectorAll('iframe')).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Reproducir video de Proyecto' }));
    expect(document.querySelectorAll('iframe')).toHaveLength(1);
    expect(document.querySelector('iframe')?.getAttribute('src')).toContain('abc123_DEF');

    fireEvent.click(screen.getByRole('button', { name: 'Ver video 3 de 3' }));
    expect(document.querySelectorAll('iframe')).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Reproducir video de Proyecto' }));
    expect(document.querySelectorAll('iframe')).toHaveLength(1);
    expect(document.querySelector('iframe')?.getAttribute('src')).toContain('xyz789_GHI');
  });
});