import { useTranslation } from 'react-i18next';
import { SITE_CONFIG } from '../../data/site';
import { PROFILE_DATA } from '../../data/profile';
import { SOCIAL_LINKS } from '../../data/socials';
import { useSmoothScroll } from '../SmoothScrollProvider';
import { openTerminal } from '../../features/terminal/TerminalLauncher';
import { ArrowUpIcon } from '../icons/UiIcons';

const FOOTER_NAV = [
  { key: 'home' as const, href: '#home' },
  { key: 'about' as const, href: '#about' },
  { key: 'experience' as const, href: '#experience' },
  { key: 'projects' as const, href: '#projects' },
  { key: 'contact' as const, href: '#contact' },
];

/**
 * Site footer. It lives in the entry chunk, so it is plain CSS only: no motion,
 * hover handled with transform and all transitions off in lite / reduced motion.
 */
export function Footer() {
  const { t } = useTranslation('common');
  const { scrollTo } = useSmoothScroll();
  const currentYear = new Date().getFullYear();
  const { city, country } = PROFILE_DATA.location;

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__columns">
          <div className="site-footer__brand">
            <p className="site-footer__name">{SITE_CONFIG.authorName}</p>
            <p className="site-footer__tagline">{t('footer.tagline')}</p>
            <p className="site-footer__location">
              {city}, {country}
            </p>
          </div>

          <nav aria-label={t('footer.navLabel')} className="site-footer__nav">
            <ul className="site-footer__nav-list">
              {FOOTER_NAV.map(({ key, href }) => (
                <li key={key}>
                  <a
                    href={href}
                    onClick={(event) => {
                      event.preventDefault();
                      scrollTo(href);
                    }}
                    className="site-footer__nav-link"
                  >
                    {t(`nav.${key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="site-footer__social">
            <ul className="site-footer__social-list" aria-label={t('footer.socialLabel')}>
              {SOCIAL_LINKS.map(({ id, labelKey, url, Icon }) => (
                <li key={id}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${t(labelKey)}, ${t('social.opensNewTab')}`}
                    className="site-footer__social-link"
                  >
                    <Icon className="site-footer__social-icon" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="site-footer__bar">
          <p className="site-footer__rights">
            &copy; {currentYear} {SITE_CONFIG.authorName}. {t('footer.rights')}
          </p>
          <p className="site-footer__built">{t('footer.builtWith')}</p>
          <div className="site-footer__actions">
            <button
              type="button"
              onClick={() => scrollTo('#home')}
              className="site-footer__action"
            >
              <ArrowUpIcon className="site-footer__action-icon" />
              {t('footer.backToTop')}
            </button>
            <button
              type="button"
              onClick={openTerminal}
              className="site-footer__action site-footer__action--terminal"
              aria-label={t('terminal.open')}
            >
              <span aria-hidden="true">{'>_'}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
