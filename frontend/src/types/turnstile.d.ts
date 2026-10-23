export interface TurnstileRenderOptions {
  sitekey: string;
  appearance?: 'always' | 'execute' | 'interaction-only';
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
}

export interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string | number;
  reset: (widgetId?: string | number) => void;
  remove?: (widgetId: string | number) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export {};
