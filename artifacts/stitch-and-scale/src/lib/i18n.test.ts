import { describe, expect, it } from 'vitest';
import {
  detectBrowserLanguage,
  getMissingTranslationKeys,
  translate,
} from './i18n';

describe('i18n foundation', () => {
  it('detects the first supported browser language, including regional tags', () => {
    expect(detectBrowserLanguage(['de-DE', 'en-US'])).toBe('de');
    expect(detectBrowserLanguage(['nl-NL', 'fr-FR'])).toBe('fr');
    expect(detectBrowserLanguage(['ja-JP'])).toBe('en');
  });

  it('interpolates named variables without changing static translations', () => {
    expect(translate('en', 'workflow.onboarding.showMoreStandards', { count: 4 })).toBe('Show 4 more standards');
    expect(translate('de', 'workflow.onboarding.showMoreStandards', { count: 2 })).toBe('Weitere 2 Standards anzeigen');
    expect(translate('fr', 'workflow.onboarding.readyTitle')).toBe('Vous êtes prêt.');
  });

  it('reports missing keys explicitly instead of hiding coverage behind fallback', () => {
    expect(getMissingTranslationKeys('en')).toEqual([]);
    expect(getMissingTranslationKeys('de')).toEqual([]);
    expect(getMissingTranslationKeys('fr')).toEqual([]);
    expect(getMissingTranslationKeys('es')).toEqual([]);
    expect(getMissingTranslationKeys('pt')).toEqual([]);
  });
});
