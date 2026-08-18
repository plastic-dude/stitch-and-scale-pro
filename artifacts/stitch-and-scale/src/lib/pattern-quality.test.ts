import { describe, expect, it } from 'vitest';
import { generateId, type PatternProject } from '@/lib/grading-engine';
import { validatePatternQuality } from './pattern-quality';

function makeProject(overrides: Partial<PatternProject> = {}): PatternProject {
  return {
    id: generateId(),
    name: 'QA Crewneck',
    author: 'Tester',
    baseSize: 'M',
    gauge: { stitchesPer4In: 18, rowsPer4In: 24, unit: 'in' },
    sections: [
      {
        id: 'body',
        name: 'Body',
        measurements: [
          {
            id: 'body-bust',
            label: 'Bust circumference',
            measurementType: 'circumference',
            gradingKey: 'bust',
            baseValue: 45,
            stitchRepeat: 6,
            stitchRemainder: 2,
          },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('pattern-quality', () => {
  it('passes a well-formed project while preserving the proven grading result', () => {
    const result = validatePatternQuality(makeProject());

    expect(result.verdict).toBe('ready');
    expect(result.flags).toHaveLength(0);
    expect(result.sectionCount).toBe(1);
    expect(result.measurementCount).toBe(1);
    expect(result.checkedSizeCount).toBe(9);
    expect(result.grading?.verdict).toBe('ready');
  });

  it('blocks a project with an invalid gauge before it can be published', () => {
    const result = validatePatternQuality(makeProject({
      gauge: { stitchesPer4In: 0, rowsPer4In: 24, unit: 'in' },
    }));

    expect(result.flags.some((flag) => flag.code === 'P-003' && flag.severity === 'error')).toBe(true);
    expect(result.verdict).toBe('blocked');
  });

  it('blocks an empty section and reports no checked sizes rather than inventing coverage', () => {
    const result = validatePatternQuality(makeProject({
      sections: [{ id: 'empty', name: 'Sleeve', measurements: [] }],
    }));

    expect(result.flags.some((flag) => flag.code === 'P-005')).toBe(true);
    expect(result.checkedSizeCount).toBe(0);
    expect(result.verdict).toBe('blocked');
  });

  it('blocks duplicate identifiers so exports remain traceable', () => {
    const result = validatePatternQuality(makeProject({
      sections: [{
        id: 'body',
        name: 'Body',
        measurements: [{
          id: 'body',
          label: 'Bust circumference',
          measurementType: 'circumference',
          gradingKey: 'bust',
          baseValue: 45,
        }],
      }],
    }));

    expect(result.flags.filter((flag) => flag.code === 'P-006').length).toBeGreaterThanOrEqual(1);
    expect(result.verdict).toBe('blocked');
  });

  it('blocks a custom project with no frozen chart instead of trusting CYC silently', () => {
    const result = validatePatternQuality(makeProject({
      sizingStandard: 'Custom',
      customStandardSnapshot: undefined,
    }));

    expect(result.flags.some((flag) => flag.code === 'P-009' && flag.severity === 'error')).toBe(true);
    expect(result.verdict).toBe('blocked');
  });

  it('preserves existing grading-lab warnings as grading-sourced evidence', () => {
    const result = validatePatternQuality(makeProject({
      gauge: { stitchesPer4In: 3, rowsPer4In: 24, unit: 'in' },
    }));

    expect(result.flags.some((flag) => flag.code === 'G-06' && flag.source === 'grading')).toBe(true);
    expect(result.flags.some((flag) => flag.code === 'P-003' && flag.source === 'structure')).toBe(false);
  });
});
