import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../lib/i18n';
import { SITE_CONFIG } from '../../data/site';
import { SOCIAL_LINKS } from '../../data/socials';
import { Footer } from './Footer';

const { scrollToMock } = vi.hoisted(() => ({ scrollToMock: vi.fn() }));

vi.mock('../SmoothScrollProvider', () => ({
  useSmoothScroll: () => ({ scrollTo: scrollToMock, pause: vi.fn(), resume: vi.fn() }),
}));

function renderFooter() {
  return render(
    <I18nextProvider i18n={i18n}>
      <Footer />
    </I18nextProvider>,
  );
}

beforeEach(() => {
  void i18n.changeLanguage('es');
  scrollToMock.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('Footer', () => {
  it('renders the navigation links to the section ids', () => {
    renderFooter();

    const nav = screen.getByRole('navigation', { name: 'Navegación del pie de página' });
    const hrefs = Array.from(nav.querySelectorAll('a')).map((link) => link.getAttribute('href'));
    expect(hrefs).toEqual(['#home', '#about', '#experience', '#projects', '#contact']);
  });

  it('renders the social links with the expected hrefs', () => {
    renderFooter();

    const list = screen.getByRole('list', { name: 'Redes' });
    const links = Array.from(list.querySelectorAll('a'));
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      SOCIAL_LINKS.map((social) => social.url),
    );

    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
    }
  });

  it('shows the current year and the author name', () => {
    renderFooter();

    const footer = screen.getByRole('contentinfo');
    expect(footer.textContent).toContain(String(new Date().getFullYear()));
    expect(footer.textContent).toContain(SITE_CONFIG.authorName);
  });

  it('scrolls to the top when the back-to-top button is used', () => {
    renderFooter();

    fireEvent.click(screen.getByRole('button', { name: /volver arriba/i }));

    expect(scrollToMock).toHaveBeenCalledWith('#home');
  });
});
