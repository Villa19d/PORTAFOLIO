import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MediaManager from './MediaManager';
import * as upload from './cloudinaryUpload';

describe('MediaManager', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('adds a normalised YouTube link and rejects other hosts and duplicates', () => {
    const onChange = vi.fn();
    const { rerender } = render(<MediaManager onChange={onChange} value={[]} />);
    const input = screen.getByLabelText('Enlace de YouTube');

    fireEvent.change(input, { target: { value: 'https://vimeo.com/123456789' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar video' }));
    expect(screen.getByRole('alert')).toHaveTextContent('YouTube válido');
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: 'https://youtu.be/abc123_DEF' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar video' }));
    expect(onChange).toHaveBeenCalledWith([
      { type: 'YOUTUBE', url: 'https://www.youtube.com/watch?v=abc123_DEF' },
    ]);

    rerender(
      <MediaManager
        onChange={onChange}
        value={[{ type: 'YOUTUBE', url: 'https://www.youtube.com/watch?v=abc123_DEF' }]}
      />,
    );
    fireEvent.change(screen.getByLabelText('Enlace de YouTube'), {
      target: { value: 'https://www.youtube.com/watch?v=abc123_DEF' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar video' }));
    expect(screen.getByRole('alert')).toHaveTextContent('ya está');
  });

  it('reorders and removes items', () => {
    const onChange = vi.fn();
    const value = [
      { type: 'IMAGE' as const, url: 'https://images.test/1.webp' },
      { type: 'IMAGE' as const, url: 'https://images.test/2.webp' },
    ];
    render(<MediaManager onChange={onChange} value={value} />);

    fireEvent.click(screen.getByRole('button', { name: 'Bajar elemento 1' }));
    expect(onChange).toHaveBeenLastCalledWith([value[1], value[0]]);
    fireEvent.click(screen.getByRole('button', { name: 'Quitar elemento 2' }));
    expect(onChange).toHaveBeenLastCalledWith([value[0]]);
    expect(screen.getByRole('button', { name: 'Subir elemento 1' })).toBeDisabled();
  });

  it('uploads several images in order and rejects when the limit would be exceeded', async () => {
    const uploadSpy = vi
      .spyOn(upload, 'uploadAdminProjectImage')
      .mockResolvedValueOnce('https://res.cloudinary.com/x/image/upload/a.webp')
      .mockResolvedValueOnce('https://res.cloudinary.com/x/image/upload/b.webp');
    const onChange = vi.fn();
    render(<MediaManager onChange={onChange} value={[]} />);
    const files = [
      new File(['a'], 'a.webp', { type: 'image/webp' }),
      new File(['b'], 'b.webp', { type: 'image/webp' }),
    ];

    fireEvent.change(screen.getByLabelText('Subir imágenes a la galería'), { target: { files } });

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(2));
    expect(uploadSpy).toHaveBeenCalledTimes(2);
    expect(onChange.mock.calls[1]?.[0]).toEqual([
      { type: 'IMAGE', url: 'https://res.cloudinary.com/x/image/upload/a.webp' },
      { type: 'IMAGE', url: 'https://res.cloudinary.com/x/image/upload/b.webp' },
    ]);
  });

  it('refuses files that would exceed the 10 image limit without uploading', () => {
    const uploadSpy = vi.spyOn(upload, 'uploadAdminProjectImage');
    const full = Array.from({ length: 10 }, (_, n) => ({
      type: 'IMAGE' as const,
      url: `https://images.test/${n}.webp`,
    }));
    render(<MediaManager onChange={vi.fn()} value={full.slice(0, 9)} />);

    fireEvent.change(screen.getByLabelText('Subir imágenes a la galería'), {
      target: {
        files: [
          new File(['a'], 'a.webp', { type: 'image/webp' }),
          new File(['b'], 'b.webp', { type: 'image/webp' }),
        ],
      },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Solo caben 1');
    expect(uploadSpy).not.toHaveBeenCalled();
  });
});