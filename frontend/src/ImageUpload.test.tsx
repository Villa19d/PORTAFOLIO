import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ImageUpload from './ImageUpload';

describe('ImageUpload', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('obtains a signature, uploads the file, and assigns secure_url', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            cloudName: 'demo',
            apiKey: 'key',
            timestamp: 123,
            folder: 'portfolio/projects',
            uploadPreset: 'signed',
            signature: 'signature',
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ secure_url: 'https://res.cloudinary.com/demo/image/upload/project.webp' }), {
          status: 200,
        }),
      );
    const onChange = vi.fn();
    const file = new File(['image'], 'project.webp', { type: 'image/webp' });

    render(<ImageUpload onChange={onChange} value="" />);
    fireEvent.change(screen.getByRole('group').querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(
      'https://res.cloudinary.com/demo/image/upload/project.webp',
    ));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toContain('api.cloudinary.com/v1_1/demo/image/upload');
    expect(fetchMock.mock.calls[1]?.[1]?.body).toBeInstanceOf(FormData);
  });

  it.each([
    ['image/gif', 'image.gif', 'Selecciona una imagen JPEG, PNG, WebP o AVIF.'],
    ['application/pdf', 'document.pdf', 'Selecciona una imagen JPEG, PNG, WebP o AVIF.'],
  ])('rejects unsupported MIME type %s', (type, name, message) => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const file = new File(['file'], name, { type });

    render(<ImageUpload onChange={vi.fn()} value="" />);
    fireEvent.change(screen.getByRole('group').querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    });

    expect(screen.getByRole('alert')).toHaveTextContent(message);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects files larger than 5 MB before upload', () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', {
      type: 'image/png',
    });

    render(<ImageUpload onChange={vi.fn()} value="" />);
    fireEvent.change(screen.getByRole('group').querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('La imagen no puede superar los 5 MB.');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
