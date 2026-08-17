import { describe, expect, it } from 'vitest';
import { DEALS_COPY } from './deals-copy';

describe('Deal Comparator copy catalogue', () => {
  it('contains the primary deal surface in all supported locales', () => {
    const keys = Object.keys(DEALS_COPY.en) as Array<keyof typeof DEALS_COPY.en>;
    expect(Object.keys(DEALS_COPY)).toHaveLength(5);
    for (const locale of Object.values(DEALS_COPY)) {
      for (const key of keys) expect(locale[key], key).toBeTruthy();
    }
    for (const language of ['de', 'fr', 'es', 'pt'] as const) {
      expect(DEALS_COPY[language].title).not.toBe(DEALS_COPY.en.title);
      expect(DEALS_COPY[language].copyTerms).not.toBe(DEALS_COPY.en.copyTerms);
    }
  });
});
