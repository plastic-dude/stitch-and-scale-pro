import { describe, expect, it } from 'vitest';
import { getHumanReviewCopy } from '@/lib/human-review-copy';

describe('human review copy', () => {
  it('provides every review status in every supported language', () => {
    for (const locale of ['en', 'de', 'fr', 'es', 'pt']) {
      const copy = getHumanReviewCopy(locale);
      expect(copy.title).toBeTruthy();
      expect(copy.statusLabels['not-reviewed']).toBeTruthy();
      expect(copy.statusLabels['in-review']).toBeTruthy();
      expect(copy.statusLabels['changes-requested']).toBeTruthy();
      expect(copy.statusLabels.approved).toBeTruthy();
      expect(copy.approve).toBeTruthy();
    }
  });

  it('falls back safely for an unknown locale', () => {
    expect(getHumanReviewCopy('xx').title).toBe(getHumanReviewCopy('en').title);
    expect(getHumanReviewCopy('es-MX').statusLabels.approved).toContain('Aprob');
  });
});
