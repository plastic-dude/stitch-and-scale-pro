import { describe, expect, it } from 'vitest';
import { YARN_POOL_COPY } from './yarn-pool-copy';

describe('Yarn Pool Lab locale copy', () => {
  it('provides visible copy for all supported locales', () => {
    for (const locale of ['en', 'de', 'fr', 'es', 'pt'] as const) {
      const copy = YARN_POOL_COPY[locale];
      expect(copy.title).toBeTruthy();
      expect(copy.description).toBeTruthy();
      expect(copy.colorways).toBeTruthy();
      expect(copy.members).toBeTruthy();
      expect(copy.pooledNumbers).toBeTruthy();
      expect(copy.warnings).toBeTruthy();
    }
  });

  it('does not reuse the English title for translated locales', () => {
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      expect(YARN_POOL_COPY[locale].title).not.toBe(YARN_POOL_COPY.en.title);
    }
  });
});
