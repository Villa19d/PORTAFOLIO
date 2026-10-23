import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { MagneticButton } from '../../../components/ui/MagneticButton';
import { TurnstileWidget } from './TurnstileWidget';
import { API_BASE_URL, type ProblemDetail } from '../../../lib/api';

type ContactValues = {
  name: string;
  email: string;
  message: string;
};

type ContactErrors = Partial<Record<keyof ContactValues, string>>;
type SubmitState = 'idle' | 'sending' | 'waiting' | 'success' | 'error';

const initialValues: ContactValues = {
  name: '',
  email: '',
  message: '',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: ContactValues, t: (key: string) => string): ContactErrors {
  const errors: ContactErrors = {};

  if (!values.name.trim()) {
    errors.name = t('contact.validation.nameRequired');
  } else if (values.name.trim().length > 80) {
    errors.name = t('contact.validation.nameLength');
  }

  if (!values.email.trim()) {
    errors.email = t('contact.validation.emailRequired');
  } else if (values.email.trim().length > 254 || !emailPattern.test(values.email.trim())) {
    errors.email = t('contact.validation.emailInvalid');
  }

  if (!values.message.trim()) {
    errors.message = t('contact.validation.messageRequired');
  } else if (values.message.trim().length < 10 || values.message.length > 2000) {
    errors.message = t('contact.validation.messageLength');
  }

  return errors;
}

