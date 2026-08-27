import { describe, it, expect } from 'vitest';
import { TAB_REGISTRY } from './tab-registry';
import { COPY } from './workspace-tab-labels';
import type { LanguageCode } from './i18n';

describe('Workspace Tab Localization Coverage', () => {
  const locales: LanguageCode[] = ['de', 'fr', 'es', 'pt'];
  const tabValues = TAB_REGISTRY.map(t => t.value);

  locales.forEach(locale => {
    describe(`Locale: ${locale}`, () => {
      it('should have a translation for every registry tab', () => {
        const localeMap = COPY[locale];
        tabValues.forEach(value => {
          const translation = localeMap[value];
          expect(translation, `Missing translation for tab "${value}" in locale "${locale}"`).toBeDefined();
          // Some words are validly the same in multiple languages (e.g., "Sections" in French).
          // We only warn if it's exactly the same as English, but it's not a hard failure for all.
          if (translation === COPY.en[value]) {
            console.warn(`[Locale: ${locale}] Tab "${value}" matches English: "${translation}"`);
          }
        });
      });
    });
  });
});
