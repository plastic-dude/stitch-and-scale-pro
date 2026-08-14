/**
 * S003 family — the "standards built on nothing" fix.
 *
 * Previously a Custom-standard project missing its frozen chart snapshot
 * resolved through `resolveProjectStandards(project, {} as never)` to an
 * EMPTY standards table, producing zero yardage, zero sample cost, and
 * "feasible" verdicts flipped silently to "go". This suite proves the loud
 * path: the missing-chart case is now detectable and surfaced as an error
 * on every surface that grades from standards.
 */
import { describe, expect, it } from 'vitest';
import {
  PatternProject,
  isCustomStandardMissing,
  SIZE_STANDARDS,
} from './grading-engine';
import { estimateYarn } from './yarn-estimator';
import { checkReadiness } from './pattern-readiness';
import { computeCredibility } from './credibility-report';

function demoProject(): PatternProject {
  return {
    id: 's003-demo',
    name: 'S003 Demo Sweater',
    author: 'Designer',
    baseSize: 'M',
    gauge: { stitchesPer4In: 18, rowsPer4In: 24, unit: 'in' },
    sections: [
      {
        id: 'body',
        name: 'Body',
        measurements: [
          { id: 'bust', label: 'Bust Circumference', measurementType: 'circumference', gradingKey: 'bust', baseValue: 42 },
          { id: 'len', label: 'Body Length', measurementType: 'length', gradingKey: 'backLength', baseValue: 26 },
        ],
      },
      {
        id: 'sleeve',
        name: 'Sleeve',
        measurements: [
          { id: 'sleeve-len', label: 'Sleeve Length', measurementType: 'length', gradingKey: 'sleeveLength', baseValue: 17 },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as PatternProject;
}

describe('isCustomStandardMissing (S003)', () => {
  it('flags a Custom-standard project with no snapshot', () => {
    const p = demoProject();
    p.sizingStandard = 'Custom';
    expect(isCustomStandardMissing(p)).toBe(true);
  });

  it('does NOT flag a Custom-standard project WITH a snapshot', () => {
    const p = demoProject();
    p.sizingStandard = 'Custom';
    p.customStandardSnapshot = SIZE_STANDARDS;
    expect(isCustomStandardMissing(p)).toBe(false);
  });

  it('does NOT flag legacy (pre-snapshot) projects - they resolve to CYC', () => {
    // demoProject has no sizingStandard recorded -> legacy, resolves to CYC
    expect(isCustomStandardMissing(demoProject())).toBe(false);
  });
});

describe('estimateYarn missingStandards flag (S003)', () => {
  it('flags missing standards and still returns a CYC-fallback number', () => {
    const p = demoProject();
    p.sizingStandard = 'Custom';
    p.yarnWeight = 'worsted';
    const est = estimateYarn(p, 'worsted');
    expect(est.missingStandards).toBe(true);
    expect(est.totalYards).toBeGreaterThan(0); // fallback CYC grading, never zero
  });

  it('is clean for a snapshot-bearing Custom project', () => {
    const p = demoProject();
    p.sizingStandard = 'Custom';
    p.customStandardSnapshot = SIZE_STANDARDS;
    p.yarnWeight = 'worsted';
    expect(estimateYarn(p, 'worsted').missingStandards).toBe(false);
  });
});

describe('checkReadiness surfaces missing standards as an ERROR (S003)', () => {
  it('errors the sizing-standards check when the snapshot is missing', () => {
    const p = demoProject();
    p.sizingStandard = 'Custom';
    const result = checkReadiness(p);
    const check = result.checks.find(c => c.id === 'sizing-standards');
    expect(check?.severity).toBe('error');
    expect(check?.detail).toContain('CYC fallback');
    expect(result.ready).toBe(false);
  });

  it('passes the check when the snapshot exists', () => {
    const p = demoProject();
    p.sizingStandard = 'Custom';
    p.customStandardSnapshot = SIZE_STANDARDS;
    const result = checkReadiness(p);
    expect(result.checks.find(c => c.id === 'sizing-standards')?.severity).toBe('pass');
  });
});

describe('credibility report anti-bogus-number check (S003)', () => {
  it('fails the sizing-standard trust check when the snapshot is missing', () => {
    const p = demoProject();
    p.sizingStandard = 'Custom';
    p.yarnWeight = 'worsted';
    const report = computeCredibility(p);
    const check = report.checks.find(c => c.id === 'sizing-standard');
    expect(check?.passed).toBe(false);
    expect(check?.proof).toContain('CYC fallback');
  });
});
