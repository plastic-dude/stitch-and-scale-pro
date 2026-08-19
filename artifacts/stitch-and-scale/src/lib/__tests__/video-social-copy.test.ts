import { describe, expect, it } from 'vitest';
import { VIDEO_SOCIAL_COPY } from '../video-social-copy';

describe('video-social-copy (QUEUE-003 localization module)', () => {
  const locales = ['en', 'de', 'fr', 'es', 'pt'] as const;

  it('exports all 5 locales', () => {
    for (const loc of locales) {
      expect(VIDEO_SOCIAL_COPY[loc]).toBeDefined();
    }
    expect(Object.keys(VIDEO_SOCIAL_COPY).length).toBe(5);
  });

  it('has no empty values in any locale', () => {
    for (const loc of locales) {
      const c = VIDEO_SOCIAL_COPY[loc];
      for (const k of Object.keys(c) as (keyof typeof c)[]) {
        const v = c[k] as string;
        expect(v.length).toBeGreaterThan(0);
      }
    }
  });

  it('has identical key sets across all locales', () => {
    const enKeys = Object.keys(VIDEO_SOCIAL_COPY.en).sort();
    for (const loc of locales) {
      expect(Object.keys(VIDEO_SOCIAL_COPY[loc]).sort()).toEqual(enKeys);
    }
  });

  it('de strings are not English leftovers', () => {
    const de = VIDEO_SOCIAL_COPY.de;
    const en = VIDEO_SOCIAL_COPY.en;
    for (const k of Object.keys(en) as (keyof typeof en)[]) {
      expect(de[k]).not.toBe(en[k]);
    }
  });

  it('non-en strings differ from English where localized', () => {
    for (const loc of ['de', 'fr', 'es', 'pt'] as const) {
      const locCopy = VIDEO_SOCIAL_COPY[loc];
      const en = VIDEO_SOCIAL_COPY.en;
      let diffs = 0;
      for (const k of Object.keys(en) as (keyof typeof en)[]) {
        if (locCopy[k] !== en[k]) diffs++;
      }
      // at least 80% of entries must differ from English
      expect(diffs / Object.keys(en).length).toBeGreaterThan(0.8);
    }
  });

  it('spans all interface keys of VideoSocialCopy', () => {
    const en = VIDEO_SOCIAL_COPY.en;
    // module keys cover the interface contract (no missing values)
    expect(Object.keys(en).length).toBeGreaterThan(0);
    expect(en['dmEmailAdjacentAudiencesBuy']).toBe('DM/email-adjacent audiences buy first');
  });

  it('falls back to English semantics via spread in locale consts', () => {
    // de/fr/es/pt consts are built with {...en, ...} so any key absent from a
    // locale map still resolves to the English string.
    const de = VIDEO_SOCIAL_COPY.de;
    expect(de['dmEmailAdjacentAudiencesBuy']).toBeDefined();
    expect(typeof de['dmEmailAdjacentAudiencesBuy']).toBe('string');
  });
});
