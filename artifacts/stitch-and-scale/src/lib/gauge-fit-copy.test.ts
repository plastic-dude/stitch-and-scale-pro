import { describe, expect, it } from 'vitest';
import { GAUGE_FIT_COPY } from './gauge-fit-copy';

describe('Gauge & Fit copy catalogue', () => {
  it('contains translated control and result vocabulary in all supported locales', () => {
    const keys = Object.keys(GAUGE_FIT_COPY.en) as Array<keyof typeof GAUGE_FIT_COPY.en>;
    expect(Object.keys(GAUGE_FIT_COPY)).toHaveLength(5);
    for (const locale of Object.values(GAUGE_FIT_COPY)) {
      for (const key of keys) expect(locale[key], key).toBeTruthy();
    }
    for (const language of ['de', 'fr', 'es', 'pt'] as const) {
      expect(GAUGE_FIT_COPY[language].title).not.toBe(GAUGE_FIT_COPY.en.title);
      expect(GAUGE_FIT_COPY[language].recommended).not.toBe(GAUGE_FIT_COPY.en.recommended);
    }
  });
});
