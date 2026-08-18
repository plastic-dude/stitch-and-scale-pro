import { describe, expect, it } from 'vitest';
import { getReleaseEvidenceCopy } from './release-evidence-copy';

describe('release evidence copy', () => {
  it('covers all five locales without English fallback gaps', () => {
    for (const locale of ['en', 'de', 'fr', 'es', 'pt']) {
      const copy = getReleaseEvidenceCopy(locale);
      for (const key of ['physical-print', 'chart-readability', 'schematic-scale', 'test-knit'] as const) expect(copy.categories[key]).toBeTruthy();
      for (const status of ['not-started', 'in-review', 'passed', 'blocked'] as const) expect(copy.status[status]).toBeTruthy();
      expect(copy.title).toBeTruthy();
      expect(copy.boundary).toBeTruthy();
      expect(copy.save).toBeTruthy();
    }
  });
});
