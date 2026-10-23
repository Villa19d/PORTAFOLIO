import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '../ThemeToggle';
import { LanguageToggle } from '../LanguageToggle';
import { useSmoothScroll } from '../SmoothScrollProvider';

const NAV_LINKS = [
  { key: 'home' as const, href: '#home' },
  { key: 'about' as const, href: '#about' },
  { key: 'experience' as const, href: '#experience' },
  { key: 'projects' as const, href: '#projects' },
  { key: 'contact' as const, href: '#contact' },
] as const;

type NavKey = (typeof NAV_LINKS)[number]['key'];

export function Navbar() {
  const { t } = useTranslation('common');
  const { scrollTo } = useSmoothScroll();

  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<NavKey>('home');
  const [menuOpen, setMenuOpen] = useState(false);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  // Scroll spy — IntersectionObserver
  useEffect(() => {
    const sectionIds = NAV_LINKS.map((l) => l.href.slice(1));
    const observers: IntersectionObserver[] = [];

    const sectionMap = new Map<Element, NavKey>();

    sectionIds.forEach((id, i) => {
      const el = document.getElementById(id);
      const link = NAV_LINKS[i];
      if (!el || !link) return;

      const key = link.key;
      sectionMap.set(el, key);

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry?.isIntersecting) {
            setActiveSection(sectionMap.get(entry.target) ?? 'home');
          }
        },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  // Navbar scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on Escape and click-outside
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
      // Focus trap
      if (e.key === 'Tab' && mobileNavRef.current) {
        const focusable = Array.from(
          mobileNavRef.current.querySelectorAll<HTMLElement>(
            'a, button, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hidden);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        mobileNavRef.current &&
        !mobileNavRef.current.contains(e.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(e.target as Node)
      ) {
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClickOutside);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [menuOpen, closeMenu]);

  const handleNavClick = (href: string) => {
    scrollTo(href);
    if (menuOpen) closeMenu();
  };

  return (
    <header
      className={[
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-surface/80 backdrop-blur-md border-b border-border shadow-nav'
          : 'bg-transparent border-b border-transparent',
      ].join(' ')}
    >
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-surface focus:text-text focus:rounded-[var(--radius-md)] focus:ring-2 focus:ring-accent"
      >
        {t('nav.skipToContent')}
      </a>

      <nav
        aria-label="Main navigation"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="flex h-[72px] items-center justify-between">
          {/* Logo */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('#home');
            }}
            className="inline-flex w-[8.75rem] shrink-0 items-center whitespace-nowrap font-mono text-xl font-bold text-text transition-opacity hover:opacity-80"
            aria-label="Ir al inicio"
          >
            <span className="inline-block w-3 text-accent">&lt;</span>
            <span className="inline-block w-[5.25rem]">Rodrigo</span>
            <span className="inline-block w-6 text-right text-accent">/&gt;</span>
          </a>

          {/* Desktop links */}
          <ul className="hidden lg:flex items-center gap-8 list-none">
            {NAV_LINKS.map(({ key, href }) => (
              <li key={key}>
                <a
                  href={href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(href);
                  }}
                  aria-current={activeSection === key ? 'true' : undefined}
                  className={[
                    'text-sm font-medium transition-colors relative pb-0.5',
                    'after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-accent after:scale-x-0 after:transition-transform after:origin-left',
                    activeSection === key
                      ? 'text-accent after:scale-x-100'
                      : 'text-text-muted hover:text-text hover:after:scale-x-100',
                  ].join(' ')}
                >
                  {t(`nav.${key}`)}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop controls */}
          <div className="hidden lg:flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <button
            ref={menuButtonRef}
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[var(--radius-md)] border border-border-control hover:bg-surface-elevated transition-colors text-text"
          >
            <span className="sr-only">
              {menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            </span>
            {/* Hamburger / Close icon */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile panel */}
        {menuOpen && (
          <div
            id="mobile-menu"
            ref={mobileNavRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="lg:hidden absolute top-[72px] inset-x-0 bg-surface border-b border-border shadow-soft py-4"
          >
            <ul className="flex flex-col gap-1 px-4 list-none">
              {NAV_LINKS.map(({ key, href }) => (
                <li key={key}>
                  <a
                    href={href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(href);
                    }}
                    aria-current={activeSection === key ? 'true' : undefined}
                    className={[
                      'block px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium transition-colors min-h-[44px] flex items-center',
                      activeSection === key
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-muted hover:bg-surface-elevated hover:text-text',
                    ].join(' ')}
                  >
                    {t(`nav.${key}`)}
                  </a>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-3 px-8 pt-4 border-t border-border mt-4">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
