import { describe, expect, it } from 'vitest';
import { getHandoffCopy } from './handoff-copy';

const locales = ['en', 'de', 'fr', 'es', 'pt'] as const;

describe('technical handoff browser-download copy', () => {
  it('provides a truthful handoff request message in every supported locale', () => {
    for (const locale of locales) {
      const copy = getHandoffCopy(locale);
      expect(copy.download.length).toBeGreaterThan(0);
      expect(copy.downloadRequested.length).toBeGreaterThan(0);
      expect(copy.downloadRequestedDescription.length).toBeGreaterThan(0);
      expect(`${copy.downloadRequested} ${copy.downloadRequestedDescription}`).not.toMatch(/downloaded|saved|gespeichert|heruntergeladen|téléchargé|enregistré|descargado|guardado|descarregado|guardado/i);
    }
  });

  it('describes the browser request without claiming durable delivery', () => {
    const copy = getHandoffCopy('en');
    expect(copy.downloadRequested).toBe('Download requested');
    expect(copy.downloadRequestedDescription).toContain('Check your downloads');
  });

  it('falls back to English for unknown locales', () => {
    expect(getHandoffCopy('xx')).toEqual(getHandoffCopy('en'));
  });
});
