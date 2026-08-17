import { describe, expect, it } from 'vitest';
import { MEMBERSHIP_COPY } from './membership-copy';

describe('Membership Planner locale copy', () => {
  it('provides visible copy for all supported locales', () => {
    for (const locale of ['en', 'de', 'fr', 'es', 'pt'] as const) {
      const copy = MEMBERSHIP_COPY[locale];
      expect(copy.title).toBeTruthy();
      expect(copy.description).toBeTruthy();
      expect(copy.tiers).toBeTruthy();
      expect(copy.addTier).toBeTruthy();
      expect(copy.tierCopy).toBeTruthy();
      expect(copy.memberChurn(10, 2)).toContain('10');
      expect(copy.breakeven(12)).toContain('12');
    }
  });

  it('uses translated titles rather than silently falling back to English', () => {
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      expect(MEMBERSHIP_COPY[locale].title).not.toBe(MEMBERSHIP_COPY.en.title);
    }
  });
});
