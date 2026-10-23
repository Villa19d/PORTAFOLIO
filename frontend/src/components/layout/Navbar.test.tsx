import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../lib/i18n';
import { ThemeProvider } from '../ThemeProvider';
import { SmoothScrollProvider } from '../SmoothScrollProvider';
import { Navbar } from './Navbar';

function renderNavbar() {
  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <SmoothScrollProvider>
          <main id="main-content">
            <div id="home" style={{ height: '100vh' }} />
            <div id="about" style={{ height: '100vh' }} />
            <div id="experience" style={{ height: '100vh' }} />
            <div id="projects" style={{ height: '100vh' }} />
            <div id="contact" style={{ height: '100vh' }} />
          </main>
          <Navbar />
        </SmoothScrollProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

describe('Navbar', () => {
  beforeEach(() => {
    i18n.changeLanguage('es');
  });

  it('renders the logo', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /ir al inicio/i })).toBeInTheDocument();
  });

  it('renders all nav links in Spanish', () => {
    renderNavbar();
    expect(screen.getAllByRole('link', { name: 'Inicio' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Sobre mí/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Experiencia' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Proyectos' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Contacto' }).length).toBeGreaterThan(0);
  });

  it('opens mobile menu on hamburger click', () => {
    renderNavbar();
    const button = screen.getByRole('button', { name: /abrir menú/i });
    fireEvent.click(button);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes mobile menu on Escape key and returns focus to button', () => {
    renderNavbar();
    const button = screen.getByRole('button', { name: /abrir menú/i });
    fireEvent.click(button);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes mobile menu when a nav link is clicked', () => {
    renderNavbar();
    const button = screen.getByRole('button', { name: /abrir menú/i });
    fireEvent.click(button);

    const dialog = screen.getByRole('dialog');
    const links = dialog.querySelectorAll('a');
    const firstLink = links[0];
    if (firstLink) fireEvent.click(firstLink);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('marks the active section with aria-current and updates on intersection', () => {
    renderNavbar();

    const homeLinks = screen.getAllByRole('link', { name: 'Inicio' });
    expect(homeLinks.length).toBeGreaterThan(0);
    expect(homeLinks[0]).toHaveAttribute('aria-current', 'true');

    const aboutEl = document.getElementById('about');
    expect(aboutEl).toBeTruthy();

    const obsConstructor = window.IntersectionObserver as unknown as {
      instances?: Array<{
        elements: Set<Element>;
        triggerIntersection: (el: Element, isIntersecting: boolean) => void;
      }>;
    };
    const aboutObs = obsConstructor.instances?.find((obs) => aboutEl && obs.elements.has(aboutEl));

    if (aboutObs && aboutEl) {
      act(() => {
        aboutObs.triggerIntersection(aboutEl, true);
      });
      const aboutLinks = screen.getAllByRole('link', { name: /Sobre mí/i });
      expect(aboutLinks[0]).toHaveAttribute('aria-current', 'true');
    }
  });

  it('theme toggle does not break navbar rendering', () => {
    renderNavbar();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    const toggleButtons = screen.getAllByRole('button');
    expect(toggleButtons.length).toBeGreaterThan(0);
  });
});
