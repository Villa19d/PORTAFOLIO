import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../../lib/i18n';
import * as capabilitiesModule from '../../../hooks/useCapabilities';
import type { Project } from '../types';
import { ProjectCard } from './ProjectCard';

const project: Project = {
  id: 'project-detail-test',
  slug: 'project-detail-test',
  title: { es: 'Proyecto de prueba', en: 'Test project' },
  summary: { es: 'Resumen', en: 'Summary' },
  description: { es: 'Descripción segura', en: 'Safe description' },
  techStack: ['React', 'TypeScript'],
  imageUrl: 'https://example.com/project.webp',
  videoUrl: null,
  repoUrl: 'https://github.com/example/project',
  liveUrl: 'https://example.com/project',
  featured: true,
  published: true,
  displayOrder: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');
let originalAlert: typeof window.alert;
let restoreCapabilities: (() => void) | undefined;

function renderCard(description = project.description.es) {
  const testProject = { ...project, description: { es: description, en: description } };
  return render(
    <I18nextProvider i18n={i18n}>
      <ProjectCard project={testProject} />
    </I18nextProvider>,
  );
}

async function openDetails() {
  fireEvent.click(screen.getByRole('button', { name: 'Ver detalle' }));
  const dialog = await screen.findByRole('dialog', { name: 'Proyecto de prueba' });
  await waitFor(() =>
    expect(dialog.querySelector('.project-detail-modal__markdown')?.textContent).not.toBe(
      'Cargando detalles del proyecto…',
    ),
  );
  return dialog;
}

describe('ProjectDetailModal', () => {
  beforeEach(() => {
    void i18n.changeLanguage('es');
    originalAlert = window.alert;
    const capabilitiesSpy = vi.spyOn(capabilitiesModule, 'useCapabilities');
    capabilitiesSpy.mockReturnValue({
      hasFinePointer: false,
      isDesktopLayout: false,
      prefersReducedMotion: false,
      canUseHeavyEffects: false,
    });
    restoreCapabilities = () => capabilitiesSpy.mockRestore();
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
    window.alert = originalAlert;
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

  it.each([
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '[link](javascript:alert(1))',
  ])('does not render or execute raw HTML or unsafe URL payload %s', async (payload) => {
    const alertSpy = vi.fn();
    window.alert = alertSpy;
    const { container } = renderCard(payload);

    await openDetails();

    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(container.querySelector('img[onerror]')).not.toBeInTheDocument();
    expect(container.querySelector('a[href^="javascript:"]')).not.toBeInTheDocument();
    expect(alertSpy).not.toHaveBeenCalled();
  }, 10000);

  it('allows only safe protocols and opens Markdown links with safe external-link attributes', async () => {
    const { container } = renderCard(
      '[safe](https://example.org/docs) [email](mailto:hello@example.org) [relative](/docs)',
    );

    await openDetails();

    const safeLink = await screen.findByRole('link', { name: 'safe' });
    expect(safeLink).toHaveAttribute('href', 'https://example.org/docs');
    expect(safeLink).toHaveAttribute('target', '_blank');
    expect(safeLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: 'email' })).toHaveAttribute(
      'href',
      'mailto:hello@example.org',
    );
    expect(container.querySelector('.project-detail-modal__markdown a[href="/docs"]')).toBeNull();
    expect(container.querySelector('[data-lenis-prevent="true"]')).toBeInTheDocument();
  });

  it('closes on cancel and backdrop clicks, returning focus to the trigger', async () => {
    renderCard();
    const trigger = screen.getByRole('button', { name: 'Ver detalle' });
    const dialog = await openDetails();

    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const reopenedDialog = await openDetails();
    fireEvent.click(reopenedDialog);
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
