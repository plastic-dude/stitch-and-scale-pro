import { describe, expect, it } from 'vitest';
import { PROMOTION_COPY } from './promotion-copy';

describe('Promotion Planner locale copy', () => {
  it('provides visible copy for every supported locale', () => {
    for (const locale of ['en', 'de', 'fr', 'es', 'pt'] as const) {
      const copy = PROMOTION_COPY[locale];
      expect(copy.title).toBeTruthy();
      expect(copy.description).toBeTruthy();
      expect(copy.channels).toBeTruthy();
      expect(copy.testProtocol).toBeTruthy();
      expect(copy.copy).toBeTruthy();
    }
  });

  it('translates the planner title outside English', () => {
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      expect(PROMOTION_COPY[locale].title).not.toBe(PROMOTION_COPY.en.title);
    }
  });
});
