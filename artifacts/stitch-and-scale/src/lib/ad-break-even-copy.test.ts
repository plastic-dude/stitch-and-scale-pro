import { describe, expect, it } from 'vitest';
import { AD_BREAK_EVEN_COPY } from './ad-break-even-copy';

describe('Ad Break-Even copy catalogue', () => {
  it('contains translated primary vocabulary in all supported locales', () => {
    const keys = Object.keys(AD_BREAK_EVEN_COPY.en) as Array<keyof typeof AD_BREAK_EVEN_COPY.en>;
    expect(Object.keys(AD_BREAK_EVEN_COPY)).toHaveLength(5);
    for (const locale of Object.values(AD_BREAK_EVEN_COPY)) {
      for (const key of keys) expect(locale[key], key).toBeTruthy();
    }
    for (const language of ['de', 'fr', 'es', 'pt'] as const) {
      expect(AD_BREAK_EVEN_COPY[language].title).not.toBe(AD_BREAK_EVEN_COPY.en.title);
      expect(AD_BREAK_EVEN_COPY[language].budgetVerdict).not.toBe(AD_BREAK_EVEN_COPY.en.budgetVerdict);
    }
  });
});
