import { describe, expect, it } from 'vitest';
import { getChartCopy } from './chart-copy';

describe('Chart Lab locale copy', () => {
  it('provides complete visible copy for every supported locale', () => {
    for (const locale of ['en', 'de', 'fr', 'es', 'pt']) {
      const copy = getChartCopy(locale);
      expect(copy.title).toBeTruthy();
      expect(copy.description).toBeTruthy();
      expect(copy.verdictLabels.ready).toBeTruthy();
      expect(copy.verdictLabels.review).toBeTruthy();
      expect(copy.verdictLabels.blocked).toBeTruthy();
      expect(copy.severityLabels.error).toBeTruthy();
      expect(copy.severityLabels.warn).toBeTruthy();
      expect(copy.severityLabels.info).toBeTruthy();
      for (const code of ['C-01', 'C-02', 'C-03', 'C-04', 'C-05', 'C-06', 'C-07']) {
        expect(copy.flagTitles[code]).toBeTruthy();
      }
    }
  });

  it('normalizes regional locale tags and falls back safely', () => {
    expect(getChartCopy('de-DE').title).toBe(getChartCopy('de').title);
    expect(getChartCopy('pt-BR').title).toBe(getChartCopy('pt').title);
    expect(getChartCopy('nl').title).toBe(getChartCopy('en').title);
  });

  it('does not use the English title for translated locales', () => {
    const english = getChartCopy('en');
    for (const locale of ['de', 'fr', 'es', 'pt']) {
      expect(getChartCopy(locale).title).not.toBe(english.title);
    }
  });
});

