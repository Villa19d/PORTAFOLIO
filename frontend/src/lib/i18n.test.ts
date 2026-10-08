import { describe, it, expect, beforeEach } from 'vitest';
import i18n from './i18n';

describe('i18n configuration', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en'; // Reset state
  });

  it('updates document language on language change', async () => {
    // Force a specific language
    await i18n.changeLanguage('es');
    expect(document.documentElement.lang).toBe('es');

    await i18n.changeLanguage('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('has correct fallback language', () => {
    expect(i18n.options.fallbackLng).toEqual(['es']);
  });
});
