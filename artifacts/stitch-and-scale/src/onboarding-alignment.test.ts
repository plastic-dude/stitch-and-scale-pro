import { describe, it, expect } from 'vitest';
import { TRANSLATIONS } from './lib/i18n';

describe('Onboarding Content Alignment (CHK-175)', () => {
  const locales = Object.keys(TRANSLATIONS) as (keyof typeof TRANSLATIONS)[];

  it('should have updated sampleMeta with 8 measurements across all locales', () => {
    locales.forEach(lang => {
      const meta = TRANSLATIONS[lang]['workflow.onboarding.sampleMeta'];
      expect(meta).toContain('8');
      expect(meta).not.toContain('11');
    });
  });

  it('should have new tour keys for Search and Integrity across all locales', () => {
    const requiredKeys = [
      'workflow.onboarding.tour.search',
      'workflow.onboarding.tour.searchDescription',
      'workflow.onboarding.tour.integrity',
      'workflow.onboarding.tour.integrityDescription'
    ];

    locales.forEach(lang => {
      requiredKeys.forEach(key => {
        expect(TRANSLATIONS[lang][key as keyof typeof TRANSLATIONS[typeof lang]]).toBeDefined();
      });
    });
  });

  it('should have localized sizing standard labels and descriptions', () => {
    const standardKeys = [
      'workflow.onboarding.standard.cyc.label',
      'workflow.onboarding.standard.cyc.desc',
      'workflow.onboarding.standard.custom.label',
      'workflow.onboarding.standard.custom.desc'
    ];

    locales.forEach(lang => {
      standardKeys.forEach(key => {
        expect(TRANSLATIONS[lang][key as keyof typeof TRANSLATIONS[typeof lang]]).toBeDefined();
      });
    });
  });
});
