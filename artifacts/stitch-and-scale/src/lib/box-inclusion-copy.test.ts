import { describe, expect, it } from 'vitest';
import { BOX_INCLUSION_COPY } from './box-inclusion-copy';

describe('Box Inclusion copy catalogue', () => {
  it('contains translated primary vocabulary in every supported locale', () => {
    const locales = Object.values(BOX_INCLUSION_COPY);
    expect(locales).toHaveLength(5);
    for (const copy of locales) {
      expect(copy.title).toBeTruthy();
      expect(copy.description).toBeTruthy();
      expect(copy.offer).toBeTruthy();
      expect(copy.watch).toBeTruthy();
      expect(copy.verdict).toBeTruthy();
      expect(copy.anchors).toBeTruthy();
      for (const key of ['boxName','subscribers','designFee','royalty','funnel','worth','direct','netEv','breakEven']) {
        expect(copy[key as keyof typeof copy]).toBeTruthy();
      }
    }
    expect(BOX_INCLUSION_COPY.de.title).not.toBe(BOX_INCLUSION_COPY.en.title);
    expect(BOX_INCLUSION_COPY.fr.title).not.toBe(BOX_INCLUSION_COPY.en.title);
    expect(BOX_INCLUSION_COPY.es.title).not.toBe(BOX_INCLUSION_COPY.en.title);
    expect(BOX_INCLUSION_COPY.pt.title).not.toBe(BOX_INCLUSION_COPY.en.title);
  });
});
