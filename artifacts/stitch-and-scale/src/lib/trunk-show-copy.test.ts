import { describe, expect, it } from 'vitest';
import { TRUNK_SHOW_COPY } from './trunk-show-copy';

describe('Trunk Show Planner locale copy', () => {
  it('provides visible copy for all supported locales', () => {
    for (const locale of ['en', 'de', 'fr', 'es', 'pt'] as const) {
      const copy = TRUNK_SHOW_COPY[locale];
      expect(copy.title).toBeTruthy();
      expect(copy.trunkShop).toBeTruthy();
      expect(copy.expectedCopies).toBeTruthy();
      expect(copy.licenses).toBeTruthy();
      expect(copy.copyFailed).toBeTruthy();
    }
  });

  it('does not reuse the English title for translated locales', () => {
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      expect(TRUNK_SHOW_COPY[locale].title).not.toBe(TRUNK_SHOW_COPY.en.title);
    }
  });
});
