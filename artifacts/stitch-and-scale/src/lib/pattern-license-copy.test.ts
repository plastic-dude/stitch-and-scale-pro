import { describe, expect, it } from 'vitest';
import { PATTERN_LICENSE_COPY } from './pattern-license-copy';

describe('Pattern License Planner locale copy', () => {
  it('provides complete visible copy for every supported locale', () => {
    for (const locale of ['en', 'de', 'fr', 'es', 'pt'] as const) {
      const copy = PATTERN_LICENSE_COPY[locale];
      expect(copy.title).toBeTruthy();
      expect(copy.description).toBeTruthy();
      expect(copy.yarnWeight).toBeTruthy();
      expect(copy.dealStructure).toBeTruthy();
      expect(copy.rightsAudit).toBeTruthy();
      expect(copy.keepVsSell(24, '$10', '$8', copy.sellWinsBy, '$2')).toContain('$10');
      expect(copy.rightsAuditPassed(8)).toContain('8');
    }
  });

  it('does not silently reuse the English title for translated locales', () => {
    const english = PATTERN_LICENSE_COPY.en.title;
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      expect(PATTERN_LICENSE_COPY[locale].title).not.toBe(english);
    }
  });
});
