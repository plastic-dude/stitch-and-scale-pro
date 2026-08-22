import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getBragCardCopy } from './brag-copy';

const cardSource = readFileSync(new URL('../components/brag-card-card.tsx', import.meta.url), 'utf8');
const locales = ['en', 'de', 'fr', 'es', 'pt'] as const;

describe('Brag Card browser export contract', () => {
  it('uses one PNG artifact for download and native share', () => {
    expect(cardSource).toContain('function buildBragCardPng(svg: string): Promise<Blob>');
    expect(cardSource).toContain('const png = await buildBragCardPng(svg);');
    expect(cardSource).toContain('new File([png], `brag-card-${template}.png`, { type: "image/png" })');
    expect(cardSource).not.toContain('new File([blob], "brag-card.svg", { type: "image/svg+xml" })');
    expect(cardSource).toContain('navigator.canShare({ files: [file] })');
  });

  it('reports only browser/device handoff outcomes and does not claim a saved file', () => {
    expect(cardSource).toContain('copy.downloadRequested');
    expect(cardSource).toContain('copy.downloadRequestedDescription');
    expect(cardSource).toContain('copy.shareRequestAccepted');
    expect(cardSource).toContain('copy.shareRequestDescription');
    expect(cardSource).not.toContain('copy.cardSaved');
    expect(cardSource).not.toContain('copy.pngReady');
    expect(cardSource).toContain('disabled={!hasData}');
  });

  it('keeps the handoff language localized and free of durable-save claims', () => {
    for (const locale of locales) {
      const copy = getBragCardCopy(locale);
      expect(copy.downloadRequested.length).toBeGreaterThan(0);
      expect(copy.downloadRequestedDescription.length).toBeGreaterThan(0);
      expect(copy.shareRequestAccepted.length).toBeGreaterThan(0);
      expect(copy.shareRequestDescription.length).toBeGreaterThan(0);
      expect(`${copy.downloadRequested} ${copy.downloadRequestedDescription} ${copy.shareRequestAccepted} ${copy.shareRequestDescription}`).not.toMatch(/card saved|karte gespeichert|carte enregistrée|tarjeta guardada|cartão guardado|png ready|png prêt|png listo|png pronto/i);
    }

    expect(getBragCardCopy('en').downloadRequested).toBe('Download requested');
    expect(getBragCardCopy('en').downloadRequestedDescription).toContain('Check your downloads.');
    expect(getBragCardCopy('en').shareRequestAccepted).toBe('Share request accepted');
    expect(getBragCardCopy('en').shareRequestDescription).toContain('selected app');
  });
});
