import { describe, it, expect } from 'vitest';
import { TAB_REGISTRY } from './tab-registry';
import { COPY } from './workspace-tab-labels';
import type { LanguageCode } from './i18n';

describe('Workspace Tab Localization Coverage', () => {
  const locales: LanguageCode[] = ['de', 'fr', 'es', 'pt'];
  
  // Terms intentionally identical across languages or industry standards
  const allowlist = new Set([
    'sections',    // FR, ES, PT
    'notes',       // FR
    'kits',        // DE, FR, ES, PT
    'pipeline',    // DE, FR, ES, PT
    'collab',      // DE
    'mix',         // DE, FR, ES, PT
    'lookbook',    // DE, FR, ES, PT
    'compiler',    // DE, FR, ES, PT
    'composition', // FR
    'assets',      // DE
    'collaboration', // FR, ES, PT
    'launch',      // DE, PT (Industry standard)
    'trunkshow',   // DE, FR, ES, PT (Industry standard)
    'packages',    // FR
    'inclusive',   // ES
    'promo',       // DE, FR, ES, PT
    'videosocial', // DE (Industry standard)
    'subdist',     // FR
    'bragcard'     // ES, PT (Industry standard)
  ]);

  locales.forEach(locale => {
    describe(`Locale: ${locale}`, () => {
      it('should have a translation for every registry entry', () => {
        TAB_REGISTRY.forEach(tab => {
          const translation = COPY[locale][tab.value];
          expect(translation, `Missing translation for tab "${tab.value}" in locale "${locale}"`).toBeDefined();
        });
      });

      it('should not have accidental English remnants', () => {
        TAB_REGISTRY.forEach(tab => {
          const translation = COPY[locale][tab.value];
          const english = COPY.en[tab.value];
          
          if (translation === english && !allowlist.has(tab.value)) {
            throw new Error(`Accidental English remnant detected for tab "${tab.value}" in locale "${locale}": "${translation}" matches English but is not in the allowlist.`);
          }
        });
      });
    });
  });
});
