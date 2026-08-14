import { describe, expect, it } from 'vitest';
import {
  checkReadiness,
  generateListing,
  ReadinessResult,
} from './pattern-readiness';
import { PatternProject, generateId } from './grading-engine';

function makeProject(overrides: Partial<PatternProject> = {}): PatternProject {
  return {
    id: generateId(),
    name: 'Demo Crewneck Sweater',
    author: 'Stitch & Scale Demo',
    baseSize: 'M',
    gauge: { stitchesPer4In: 5, rowsPer4In: 7, unit: 'in' },
    sections: [
      {
        id: 's1',
        name: 'Body',
        measurements: [
          { id: 'm1', label: 'Bust', measurementType: 'circumference', gradingKey: 'bust', baseValue: 38 },
          { id: 'm2', label: 'Waist', measurementType: 'circumference', gradingKey: 'waist', baseValue: 36 },
          { id: 'm3', label: 'Hip', measurementType: 'circumference', gradingKey: 'hip', baseValue: 40 },
          { id: 'm4', label: 'Back Length', measurementType: 'direct', gradingKey: 'backLength', baseValue: 25 },
        ],
      },
      {
        id: 's2',
        name: 'Sleeve',
        measurements: [
          { id: 'm5', label: 'Upper Arm', measurementType: 'circumference', gradingKey: 'upperArm', baseValue: 13 },
          { id: 'm6', label: 'Sleeve Length', measurementType: 'direct', gradingKey: 'sleeveLength', baseValue: 18 },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description: 'A relaxed crewneck worked flat and seamed.',
    yarnWeight: 'worsted',
    ...overrides,
  };
}

describe('checkReadiness', () => {
  it('passes a healthy project', () => {
    const result = checkReadiness(makeProject());
    expect(result.ready).toBe(true);
    expect(result.errorCount).toBe(0);
    // A fully-covered project passes every check; if one fails it is a
    // regression in the checker, not the fixture — print it to see which.
    const failing = result.checks.filter(c => c.severity !== 'pass');
    if (failing.length) console.log('unexpected failures:', failing.map(c => `${c.id}: ${c.detail.slice(0, 100)}`));
    expect(failing).toHaveLength(0);
  });

  it('errors on empty name', () => {
    const result = checkReadiness(makeProject({ name: '  ' }));
    const name = result.checks.find(c => c.id === 'name')!;
    expect(name.severity).toBe('error');
    expect(result.ready).toBe(false);
  });

  it('errors when there are no sections', () => {
    const result = checkReadiness(makeProject({ sections: [] }));
    const sections = result.checks.find(c => c.id === 'sections')!;
    expect(sections.severity).toBe('error');
    expect(result.ready).toBe(false);
  });

  it('errors when all sections are empty', () => {
    const result = checkReadiness(makeProject({
      sections: [{ id: 's1', name: 'Body', measurements: [] }],
    }));
    const sections = result.checks.find(c => c.id === 'sections')!;
    expect(sections.severity).toBe('error');
    expect(result.ready).toBe(false);
  });

  it('warns about empty sections but stays ready', () => {
    const project = makeProject();
    project.sections.push({ id: 's3', name: 'Collar', measurements: [] });
    const result = checkReadiness(project);
    expect(result.checks.find(c => c.id === 'empty-sections')!.severity).toBe('warning');
    expect(result.ready).toBe(true);
  });

  it('errors on non-positive measurements', () => {
    const project = makeProject();
    project.sections[0].measurements[0].baseValue = 0;
    const result = checkReadiness(project);
    expect(result.checks.find(c => c.id === 'positive-values')!.severity).toBe('error');
    expect(result.ready).toBe(false);
  });

  it('flags gauge as error when the stored values are unusable (storage default {0,0})', () => {
    const project = makeProject();
    project.gauge = { stitchesPer4In: 0, rowsPer4In: 0, unit: 'in' } as never;
    const result = checkReadiness(project);
    const gauge = result.checks.find(c => c.id === 'gauge')!;
    expect(gauge.severity).toBe('error');
    expect(gauge.detail.toLowerCase()).toContain('gauge');
    expect(result.ready).toBe(false);
  });

  it('flags implausible stitch gauge as unusable (typo slip)', () => {
    // A stitch gauge 3× above the yarn-weight band makes the grading math
    // itself break, so this is an error, not a warning.
    const result = checkReadiness(makeProject({
      gauge: { stitchesPer4In: 50, rowsPer4In: 50, unit: 'in' } as never,
    }));
    expect(result.checks.find(c => c.id === 'gauge')!.severity).toBe('error');
    expect(result.ready).toBe(false);
  });

  it('passes normal row-heavy gauges (rib/stocking row gauge > stitch gauge)', () => {
    // Stocking-stitch row gauge of 2.5× stitch gauge is common in ribbed
    // fabrics — still within the band and multiplier.
    const result = checkReadiness(makeProject({
      gauge: { stitchesPer4In: 5, rowsPer4In: 12, unit: 'in' } as never,
    }));
    expect(result.checks.find(c => c.id === 'gauge')!.severity).toBe('pass');
  });

  it('warns when a base value is far from the CYC standard (unit mixup)', () => {
    const project = makeProject();
    // Bust 38in entered as 38cm ≈ 15in — way below CYC M midpoint (37in ±45%).
    project.sections[0].measurements[0].baseValue = 15;
    const result = checkReadiness(project);
    const sanity = result.checks.find(c => c.id === 'base-sanity')!;
    expect(sanity.severity).toBe('warning');
    expect(sanity.detail).toContain('Body');
    expect(result.ready).toBe(true);
  });

  it('flags missing coverage keys as warning', () => {
    const result = checkReadiness(makeProject({
      sections: [
        {
          id: 's1',
          name: 'Body',
          measurements: [
            { id: 'm1', label: 'Bust', measurementType: 'circumference', gradingKey: 'bust', baseValue: 38 },
          ],
        },
      ],
    }));
    const coverage = result.checks.find(c => c.id === 'coverage')!;
    expect(coverage.severity).toBe('warning');
    expect(coverage.detail).toContain('sleeveLength');
  });

  it('warns when yarn weight is missing', () => {
    const result = checkReadiness(makeProject({ yarnWeight: undefined }));
    expect(result.checks.find(c => c.id === 'yarn-weight')!.severity).toBe('warning');
  });

  it('warns on thin notes', () => {
    const result = checkReadiness(makeProject({ description: 'ok' }));
    expect(result.checks.find(c => c.id === 'notes')!.severity).toBe('warning');
  });

  it('includes a grading-monotonicity check in every report', () => {
    // The engine's rounding is deterministic, so a consistently-rounded grade
    // can never strictly decrease — but a designer could hand-edit stored
    // values. The checker must still report the safety net so future
    // persistence paths stay covered.
    const result = checkReadiness(makeProject());
    const mono = result.checks.find(c => c.id === 'grade-monotonic');
    expect(mono).toBeTruthy();
    expect(mono!.label).toContain('Sizes grow');
    expect(mono!.severity).toBe('pass');
  });

  it('reports stable check ids and categories', () => {
    const result = checkReadiness(makeProject());
    const ids = result.checks.map(c => c.id);
    expect(ids.length).toBeGreaterThanOrEqual(10);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of result.checks) {
      expect(['engineering', 'metadata', 'presentation']).toContain(c.category);
    }
  });
});

describe('generateListing', () => {
  it('produces a complete ravelry listing from project data', () => {
    const listing = generateListing(makeProject(), {
      platform: 'ravelry',
      yarnWeight: 'worsted',
    });
    expect(listing.title).toBe('Demo Crewneck Sweater');
    expect(listing.description).toContain('Sizes:');
    expect(listing.description).toContain('Gauge: 5 sts');
    // Yardage must be a realistic adult-garment order of magnitude (benchmark
    // 1000–1400 yd worsted per Ravelry/LoveCrafts yardage summaries); the
    // estimate deliberately errs high (ease + square approximations for the
    // other measurements), so the ceiling is generous.
    const yards = Number(listing.description.match(/approximately (\d+) yd/)?.[1] ?? 0);
    expect(yards).toBeGreaterThan(900);
    expect(yards).toBeLessThan(4000);
    expect(listing.description).toContain('©');
    expect(listing.description).toContain('Ravelry queue');
    expect(listing.attributes.some(a => a.label === 'Sizes')).toBe(true);
    expect(listing.attributes.some(a => a.label === 'Yarn yardage')).toBe(true);
  });

  it('quotes the option weight in the listing and shows a usable yardage', () => {
    const fingering = generateListing(makeProject(), {
      platform: 'etsy',
      yarnWeight: 'fingering',
    });
    expect(fingering.description).toContain('Fingering');
    const yards = Number(fingering.description.match(/approximately (\d+) yd/)?.[1] ?? 0);
    expect(yards).toBeGreaterThan(1400);
    // Yardage math is anchored to the project's own weight for honesty — the
    // listing must never show a contradictory number from a swapped weight.
    const worstedYards = Number(generateListing(makeProject(), {
      platform: 'etsy',
      yarnWeight: 'worsted',
    }).description.match(/approximately (\d+) yd/)?.[1] ?? 0);
    expect(yards).toBe(worstedYards);
  });

  it('falls back gracefully with no yarn weight', () => {
    const listing = generateListing(
      makeProject({ yarnWeight: undefined }),
      { platform: 'payhip', yarnWeight: 'DK' },
    );
    expect(listing.description).toContain('yardage estimate needs a weight');
    expect(listing.attributes.some(a => a.label === 'Yarn yardage')).toBe(false);
  });

  it('includes the optional tagline at the top', () => {
    const listing = generateListing(makeProject(), {
      platform: 'ravelry',
      yarnWeight: 'worsted',
      tagline: 'Worked flat, relaxed fit, no frills.',
    });
    expect(listing.description.startsWith('Worked flat')).toBe(true);
  });

  it('handles minimal project data without crashing', () => {
    const listing = generateListing(
      makeProject({ name: '', sections: [], gauge: null as never }),
      { platform: 'ribblr', yarnWeight: 'sport' },
    );
    expect(listing.title).toBe('Knitting pattern');
    // With no gauge the estimate cannot be computed — the description must
    // not fabricate a yardage figure.
    expect(listing.description).not.toContain('approximately');
    expect(listing.description).not.toContain('0 yd');
    expect(listing.attributes.some(a => a.label === 'Yarn yardage')).toBe(false);
    // Closing line is platform-tailored — ribblr references interactive +
    // printable delivery, distinct from the PDF wording used elsewhere.
    expect(listing.description.toLowerCase()).toContain('interactive')
  });

  it('lists the sections as techniques', () => {
    const listing = generateListing(makeProject(), {
      platform: 'etsy',
      yarnWeight: 'worsted',
    });
    expect(listing.techniques.some(t => t.includes('Body'))).toBe(true);
    expect(listing.techniques.some(t => t.includes('Sleeve'))).toBe(true);
  });

  it('uses cm units when the gauge unit is cm', () => {
    const listing = generateListing(makeProject(), {
      platform: 'ravelry',
      yarnWeight: 'worsted',
    });
    // default gauge unit is 'in'
    expect(listing.description).toContain('in');
    const cmProject = makeProject({
      gauge: { stitchesPer4In: 20, rowsPer4In: 28, unit: 'cm' },
    });
    const listingCm = generateListing(cmProject, {
      platform: 'ravelry',
      yarnWeight: 'worsted',
    });
    expect(listingCm.description).toContain('cm');
  });
});
