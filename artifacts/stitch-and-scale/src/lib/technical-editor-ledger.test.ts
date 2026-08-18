import { describe, expect, it } from 'vitest';
import { createDefectLedger, importPatternQualityFlags, summarizeTechnicalDefects, updateTechnicalDefect } from './technical-editor-ledger';

describe('technical editor defect ledger', () => {
  it('imports QA findings once and preserves evidence context', () => {
    const ledger = createDefectLedger('project-1', 'rev-1');
    const flags = [{
      code: 'P-007' as const,
      source: 'structure' as const,
      severity: 'warn' as const,
      title: 'Measurement label is missing',
      detail: 'Name the measurement.',
      sectionId: 'body',
      measurementId: 'bust',
    }];
    const first = importPatternQualityFlags(ledger, flags, 'qa-1');
    const second = importPatternQualityFlags(first, flags, 'qa-1');
    expect(second.defects).toHaveLength(1);
    expect(second.defects[0].location).toBe('body/bust');
    expect(second.defects[0].status).toBe('open');
  });

  it('deduplicates and sorts affected sizes during updates', () => {
    const ledger = createDefectLedger('project-1');
    const withDefect = importPatternQualityFlags(ledger, [{
      code: 'P-003' as const,
      source: 'structure' as const,
      severity: 'error' as const,
      title: 'Gauge is incomplete',
      detail: 'Enter gauge.',
    }], 'qa-1');
    const updated = updateTechnicalDefect(withDefect, withDefect.defects[0].id, {
      affectedSizes: ['XL', 'S', 'XL', 'M'],
      status: 'fixed',
      disposition: 'verified',
    });
    expect(updated.defects[0].affectedSizes).toEqual(['M', 'S', 'XL']);
    expect(updated.defects[0].status).toBe('fixed');
  });

  it('summarizes severity, status, and test-knit handoffs', () => {
    const ledger = createDefectLedger('project-1');
    const withDefect = importPatternQualityFlags(ledger, [
      { code: 'P-003' as const, source: 'structure' as const, severity: 'error' as const, title: 'Gauge', detail: 'Bad gauge.' },
      { code: 'P-007' as const, source: 'structure' as const, severity: 'warn' as const, title: 'Label', detail: 'Missing label.' },
    ], 'qa-1');
    const handedOff = updateTechnicalDefect(withDefect, withDefect.defects[1].id, { disposition: 'requires-test-knit' });
    expect(summarizeTechnicalDefects(handedOff)).toEqual({ total: 2, open: 2, accepted: 0, fixed: 0, errors: 1, warnings: 1, requiringTestKnit: 1 });
  });
});
