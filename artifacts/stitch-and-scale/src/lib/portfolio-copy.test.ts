import { describe, expect, it } from 'vitest';
import { PORTFOLIO_COPY } from './portfolio-copy';

describe('Portfolio copy catalogue', () => {
  it('contains the full portfolio surface in all supported locales', () => {
    const keys = Object.keys(PORTFOLIO_COPY.en) as Array<keyof typeof PORTFOLIO_COPY.en>;
    expect(Object.keys(PORTFOLIO_COPY)).toHaveLength(5);
    for (const locale of Object.values(PORTFOLIO_COPY)) {
      for (const key of keys) expect(locale[key], key).toBeTruthy();
    }
    for (const language of ['de', 'fr', 'es', 'pt'] as const) {
      expect(PORTFOLIO_COPY[language].title).not.toBe(PORTFOLIO_COPY.en.title);
      expect(PORTFOLIO_COPY[language].ranking).not.toBe(PORTFOLIO_COPY.en.ranking);
    }
  });
});
