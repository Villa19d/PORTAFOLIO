import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../components/ThemeProvider';
import { SITE_CONFIG } from '../../../data/site';

const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const SCRIPT_TIMEOUT_MS = 8000;

let scriptPromise: Promise<void> | undefined;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) {
    return Promise.resolve();
  }

  if (scriptPromise && window.turnstile) {
    return scriptPromise;
  }
  scriptPromise = undefined;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-turnstile-script]',
    );
    const script = existingScript ?? document.createElement('script');
    const timeoutRef = { id: 0 };

    const timeoutHandler = () => {
      cleanup();
      reject(new Error('Turnstile script timed out'));
    };

    const cleanup = () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
      window.clearTimeout(timeoutRef.id);
    };

    const handleLoad = () => {
      cleanup();
      if (window.turnstile) {
        resolve();
      } else {
        reject(new Error('Turnstile API unavailable'));
      }
    };

    const handleError = () => {
      cleanup();
      reject(new Error('Turnstile script failed to load'));
    };

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    timeoutRef.id = window.setTimeout(timeoutHandler, SCRIPT_TIMEOUT_MS);
    if (!existingScript) {
      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.dataset.turnstileScript = 'true';
      document.head.appendChild(script);
    }
  }).catch((error: unknown) => {
    scriptPromise = undefined;
    throw error;
  });

  return scriptPromise;
}

type WidgetState = 'idle' | 'loading' | 'ready' | 'error';

export function TurnstileWidget({
  onToken,
  resetSignal = 0,
  disabled = false,
}: {
  onToken: (token: string | null) => void;
  resetSignal?: number;
  disabled?: boolean;
}) {
  const { t, i18n } = useTranslation('common');
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | number | undefined>(undefined);
  const [widgetState, setWidgetState] = useState<WidgetState>('idle');
  const language = i18n.language?.startsWith('en') ? 'en' : 'es';
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || !siteKey) {
      if (!siteKey) {
        setWidgetState('error');
      }
      return;
    }

    if (widgetIdRef.current !== undefined) {
      window.turnstile.reset(widgetIdRef.current);
      onToken(null);
    }
    containerRef.current.innerHTML = '';

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      appearance: 'interaction-only',
      theme,
      language,
      callback: (token) => onToken(token),
      'expired-callback': () => {
        onToken(null);
        if (widgetIdRef.current !== undefined) {
          window.turnstile?.reset(widgetIdRef.current);
        }
      },
      'error-callback': () => {
        onToken(null);
        setWidgetState('error');
      },
    });
    setWidgetState('ready');
  }, [language, onToken, siteKey, theme]);

  const activate = useCallback(() => {
    if (widgetState !== 'idle') {
      return;
    }

    setWidgetState('loading');
    void loadTurnstileScript()
      .then(renderWidget)
      .catch(() => {
        onToken(null);
        setWidgetState('error');
      });
  }, [onToken, renderWidget, widgetState]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          activate();
          observer.disconnect();
        }
      },
      { rootMargin: '160px' },
    );
    observer.observe(container);

    return () => observer.disconnect();
  }, [activate]);

  useEffect(() => {
    if (widgetState === 'ready') {
      renderWidget();
    }
  }, [renderWidget, widgetState]);

  useEffect(() => {
    if (resetSignal === 0 || widgetIdRef.current === undefined) {
      return;
    }
    window.turnstile?.reset(widgetIdRef.current);
    onToken(null);
  }, [onToken, resetSignal]);

  useEffect(() => {
    return () => {
      const widgetId = widgetIdRef.current;
      if (widgetId === undefined) {
        return;
      }

      window.turnstile?.remove?.(widgetId);
      widgetIdRef.current = undefined;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-24"
      onFocusCapture={activate}
      aria-live="polite"
      aria-busy={widgetState === 'loading'}
      aria-disabled={disabled}
    >
      {widgetState === 'error' && (
        <div className="grid min-h-24 content-center gap-2 rounded-[--radius-sm] border border-border bg-surface-elevated p-3 text-sm text-text-muted">
          <p role="alert">{t('contact.turnstile.blocked')}</p>
          <a
            href={SITE_CONFIG.linkedinUrl}
            target="_blank"
            rel="noreferrer"
            className="w-fit text-accent underline underline-offset-4"
          >
            {t('contact.turnstile.linkedin')}
          </a>
        </div>
      )}
    </div>
  );
}
