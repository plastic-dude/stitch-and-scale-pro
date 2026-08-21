import { describe, it, expect } from 'vitest';
import { analyzeProjectValidity, isProjectValid } from '@/lib/project-validity';
import { PatternProject } from '@/lib/grading-engine';
import { SAMPLE_CREW_NECK_SWEATER } from '@/lib/sample-projects';

function withBadBase(project: PatternProject, bad: Array<{ section: number; measurement: number; value: number }>): PatternProject {
  const sections = project.sections.map((s, si) => ({
    ...s,
    measurements: s.measurements.map((m, mi) => {
      const hit = bad.find(b => b.section === si && b.measurement === mi);
      return hit ? { ...m, baseValue: hit.value } : m;
    }),
  }));
  return { ...project, sections };
}

// QUEUE-017-GATE: the workspace status chip must reflect project data quality.
// A project containing impossible measurements (non-finite, zero, or negative
// base values) is labeled "invalid" — the same predicate that blocks the
// grading lab (G-09) — and the label must never be silently stored.

describe('analyzeProjectValidity — QUEUE-017-GATE', () => {
  it('marks a healthy sample project valid', () => {
    const report = analyzeProjectValidity(SAMPLE_CREW_NECK_SWEATER);
    expect(isProjectValid(report)).toBe(true);
    expect(report.level).toBe('valid');
    expect(report.reason).toBe('');
  });

  it('marks a project invalid when any base value is zero', () => {
    const report = analyzeProjectValidity(withBadBase(SAMPLE_CREW_NECK_SWEATER, [{ section: 0, measurement: 0, value: 0 }]));
    expect(report.level).toBe('invalid');
    expect(report.reason).toContain('impossible measurement');
    expect(report.badMeasurements.length).toBeGreaterThan(0);
  });

  it('marks a project invalid for negative base values', () => {
    const report = analyzeProjectValidity(withBadBase(SAMPLE_CREW_NECK_SWEATER, [{ section: 0, measurement: 0, value: -9 }]));
    expect(isProjectValid(report)).toBe(false);
  });

  it('marks a project invalid for non-finite base values (NaN / Infinity)', () => {
    for (const v of [NaN, Infinity, -Infinity]) {
      const report = analyzeProjectValidity(withBadBase(SAMPLE_CREW_NECK_SWEATER, [{ section: 0, measurement: 0, value: v }]));
      expect(report.level, `value ${v}`).toBe('invalid');
    }
  });

  it('lists the bad measurements with the audited G-09 phrasing ("label" (value))', () => {
    const report = analyzeProjectValidity(withBadBase(SAMPLE_CREW_NECK_SWEATER, [{ section: 0, measurement: 0, value: 0 }]));
    expect(report.reason).toMatch(/^1 impossible measurement: /);
    expect(report.reason).toMatch(/[“"“]\w[^“"“]*[”"”] \(0\)/);
  });

  it('caps the shown measurement list at 3 with a "+N more" suffix', () => {
    // SAMPLE_CREW_NECK_SWEATER has exactly 3 measurements in its first
    // section, so put the overflow in a second section (the analyzer walks
    // all sections and measurements).
    // Body (3 measurements) + Sleeve (3) + Neckline (3) = 9 possible; mark 5.
    const bad = [
      { section: 0, measurement: 0, value: 0 },
      { section: 0, measurement: 1, value: 0 },
      { section: 1, measurement: 0, value: 0 },
      { section: 1, measurement: 1, value: 0 },
      { section: 2, measurement: 0, value: 0 },
    ];
    const report = analyzeProjectValidity(withBadBase(SAMPLE_CREW_NECK_SWEATER, bad));
    expect(report.reason).toContain('+2 more');
    // at most three quoted measurement names shown
    expect((report.reason.match(/[“”"]/g) || []).length / 2).toBeLessThanOrEqual(3);
  });

  it('aggregates across all sections and measurements', () => {
    const project = withBadBase(SAMPLE_CREW_NECK_SWEATER, [
      { section: 0, measurement: 0, value: 0 },
      { section: 1, measurement: 0, value: -1 },
    ]);
    expect(analyzeProjectValidity(project).reason).toMatch(/^2 impossible measurements/);
  });

  it('never counts a positive finite measurement as invalid', () => {
    const report = analyzeProjectValidity(SAMPLE_CREW_NECK_SWEATER);
    expect(report.badMeasurements.every(m => m.baseValue <= 0 || !Number.isFinite(m.baseValue))).toBe(true);
    expect(report.badMeasurements).toHaveLength(0);
  });
});
