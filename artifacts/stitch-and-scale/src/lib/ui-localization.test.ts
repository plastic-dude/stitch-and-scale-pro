import { describe, it, expect } from 'vitest';
import { TRANSLATIONS } from './i18n';
import type { LanguageCode } from './i18n';

describe('UI Localization Keys', () => {
  const locales: LanguageCode[] = ['de', 'fr', 'es', 'pt'];

  locales.forEach(locale => {
    describe(`Locale: ${locale}`, () => {
      it('should have a localized value for settings.mcp.learnMore', () => {
        const val = TRANSLATIONS[locale]['settings.mcp.learnMore'];
        expect(val).toBeDefined();
        expect(val).not.toBe(TRANSLATIONS.en['settings.mcp.learnMore']);
      });

      it('should have a localized value for nav.aboutEmlux', () => {
        const val = TRANSLATIONS[locale]['nav.aboutEmlux'];
        expect(val).toBeDefined();
        expect(val).not.toBe(TRANSLATIONS.en['nav.aboutEmlux']);
      });
    });
  });
});
