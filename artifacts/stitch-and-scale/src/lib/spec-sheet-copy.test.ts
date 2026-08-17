import { describe, expect, it } from 'vitest';
import { getSpecFlagMessage, getSpecFlagTitle, getSpecGaugeLine, getSpecSheetCopy, getSpecVerdictReason, getSpecYarnLabel } from './spec-sheet-copy';

describe('spec sheet copy', () => {
  it('provides the five supported locale shells', () => {
    for (const locale of ['en', 'de', 'fr', 'es', 'pt']) {
      const copy = getSpecSheetCopy(locale);
      expect(copy.title).not.toBe('');
      expect(copy.description).not.toBe('');
      expect(copy.flags).not.toBe('');
    }
  });

  it('localizes dynamic flag titles and retains the code', () => {
    expect(getSpecFlagTitle('de', 'S-04')).toBe('Vollständigkeit der Garnaufstellung');
    expect(getSpecFlagTitle('fr', 'S-02')).toBe('Bande de tolérance');
    expect(getSpecFlagMessage('fr', 'S-02', 'Tolerance band ±0.25in per point — the documented knitwear norm.')).toContain('±0.25');
  });

  it('localizes analyzer output without changing numeric gauge data', () => {
    expect(getSpecGaugeLine('de', 'Machine gauge: 8 gauge flat-bed')).toContain('Maschinenfeinheit');
    expect(getSpecYarnLabel('pt', 'Estimated yardage (base size)')).toContain('Metragem');
    expect(getSpecVerdictReason('es', 'review', 4)).toContain('4/6');
  });
});
