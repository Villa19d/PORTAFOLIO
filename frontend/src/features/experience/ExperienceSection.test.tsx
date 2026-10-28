import { cleanup, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../lib/i18n';
import { ExperienceSection } from './ExperienceSection';

vi.mock('../../hooks/useEntranceMotion', () => ({
  useEntranceMotion: () => ({ skipEntrance: true }),
}));

afterEach(() => {
  cleanup();
});

describe('ExperienceSection', () => {
  it.each([
    ['es', 'Experiencia', 'Trabajo', 'AI Trainer (freelance)'],
    ['en', 'Experience', 'Work', 'AI Trainer (freelance)'],
  ])('renders timeline content in %s', async (language, title, workKind, entryTitle) => {
    await i18n.changeLanguage(language);

    render(
      <I18nextProvider i18n={i18n}>
        <ExperienceSection />
      </I18nextProvider>,
    );

    expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: entryTitle })).toBeInTheDocument();
    expect(
      screen.getByTestId('experience-timeline').querySelectorAll(':scope > li'),
    ).toHaveLength(10);
    expect(screen.getByText(workKind)).toBeInTheDocument();
  });
});