import { type ReactNode } from 'react';
import { MotionConfig } from 'motion/react';
import { ThemeProvider } from './ThemeProvider';
import { SmoothScrollProvider } from './SmoothScrollProvider';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <MotionConfig reducedMotion="user">
            <SmoothScrollProvider>
              {children}
            </SmoothScrollProvider>
          </MotionConfig>
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
