import { ReactNode } from 'react';
import { MotionConfig } from 'motion/react';
import { ThemeProvider } from './ThemeProvider';
import { SmoothScrollProvider } from './SmoothScrollProvider';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <MotionConfig reducedMotion="user">
          <SmoothScrollProvider>
            {children}
          </SmoothScrollProvider>
        </MotionConfig>
      </ThemeProvider>
    </I18nextProvider>
  );
}
