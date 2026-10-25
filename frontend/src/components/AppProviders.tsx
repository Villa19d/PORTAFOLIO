import { type ReactNode } from 'react';
import { domAnimation, LazyMotion, MotionConfig } from 'motion/react';
import { ThemeProvider } from './ThemeProvider';
import { SmoothScrollProvider } from './SmoothScrollProvider';
import { CursorLoader } from './cursor/CursorLoader';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';
import { SoundProvider } from '../features/sound/SoundContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <LazyMotion features={domAnimation} strict>
          <MotionConfig reducedMotion="user">
            <SmoothScrollProvider>
              <SoundProvider>
                {children}
                <CursorLoader />
              </SoundProvider>
            </SmoothScrollProvider>
          </MotionConfig>
        </LazyMotion>
      </ThemeProvider>
    </I18nextProvider>
  );
}
