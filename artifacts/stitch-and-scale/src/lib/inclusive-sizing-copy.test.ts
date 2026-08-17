import { describe, expect, it } from 'vitest';
import { INCLUSIVE_SIZING_COPY } from './inclusive-sizing-copy';

describe('Inclusive Sizing copy catalogue', () => {
  it('contains the visible sizing and audit surface in all supported locales', () => {
    const keys = Object.keys(INCLUSIVE_SIZING_COPY.en) as Array<keyof typeof INCLUSIVE_SIZING_COPY.en>;
    expect(Object.keys(INCLUSIVE_SIZING_COPY)).toHaveLength(5);
    for (const locale of Object.values(INCLUSIVE_SIZING_COPY)) {
      for (const key of keys) expect(locale[key], key).toBeTruthy();
      for (const key of Object.keys(locale.dynamic) as Array<keyof typeof locale.dynamic>) {
        expect(locale.dynamic[key], `dynamic.${String(key)}`).toBeTruthy();
      }
    }
    for (const language of ['de', 'fr', 'es', 'pt'] as const) {
      expect(INCLUSIVE_SIZING_COPY[language].title).not.toBe(INCLUSIVE_SIZING_COPY.en.title);
      expect(INCLUSIVE_SIZING_COPY[language].copyLaunch).not.toBe(INCLUSIVE_SIZING_COPY.en.copyLaunch);
      expect(INCLUSIVE_SIZING_COPY[language].dynamic.newTitle).not.toBe(INCLUSIVE_SIZING_COPY.en.dynamic.newTitle);
    }
  });
});
