import { fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../lib/i18n';
import * as capabilitiesModule from '../../hooks/useCapabilities';
import CvModal from './CvModal';
import type { CvState } from './useCv';

const esDocument = {
  fileName: 'cv-es.pdf',
  updatedAt: '2026-10-24T18:00:00Z',
  url: 'https://res.cloudinary.com/demo/raw/upload/v1/portfolio/cv/cv-es.pdf',
};

const enDocument = {
  fileName: 'cv-en.pdf',
  updatedAt: '2026-10-24T18:00:00Z',
  url: 'https://res.cloudinary.com/demo/raw/upload/v1/portfolio/cv/cv-en.pdf',
};

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');
let restoreCapabilities: (() => void) | undefined;

function mockCapabilities(isDesktopLayout: boolean) {
  const spy = vi.spyOn(capabilitiesModule, 'useCapabilities');
  spy.mockReturnValue({
    canUseHeavyEffects: false,
    hasFinePointer: false,
    isDesktopLayout,
    perfTier: 'full',
    prefersReducedMotion: false,
  });
  restoreCapabilities = () => spy.mockRestore();
}

function renderModal(cv: CvState, onClose = vi.fn()) {
  return render(
    <I18nextProvider i18n={i18n}>
      <CvModal cv={cv} onClose={onClose} />
    </I18nextProvider>,
  );
}

describe('CvModal', () => {
  beforeEach(() => {
    void i18n.changeLanguage('es');
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.setAttribute('open', '');
      },
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.removeAttribute('open');
        this.dispatchEvent(new Event('close'));
      },
    });
  });

  afterEach(() => {
    restoreCapabilities?.();
    if (originalShowModal) {
      Object.defineProperty(HTMLDialogElement.prototype, 'showModal', originalShowModal);
    } else {
      delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal;
    }
    if (originalClose) {
      Object.defineProperty(HTMLDialogElement.prototype, 'close', originalClose);
    } else {
      delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close;
    }
    vi.restoreAllMocks();
  });

  it('renders an iframe on desktop and no iframe on mobile', () => {
    mockCapabilities(true);
    const { unmount } = renderModal({ en: null, es: esDocument });
    expect(screen.getByTitle('cv-es.pdf')).toBeInTheDocument();
    unmount();

    mockCapabilities(false);
    renderModal({ en: null, es: esDocument });
    expect(document.querySelector('.cv-modal__iframe')).toBeNull();
    expect(document.querySelector('.cv-modal__mobile')).not.toBeNull();
  });

  it('points the download link at the fl_attachment variant', () => {
    mockCapabilities(true);
    renderModal({ en: null, es: esDocument });

    const download = screen.getByRole('link', { name: /descargar/i });
    expect(download).toHaveAttribute(
      'href',
      'https://res.cloudinary.com/demo/raw/upload/fl_attachment/v1/portfolio/cv/cv-es.pdf',
    );
  });

  it('switches the visible language with the segmented control', () => {
    mockCapabilities(true);
    renderModal({ en: enDocument, es: esDocument });

    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(screen.getByTitle('cv-en.pdf')).toBeInTheDocument();
  });

  it('closes through the close button', () => {
    mockCapabilities(true);
    const onClose = vi.fn();
    renderModal({ en: null, es: esDocument }, onClose);

    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar' })[0]!);
    expect(onClose).toHaveBeenCalled();
  });
});
