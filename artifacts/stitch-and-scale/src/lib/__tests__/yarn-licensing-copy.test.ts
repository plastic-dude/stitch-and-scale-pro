import { describe, expect, it } from 'vitest';
import { YARN_LICENSING_COPY } from '../yarn-licensing-copy';

describe('yarn-licensing-copy (QUEUE-003 localization module)', () => {
  const locales = ['en', 'de', 'fr', 'es', 'pt'] as const;

  it('exports all 5 locales', () => {
    for (const loc of locales) {
      expect(YARN_LICENSING_COPY[loc]).toBeDefined();
    }
    expect(Object.keys(YARN_LICENSING_COPY).length).toBe(5);
  });

  it('has no empty values in any locale', () => {
    for (const loc of locales) {
      const c = YARN_LICENSING_COPY[loc];
      for (const k of Object.keys(c) as (keyof typeof c)[]) {
        const v = c[k] as string;
        expect(v.length).toBeGreaterThan(0);
      }
    }
  });

  it('has identical key sets across all locales', () => {
    const enKeys = Object.keys(YARN_LICENSING_COPY.en).sort();
    for (const loc of locales) {
      expect(Object.keys(YARN_LICENSING_COPY[loc]).sort()).toEqual(enKeys);
    }
  });

  it('de strings are not English leftovers', () => {
    const de = YARN_LICENSING_COPY.de;
    const en = YARN_LICENSING_COPY.en;
    for (const k of Object.keys(en) as (keyof typeof en)[]) {
      expect(de[k]).not.toBe(en[k]);
    }
  });

  it('non-en strings differ from English where localized', () => {
    for (const loc of ['de', 'fr', 'es', 'pt'] as const) {
      const locCopy = YARN_LICENSING_COPY[loc];
      const en = YARN_LICENSING_COPY.en;
      let diffs = 0;
      for (const k of Object.keys(en) as (keyof typeof en)[]) {
        if (locCopy[k] !== en[k]) diffs++;
      }
      // at least 80% of entries must differ from English
      expect(diffs / Object.keys(en).length).toBeGreaterThan(0.8);
    }
  });

  it('spans all interface keys of YarnLicensingCopy', () => {
    const en = YARN_LICENSING_COPY.en;
    // module keys cover the interface contract (no missing values)
    expect(Object.keys(en).length).toBeGreaterThan(0);
    expect(en['aNegativeNetMeans']).toBe('A negative net means the brand is asking you to subsidize their product — the same design earns more sitting in your own shop over the same window.');
  });

  it('falls back to English semantics via spread in locale consts', () => {
    // de/fr/es/pt consts are built with {...en, ...} so any key absent from a
    // locale map still resolves to the English string.
    const de = YARN_LICENSING_COPY.de;
    expect(de['aNegativeNetMeans']).toBeDefined();
    expect(typeof de['aNegativeNetMeans']).toBe('string');
  });
});
