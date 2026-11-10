import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { SITE_CONFIG } from '../../../data/site';
import { SOCIAL_LINKS } from '../../../data/socials';
import { useCapabilities } from '../../../hooks/useCapabilities';
import { useSmoothScroll } from '../../../components/SmoothScrollProvider';
import { ArrowUpRightIcon, CheckIcon, MailIcon } from '../../../components/icons/UiIcons';

type CopyState = 'idle' | 'copied' | 'failed';

const COPY_RESET_MS = 2000;

/**
 * Content of the About "Links" tile: the three outbound profiles plus a button
 * that copies the email and scrolls to the contact form. The email address is
 * never rendered in the HTML.
 */
export function SocialLinks() {
  const { t } = useTranslation('common');
  const { scrollTo } = useSmoothScroll();
  const { canUseHeavyEffects, prefersReducedMotion } = useCapabilities();
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const resetTimer = useRef<number | null>(null);

  const shouldAnimate = canUseHeavyEffects && !prefersReducedMotion;

  useEffect(
    () => () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  const handleEmailClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(SITE_CONFIG.contactEmail);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }

    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopyState('idle'), COPY_RESET_MS);

    scrollTo('#contact');
  }, [scrollTo]);

  const emailStatus =
    copyState === 'copied'
      ? t('social.emailCopied')
      : copyState === 'failed'
        ? t('social.copyFailed')
        : t('social.emailHint');

  const emailButton = (
    <button
      type="button"
      onClick={handleEmailClick}
      className="social-links__link social-links__link--email"
    >
      <span className="social-links__icon-box" aria-hidden="true">
        {copyState === 'copied' ? (
          <CheckIcon className="social-links__icon" />
        ) : (
          <MailIcon className="social-links__icon" />
        )}
      </span>
      <span className="social-links__text">
        <span className="social-links__name">{t('social.email')}</span>
        <span className="social-links__handle" role="status">
          {emailStatus}
        </span>
      </span>
    </button>
  );

  // Staggered entrance only when heavy effects are allowed; otherwise plain <li>.
  const renderItem = (key: string, index: number, content: ReactNode) =>
    shouldAnimate ? (
      <m.li
        key={key}
        className="social-links__item"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 * index, ease: [0.22, 1, 0.36, 1] }}
      >
        {content}
      </m.li>
    ) : (
      <li key={key} className="social-links__item">
        {content}
      </li>
    );

  return (
    <div className="social-links">
      <h3 className="social-links__title">{t('about.linksLabel')}</h3>
      <ul className="social-links__grid">
        {SOCIAL_LINKS.map(({ id, labelKey, url, handle, Icon }, index) =>
          renderItem(
            id,
            index,
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${t(labelKey)}, ${t('social.opensNewTab')}`}
              className="social-links__link"
            >
              <span className="social-links__icon-box" aria-hidden="true">
                <Icon className="social-links__icon" />
              </span>
              <span className="social-links__text">
                <span className="social-links__name">{t(labelKey)}</span>
                <span className="social-links__handle">{handle}</span>
              </span>
              <ArrowUpRightIcon className="social-links__arrow" />
            </a>,
          ),
        )}
        {renderItem('email', SOCIAL_LINKS.length, emailButton)}
      </ul>
    </div>
  );
}

