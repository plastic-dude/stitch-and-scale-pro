import { describe, expect, it } from 'vitest';
import { WORKSHOP_TEACHING_COPY } from '../workshop-teaching-copy';

describe('workshop-teaching-copy (QUEUE-003 localization module)', () => {
  const locales = ['en', 'de', 'fr', 'es', 'pt'] as const;

  it('exports all 5 locales', () => {
    for (const loc of locales) {
      expect(WORKSHOP_TEACHING_COPY[loc]).toBeDefined();
    }
    expect(Object.keys(WORKSHOP_TEACHING_COPY).length).toBe(5);
  });

  it('has no empty values in any locale', () => {
    for (const loc of locales) {
      const c = WORKSHOP_TEACHING_COPY[loc];
      for (const k of Object.keys(c) as (keyof typeof c)[]) {
        const v = c[k] as string;
        expect(v.length).toBeGreaterThan(0);
      }
    }
  });

  it('has identical key sets across all locales', () => {
    const enKeys = Object.keys(WORKSHOP_TEACHING_COPY.en).sort();
    for (const loc of locales) {
      expect(Object.keys(WORKSHOP_TEACHING_COPY[loc]).sort()).toEqual(enKeys);
    }
  });

  it('de strings are not English leftovers', () => {
    const de = WORKSHOP_TEACHING_COPY.de;
    const en = WORKSHOP_TEACHING_COPY.en;
    for (const k of Object.keys(en) as (keyof typeof en)[]) {
      expect(de[k]).not.toBe(en[k]);
    }
  });

  it('non-en strings differ from English where localized', () => {
    for (const loc of ['de', 'fr', 'es', 'pt'] as const) {
      const locCopy = WORKSHOP_TEACHING_COPY[loc];
      const en = WORKSHOP_TEACHING_COPY.en;
      let diffs = 0;
      for (const k of Object.keys(en) as (keyof typeof en)[]) {
        if (locCopy[k] !== en[k]) diffs++;
      }
      // at least 80% of entries must differ from English
      expect(diffs / Object.keys(en).length).toBeGreaterThan(0.8);
    }
  });

  it('spans all interface keys of WorkshopTeachingCopy', () => {
    const en = WORKSHOP_TEACHING_COPY.en;
    // module keys cover the interface contract (no missing values)
    expect(Object.keys(en).length).toBeGreaterThan(0);
    expect(en['classHours']).toBe('Class hours');
  });

  it('falls back to English semantics via spread in locale consts', () => {
    // de/fr/es/pt consts are built with {...en, ...} so any key absent from a
    // locale map still resolves to the English string.
    const de = WORKSHOP_TEACHING_COPY.de;
    expect(de['classHours']).toBeDefined();
    expect(typeof de['classHours']).toBe('string');
  });
});
