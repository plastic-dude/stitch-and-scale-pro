import { describe, expect, it } from 'vitest';
import { GIFTCARD_COPY, giftCardFlagTitle, giftCardVerdictLabel } from './giftcard-copy';

describe('Gift Card copy catalogue', () => {
  it('contains the primary visible vocabulary in all supported locales', () => {
    const keys = Object.keys(GIFTCARD_COPY.en) as Array<keyof typeof GIFTCARD_COPY.en>;
    expect(Object.keys(GIFTCARD_COPY)).toHaveLength(5);
    for (const locale of Object.values(GIFTCARD_COPY)) {
      for (const key of keys) expect(locale[key], key).toBeTruthy();
    }
    expect(GIFTCARD_COPY.de.intro).not.toBe(GIFTCARD_COPY.en.intro);
    expect(GIFTCARD_COPY.fr.intro).not.toBe(GIFTCARD_COPY.en.intro);
    expect(GIFTCARD_COPY.es.intro).not.toBe(GIFTCARD_COPY.en.intro);
    expect(GIFTCARD_COPY.pt.intro).not.toBe(GIFTCARD_COPY.en.intro);
    const verdict = 'Do not sell cards — liability exceeds float';
    for (const language of ['de', 'fr', 'es', 'pt'] as const) {
      expect(giftCardVerdictLabel(language, verdict)).not.toBe(verdict);
      expect(giftCardFlagTitle(language, 'GC-01', 'fallback')).not.toBe('fallback');
    }
  });
});
