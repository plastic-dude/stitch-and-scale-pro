import { describe, it, expect } from 'vitest';
import { COLLABORATION_COPY } from '../collaboration-copy';
import { LanguageCode } from '../i18n';

describe('Sample Tracker Localization', () => {
  const locales: LanguageCode[] = ['en', 'de', 'fr', 'es', 'pt'];

  it('has all required sample tracker labels for all locales', () => {
    locales.forEach(lang => {
      const copy = COLLABORATION_COPY[lang];
      expect(copy.sampleTracker).toBeDefined();
      expect(copy.addSample).toBeDefined();
      expect(copy.labelLabel).toBeDefined();
      expect(copy.borrowerLabel).toBeDefined();
      expect(copy.loanDateLabel).toBeDefined();
      expect(copy.returnDueDateLabel).toBeDefined();
      expect(copy.notesLabel).toBeDefined();
      expect(copy.noSamples).toBeDefined();
      expect(copy.deleteSampleConfirm).toBeDefined();
      expect(copy.sampleUpdated).toBeDefined();
      expect(copy.loaned).toBeDefined();
      expect(copy.returned).toBeDefined();
      expect(copy.sold).toBeDefined();
      expect(copy.lost).toBeDefined();
    });
  });

  it('uses informal German for sample tracker', () => {
    const de = COLLABORATION_COPY.de;
    expect(de.deleteSampleConfirm).toContain('Bist du sicher');
    expect(de.deleteSampleConfirm).toContain('möchtest');
  });
});
