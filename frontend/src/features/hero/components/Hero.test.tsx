import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../lib/i18n';
import { ThemeProvider } from '../../../components/ThemeProvider';
import { SmoothScrollProvider } from '../../../components/SmoothScrollProvider';
import { Hero } from './Hero';
import * as capabilitiesModule from '../../../hooks/useCapabilities';

const mockScrollTo = vi.fn();
vi.mock('../../../components/SmoothScrollProvider', async () => {
  const actual = await vi.importActual<typeof import('../../../components/SmoothScrollProvider')>(
    '../../../components/SmoothScrollProvider'
  );
  return {
    ...actual,
    useSmoothScroll: () => ({
      scrollTo: mockScrollTo,
    }),
  };
});

function renderHero() {
  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <SmoothScrollProvider>
          <Hero />
        </SmoothScrollProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

describe('Hero Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    i18n.changeLanguage('es');
    vi.spyOn(capabilitiesModule, 'useCapabilities').mockReturnValue({
      hasFinePointer: true,
      isDesktopLayout: true,
      prefersReducedMotion: false,
      canUseHeavyEffects: true,
      perfTier: 'full',
    });
  });

  it('renders greeting, name (H1), role and subtitle in Spanish', () => {
    renderHero();

    expect(screen.getByText(/Hola, soy/i)).toBeInTheDocument();
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(/Rodrigo Del Villar/i);
    expect(screen.getByText(/Desarrollador Full-Stack/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Construyo aplicaciones web rápidas y seguras/i)
    ).toBeInTheDocument();
  });

  it('renders correctly in English when language changes', () => {
    i18n.changeLanguage('en');
    renderHero();

    expect(screen.getByText(/Hi, I'm/i)).toBeInTheDocument();
    expect(screen.getByText(/Full-Stack Developer/i)).toBeInTheDocument();
    expect(
      screen.getByText(/I build fast, secure web applications/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View projects/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Contact me/i })).toBeInTheDocument();
  });

  it('renders CTAs with correct href and triggers smooth scroll on click', () => {
    renderHero();

    const projectsCta = screen.getByRole('link', { name: /Ver proyectos/i });
    const contactCta = screen.getByRole('link', { name: /Contáctame/i });

    expect(projectsCta).toHaveAttribute('href', '#projects');
    expect(contactCta).toHaveAttribute('href', '#contact');

    fireEvent.click(projectsCta);
    expect(mockScrollTo).toHaveBeenCalledWith('#projects');

    fireEvent.click(contactCta);
    expect(mockScrollTo).toHaveBeenCalledWith('#contact');
  });

  it('renders optimized picture element with AVIF, WebP, explicit dimensions and high fetchpriority', () => {
    renderHero();

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/assets/rodrigo/rodrigo-800.webp');
    expect(img).toHaveAttribute('width', '424');
    expect(img).toHaveAttribute('height', '529');
    expect(img).toHaveAttribute('fetchpriority', 'high');
    expect(img).not.toHaveAttribute('loading', 'lazy');

    const picture = img.closest('picture');
    expect(picture).toBeInTheDocument();
    const sources = picture?.querySelectorAll('source');
    expect(sources?.length).toBe(2);

    const avifSource = picture?.querySelector('source[type="image/avif"]');
    const webpSource = picture?.querySelector('source[type="image/webp"]');
    expect(avifSource).toBeInTheDocument();
    expect(webpSource).toBeInTheDocument();
  });

  it('mounts interactive spotlight only when canUseHeavyEffects is true', () => {
    vi.spyOn(capabilitiesModule, 'useCapabilities').mockReturnValue({
      hasFinePointer: true,
      isDesktopLayout: true,
      prefersReducedMotion: false,
      canUseHeavyEffects: true,
      perfTier: 'full',
    });

    renderHero();
    expect(screen.getByTestId('hero-spotlight')).toBeInTheDocument();
  });

  it('does NOT mount interactive spotlight in mobile emulation or reduced motion (canUseHeavyEffects=false)', () => {
    vi.spyOn(capabilitiesModule, 'useCapabilities').mockReturnValue({
      hasFinePointer: false,
      isDesktopLayout: false,
      prefersReducedMotion: true,
      canUseHeavyEffects: false,
      perfTier: 'full',
    });

    renderHero();
    expect(screen.queryByTestId('hero-spotlight')).not.toBeInTheDocument();
    expect(screen.getByTestId('hero-background')).toBeInTheDocument();
  });

  it('does NOT mount interactive spotlight in lite tier even on a capable desktop', () => {
    vi.spyOn(capabilitiesModule, 'useCapabilities').mockReturnValue({
      hasFinePointer: true,
      isDesktopLayout: true,
      prefersReducedMotion: false,
      canUseHeavyEffects: false,
      perfTier: 'lite',
    });

    renderHero();
    expect(screen.queryByTestId('hero-spotlight')).not.toBeInTheDocument();
    expect(screen.getByTestId('hero-background')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Rodrigo Del Villar/i);
  });
});