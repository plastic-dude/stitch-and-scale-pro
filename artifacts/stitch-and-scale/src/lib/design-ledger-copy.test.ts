import { describe, expect, it } from 'vitest';
import { DESIGN_LEDGER_COPY } from './design-ledger-copy';

describe('Design Ledger copy catalogue', () => {
  it('contains the complete visible records-room vocabulary in every supported locale', () => {
    const locales = Object.values(DESIGN_LEDGER_COPY);
    const keys = Object.keys(DESIGN_LEDGER_COPY.en) as Array<keyof typeof DESIGN_LEDGER_COPY.en>;
    expect(locales).toHaveLength(5);
    for (const locale of locales) {
      for (const key of keys) {
        expect(locale[key], key).toBeTruthy();
      }
    }
    expect(DESIGN_LEDGER_COPY.de.title).not.toBe(DESIGN_LEDGER_COPY.en.title);
    expect(DESIGN_LEDGER_COPY.fr.title).not.toBe(DESIGN_LEDGER_COPY.en.title);
    expect(DESIGN_LEDGER_COPY.es.title).not.toBe(DESIGN_LEDGER_COPY.en.title);
    expect(DESIGN_LEDGER_COPY.pt.title).not.toBe(DESIGN_LEDGER_COPY.en.title);
  });
});
