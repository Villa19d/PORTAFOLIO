import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { PROFILE_DATA } from '../../data/profile';
import english from '../../locales/en/common.json';
import spanish from '../../locales/es/common.json';
import i18n from '../../lib/i18n';
import { AboutSection } from './AboutSection';

afterEach(() => {
  cleanup();
});

describe('AboutSection', () => {
  it.each([
    ['es', spanish.about.title, spanish.about.introLabel],
    ['en', english.about.title, english.about.introLabel],
  ])('renders the %s section labels and all seven Bento tiles', async (language, title, intro) => {
    await i18n.changeLanguage(language);
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <AboutSection />
      </I18nextProvider>,
    );

    expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: intro })).toBeInTheDocument();
    expect(container.querySelector('[role="group"]')?.children).toHaveLength(7);
    expect(screen.getAllByRole('link', { name: /github|linkedin/i })).toHaveLength(1);
    expect(screen.queryByRole('link', { name: /cv|résumé|currículum/i })).not.toBeInTheDocument();
  });

  it('renders each profile image from an existing public asset', async () => {
    await i18n.changeLanguage('es');
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <AboutSection />
      </I18nextProvider>,
    );

    const images = Array.from(container.querySelectorAll('img'));
    expect(images.length).toBeGreaterThan(0);
    for (const image of images) {
      const source = image.getAttribute('src');
      expect(source).toBeTruthy();
      expect(readFileSync(resolve(process.cwd(), 'public', source!.replace(/^\//, '')))).toBeTruthy();
    }
  });

  it('provides all required profile copy in Spanish and English', () => {
    expect(PROFILE_DATA.stack).toHaveLength(12);
    expect(Object.keys(spanish.about).sort()).toEqual(Object.keys(english.about).sort());
    expect(PROFILE_DATA.hobbies.es).toContain('Ajedrez competitivo');
    expect(PROFILE_DATA.hobbies.en).toContain('Competitive chess');
    expect(PROFILE_DATA.currently.es).toContain('Instituto Tecnológico de Pachuca');
    expect(PROFILE_DATA.currently.en).toContain('Instituto Tecnológico de Pachuca');
    expect(PROFILE_DATA.bio.es).toBe('Ingeniero en Sistemas Computacionales y desarrollador Full Stack apasionado por la nube y arquitecturas escalables. Transformando problemas complejos en soluciones eficientes.');
    expect(PROFILE_DATA.bio.en).toBe('Computer Systems Engineer and Full Stack developer passionate about cloud computing and scalable architectures. Transforming complex problems into efficient solutions.');
  });
});
