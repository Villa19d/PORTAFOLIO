import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CvState } from './adminCvApi';
import CvView from './CvView';

const mocks = vi.hoisted(() => ({
  useAdminCv: vi.fn(),
  useDeleteAdminCv: vi.fn(),
  useSaveAdminCv: vi.fn(),
}));

vi.mock('./useAdminCv', () => mocks);

const esDocument = {
  fileName: 'cv-rodrigo.pdf',
  updatedAt: '2026-10-24T18:00:00Z',
  url: 'https://res.cloudinary.com/demo/raw/upload/v1/portfolio/cv/cv.pdf',
};

function state(overrides: Partial<CvState> = {}): CvState {
  return { en: null, es: null, ...overrides };
}

function pickFile(label: string, file: File) {
  fireEvent.change(screen.getByLabelText(label), { target: { files: [file] } });
}

describe('CvView', () => {
  let saveMutate: ReturnType<typeof vi.fn>;
  let deleteMutate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    saveMutate = vi.fn().mockResolvedValue(undefined);
    deleteMutate = vi.fn().mockResolvedValue(undefined);
    mocks.useSaveAdminCv.mockReturnValue({ isPending: false, mutateAsync: saveMutate });
    mocks.useDeleteAdminCv.mockReturnValue({ isPending: false, mutateAsync: deleteMutate });
    mocks.useAdminCv.mockReturnValue({ data: state(), isError: false, isLoading: false });
  });

  it('renders the loaded and empty states for both languages', () => {
    mocks.useAdminCv.mockReturnValue({ data: state({ es: esDocument }), isError: false, isLoading: false });
    render(<CvView />);

    expect(screen.getByText('cv-rodrigo.pdf')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver' })).toHaveAttribute('href', esDocument.url);
    expect(screen.getByText('Sin archivo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reemplazar' })).toBeInTheDocument();
  });

  it.each([
    ['application/zip', 'cv.zip', 'El archivo debe ser un PDF.'],
    ['text/plain', 'notes.txt', 'El archivo debe ser un PDF.'],
  ])('rejects non-PDF %s without any network call', (type, name, message) => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    render(<CvView />);

    pickFile('Archivo PDF (Español)', new File(['x'], name, { type }));

    expect(screen.getByRole('alert')).toHaveTextContent(message);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects PDFs larger than 5 MB before upload', () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    render(<CvView />);

    pickFile(
      'Archivo PDF (Español)',
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.pdf', { type: 'application/pdf' }),
    );

    expect(screen.getByRole('alert')).toHaveTextContent('El PDF no puede superar los 5 MB.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uploads in order: signature, Cloudinary raw, then PUT', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            apiKey: 'key',
            cloudName: 'demo',
            folder: 'portfolio/cv',
            signature: 'signature',
            timestamp: 123,
            uploadPreset: 'signed',
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            secure_url: 'https://res.cloudinary.com/demo/raw/upload/v1/portfolio/cv/cv.pdf',
          }),
          { status: 200 },
        ),
      );
    const user = userEvent.setup();
    render(<CvView />);

    pickFile('Archivo PDF (Español)', new File(['pdf'], 'cv.pdf', { type: 'application/pdf' }));
    await user.click(screen.getAllByRole('button', { name: 'Subir' })[0]!);

    await waitFor(() =>
      expect(saveMutate).toHaveBeenCalledWith({
        cvDocument: {
          fileName: 'cv.pdf',
          url: 'https://res.cloudinary.com/demo/raw/upload/v1/portfolio/cv/cv.pdf',
        },
        lang: 'es',
      }),
    );
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/api/admin/uploads/sign-document');
    expect(fetchMock.mock.calls[1]?.[0]).toContain('api.cloudinary.com/v1_1/demo/raw/upload');
    expect(fetchMock.mock.invocationCallOrder[1]).toBeLessThan(saveMutate.mock.invocationCallOrder[0]!);
  });

  it('removes the document after confirmation', async () => {
    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);
    mocks.useAdminCv.mockReturnValue({ data: state({ es: esDocument }), isError: false, isLoading: false });
    const user = userEvent.setup();
    render(<CvView />);

    await user.click(screen.getAllByRole('button', { name: 'Quitar' })[0]!);

    expect(confirmMock).toHaveBeenCalled();
    expect(deleteMutate).toHaveBeenCalledWith('es');
  });

  it('does not remove when confirmation is dismissed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    mocks.useAdminCv.mockReturnValue({ data: state({ es: esDocument }), isError: false, isLoading: false });
    const user = userEvent.setup();
    render(<CvView />);

    await user.click(screen.getAllByRole('button', { name: 'Quitar' })[0]!);

    expect(deleteMutate).not.toHaveBeenCalled();
  });
});
