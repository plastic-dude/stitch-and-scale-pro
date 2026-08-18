import { describe, expect, it } from 'vitest';
import { SUPPORTED_CODES } from '@/lib/i18n';
import { getPdfLabels } from './labels';
import { getPdfThemeCopy } from './theme-copy';

const themeIds = ['minimal', 'luxury', 'craft', 'technical'] as const;

describe('PDF localization contract', () => {
  it('provides required export copy in every supported locale', () => {
    for (const locale of SUPPORTED_CODES) {
      const labels = getPdfLabels(locale);
      expect(labels.patternNotes, locale).toBeTruthy();
      expect(labels.namingTip, locale).toBeTruthy();
      expect(labels.preflightReadyDescription, locale).toBeTruthy();
      expect(labels.preflightReviewDescription(1), locale).toContain('1');
      expect(labels.preflightBlockedDescription(1), locale).toContain('1');
    }
  });

  it('provides localized metadata for every PDF theme', () => {
    for (const locale of SUPPORTED_CODES) {
      for (const themeId of themeIds) {
        const copy = getPdfThemeCopy(locale, themeId);
        expect(copy.name, `${locale}/${themeId} name`).toBeTruthy();
        expect(copy.description, `${locale}/${themeId} description`).toBeTruthy();
      }
    }
  });

  it('normalizes browser locale tags without falling back unnecessarily', () => {
    expect(getPdfLabels('de-DE').preflightReady).toBe('Druckbereit');
    expect(getPdfThemeCopy('fr-CA', 'luxury').name).toBe('LUXE');
  });
});
