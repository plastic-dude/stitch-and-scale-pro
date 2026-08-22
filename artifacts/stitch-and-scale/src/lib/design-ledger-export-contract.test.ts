import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DESIGN_LEDGER_COPY } from './design-ledger-copy';

const ledgerSource = readFileSync(new URL('../components/design-ledger-card.tsx', import.meta.url), 'utf8');
const locales = Object.values(DESIGN_LEDGER_COPY);

describe('Design Ledger browser CSV export contract', () => {
  it('creates a CSV Blob, requests the named browser download, and delays URL cleanup', () => {
    expect(ledgerSource).toContain('new Blob([csv], { type: "text/csv;charset=utf-8" })');
    expect(ledgerSource).toContain('a.download = "design-ledger.csv"');
    expect(ledgerSource).toContain('a.click();');
    expect(ledgerSource).toContain('window.setTimeout(() => URL.revokeObjectURL(url), 0);');
    expect(ledgerSource).not.toContain('URL.revokeObjectURL(url);\n    toast');
  });

  it('reports a browser download request rather than claiming durable delivery', () => {
    expect(ledgerSource).toContain('copy.csvDownloadRequested');
    expect(ledgerSource).not.toContain('copy.csvDownloaded');

    for (const copy of locales) {
      expect(copy.csvDownloadRequested.length).toBeGreaterThan(0);
      expect(copy.csvDownloadRequested).not.toMatch(/downloaded|heruntergeladen|téléchargé|descargado|descarregado/i);
    }

    expect(DESIGN_LEDGER_COPY.en.csvDownloadRequested).toContain('Download requested');
    expect(DESIGN_LEDGER_COPY.en.csvDownloadRequested).toContain('check your downloads');
  });
});
