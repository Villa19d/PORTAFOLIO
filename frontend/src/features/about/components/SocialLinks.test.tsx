import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../lib/i18n';
import { SITE_CONFIG } from '../../../data/site';
import { SOCIAL_LINKS } from '../../../data/socials';
import { SocialLinks } from './SocialLinks';

const { scrollToMock } = vi.hoisted(() => ({ scrollToMock: vi.fn() }));

vi.mock('../../../components/SmoothScrollProvider', () => ({
  useSmoothScroll: () => ({ scrollTo: scrollToMock, pause: vi.fn(), resume: vi.fn() }),
}));

const capabilities = vi.hoisted(() => ({
  value: {
    hasFinePointer: true,
    isDesktopLayout: true,
    prefersReducedMotion: false,
    canUseHeavyEffects: false,
    perfTier: 'lite' as 'full' | 'lite',
  },
}));

vi.mock('../../../hooks/useCapabilities', () => ({
  useCapabilities: () => capabilities.value,
}));

const writeText = vi.fn();

function renderSocialLinks() {
  return render(
    <I18nextProvider i18n={i18n}>
      <SocialLinks />
    </I18nextProvider>,
  );
}

beforeEach(() => {
  void i18n.changeLanguage('es');
  scrollToMock.mockReset();
  writeText.mockReset();
  writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  capabilities.value = {
    hasFinePointer: true,
    isDesktopLayout: true,
    prefersReducedMotion: false,
    canUseHeavyEffects: false,
    perfTier: 'lite',
  };
});

afterEach(() => {
  cleanup();
});

describe('SocialLinks', () => {
  it('renders the three external profiles with the expected hrefs and external attributes', () => {
    renderSocialLinks();

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(SOCIAL_LINKS.length);
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      SOCIAL_LINKS.map((social) => social.url),
    );

    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(link.getAttribute('rel')).toContain('noreferrer');
      expect(link.getAttribute('aria-label')).toContain('se abre en otra pestaña');
    }
  });

  it('copies the email, shows the copied status and scrolls to the contact section', async () => {
    renderSocialLinks();

    fireEvent.click(screen.getByRole('button', { name: /correo/i }));

    expect(writeText).toHaveBeenCalledWith(SITE_CONFIG.contactEmail);
    expect(await screen.findByText('Correo copiado')).toBeInTheDocument();
    expect(scrollToMock).toHaveBeenCalledWith('#contact');
  });

  it('shows the failure message and still scrolls when the clipboard rejects', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    renderSocialLinks();

    fireEvent.click(screen.getByRole('button', { name: /correo/i }));

    expect(await screen.findByText(/no se pudo copiar/i)).toBeInTheDocument();
    expect(scrollToMock).toHaveBeenCalledWith('#contact');
  });
});