export function ContactForm() {
  const { t } = useTranslation('common');
  const [values, setValues] = useState<ContactValues>(initialValues);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [generalError, setGeneralError] = useState('');
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const turnstileTokenRef = useRef<string | null>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const waitingTimerRef = useRef<number | undefined>(undefined);
  const isSubmitting = submitState === 'sending' || submitState === 'waiting';
  const disabled = isSubmitting;

  const handleToken = useCallback((token: string | null) => {
    turnstileTokenRef.current = token;
  }, []);

  useEffect(() => {
    return () => {
      if (waitingTimerRef.current !== undefined) {
        window.clearTimeout(waitingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (submitState === 'success') {
      successRef.current?.focus();
    }
  }, [submitState]);

  const updateField = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    const field = name as keyof ContactValues;
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);

    if (errors[field]) {
      setErrors(validate(nextValues, (key: string) => t(key)));
    }
    setGeneralError('');
    setRetryAfter(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const validationErrors = validate(values, (key: string) => t(key));
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitState('error');
      return;
    }

    const turnstileToken = turnstileTokenRef.current;
    if (!turnstileToken) {
      setGeneralError(t('contact.errors.turnstile'));
      setSubmitState('error');
      return;
    }

    setErrors({});
    setGeneralError('');
    setRetryAfter(null);
    setSubmitState('sending');
    waitingTimerRef.current = window.setTimeout(() => {
      setSubmitState('waiting');
    }, 8000);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 90000);

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, turnstileToken }),
        signal: controller.signal,
      });

      let problem: ProblemDetail | undefined;
      if (!response.ok) {
        try {
          problem = (await response.json()) as ProblemDetail;
        } catch {
          problem = undefined;
        }
        const fieldErrors: ContactErrors = {};
        problem?.errors?.forEach(({ field, message }) => {
          if (field in values) {
            fieldErrors[field as keyof ContactValues] = message;
          }
        });

        if (response.status === 400) {
          setErrors(fieldErrors);
          setGeneralError(problem?.detail || t('contact.errors.validation'));
        } else if (response.status === 403) {
          setGeneralError(t('contact.errors.turnstile'));
          setResetSignal((current) => current + 1);
        } else if (response.status === 429) {
          const seconds = Number(response.headers.get('Retry-After'));
          setRetryAfter(Number.isFinite(seconds) ? seconds : null);
          setGeneralError(t('contact.errors.rateLimit'));
        } else if (response.status === 503) {
          setGeneralError(t('contact.errors.unavailable'));
        } else {
          setGeneralError(t('contact.errors.generic'));
        }
        setSubmitState('error');
        return;
      }

      setValues(initialValues);
      turnstileTokenRef.current = null;
      setResetSignal((current) => current + 1);
      setSubmitState('success');
    } catch (error: unknown) {
      setGeneralError(
        error instanceof DOMException && error.name === 'AbortError'
          ? t('contact.errors.timeout')
          : t('contact.errors.generic'),
      );
      setSubmitState('error');
    } finally {
      window.clearTimeout(timeoutId);
      if (waitingTimerRef.current !== undefined) {
        window.clearTimeout(waitingTimerRef.current);
      }
    }
  };

  return (
    <form className="grid gap-6" noValidate onSubmit={handleSubmit} aria-busy={isSubmitting}>
      <div className="grid gap-2">
        <label htmlFor="contact-name" className="font-mono text-sm text-text">
          {t('contact.fields.name')}
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={80}
          value={values.name}
          onChange={updateField}
          disabled={disabled}
          aria-describedby="contact-name-help contact-name-error"
          aria-invalid={Boolean(errors.name)}
          className="min-h-11 rounded-[--radius-sm] border border-border-control bg-surface px-3 py-2 text-text caret-text focus:border-accent focus:outline-2 focus:outline-offset-2 focus:outline-accent"
        />
        <p id="contact-name-help" className="text-xs text-text-muted">
          {t('contact.fields.nameHint')}
        </p>
        {errors.name && (
          <p id="contact-name-error" role="alert" className="text-sm text-accent-2">
            {errors.name}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <label htmlFor="contact-email" className="font-mono text-sm text-text">
          {t('contact.fields.email')}
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          value={values.email}
          onChange={updateField}
          disabled={disabled}
          aria-describedby="contact-email-help contact-email-error"
          aria-invalid={Boolean(errors.email)}
          className="min-h-11 rounded-[--radius-sm] border border-border-control bg-surface px-3 py-2 text-text caret-text focus:border-accent focus:outline-2 focus:outline-offset-2 focus:outline-accent"
        />
        <p id="contact-email-help" className="text-xs text-text-muted">
          {t('contact.fields.emailHint')}
        </p>
        {errors.email && (
          <p id="contact-email-error" role="alert" className="text-sm text-accent-2">
            {errors.email}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <label htmlFor="contact-message" className="font-mono text-sm text-text">
          {t('contact.fields.message')}
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={7}
          minLength={10}
          maxLength={2000}
          value={values.message}
          onChange={updateField}
          disabled={disabled}
          aria-describedby="contact-message-count contact-message-error"
          aria-invalid={Boolean(errors.message)}
          className="resize-y rounded-[--radius-sm] border border-border-control bg-surface px-3 py-2 text-text caret-text focus:border-accent focus:outline-2 focus:outline-offset-2 focus:outline-accent"
        />
        <div className="flex justify-between gap-4 text-xs text-text-muted">
          <span id="contact-message-count" aria-live="polite">
            {t('contact.fields.messageCount', { count: values.message.length })}
          </span>
          <span>{t('contact.fields.messageHint')}</span>
        </div>
        {errors.message && (
          <p id="contact-message-error" role="alert" className="text-sm text-accent-2">
            {errors.message}
          </p>
        )}
      </div>

      <p className="max-w-prose text-sm leading-relaxed text-text-muted">
        {t('contact.privacy')}
      </p>

      <TurnstileWidget
        onToken={handleToken}
        resetSignal={resetSignal}
        disabled={disabled}
      />

      <div
        ref={successRef}
        tabIndex={-1}
        aria-live="polite"
        className={submitState === 'success' ? 'rounded-[--radius-sm] border border-accent p-3 text-sm text-accent' : 'sr-only'}
      >
        {submitState === 'success' && t('contact.status.success')}
      </div>
      {submitState === 'sending' && (
        <p aria-live="polite" className="text-sm text-text-muted">
          {t('contact.status.sending')}
        </p>
      )}
      {submitState === 'waiting' && (
        <p aria-live="polite" className="text-sm text-text-muted">
          {t('contact.status.waiting')}
        </p>
      )}
      {generalError && (
        <div role="alert" className="grid gap-1 text-sm text-accent-2">
          <p>{generalError}</p>
          {retryAfter !== null && (
            <p>{t('contact.errors.retryAfter', { seconds: retryAfter })}</p>
          )}
        </div>
      )}

      <MagneticButton>
        <button
          type="submit"
          disabled={disabled}
          className="rounded-[--radius-sm] bg-brand-gradient px-5 py-3 font-mono text-sm font-bold text-bg transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {submitState === 'sending'
            ? t('contact.status.sending')
            : submitState === 'waiting'
              ? t('contact.status.waitingButton')
              : t('contact.submit')}
        </button>
      </MagneticButton>
    </form>
  );
}
