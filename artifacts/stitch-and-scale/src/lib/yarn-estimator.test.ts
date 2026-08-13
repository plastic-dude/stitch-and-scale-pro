import { describe, it, expect } from 'vitest';
import { estimateYarn, YARN_WEIGHT_DATA, YARN_WEIGHTS } from './yarn-estimator';
import { PatternProject } from './grading-engine';

function sampleProject(rowsPer4In = 24, stitchesPer4In = 20, weight = 'worsted' as const): PatternProject {
  return {
    id: 'test-crew-neck',
    name: 'Test Sweater',
    author: 'Manus',
    baseSize: 'M',
    gauge: { stitchesPer4In, rowsPer4In, unit: 'in' },
    yarnWeight: weight,
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
  };
}

describe('yarn-estimator', () => {
  it('estimates a worsted sweater in a sane yardage range (600-1600 yd)', () => {
    const est = estimateYarn(sampleProject(), 'worsted');
    expect(est.totalYards).toBeGreaterThan(600);
    expect(est.totalYards).toBeLessThan(1600);
    expect(est.skeins100g).toBeGreaterThan(0);
    // Sanity: fabric area of bust (42in doubled) + length (26in) + sleeve should be non-trivial
    expect(est.fabricAreaSqIn).toBeGreaterThan(500);
    expect(est.fabricAreaSqIn).toBeLessThan(6000);
  });

  it('finer yarns return more yardage than bulky for the same garment', () => {
    const proj = sampleProject(28, 22, 'fingering');
    const fingering = estimateYarn(proj, 'fingering');
    const bulky = estimateYarn(proj, 'bulky');
    expect(fingering.totalYards).toBeGreaterThan(bulky.totalYards);
  });

  it('meters conversion is 0.9144 × yards', () => {
    const est = estimateYarn(sampleProject(), 'worsted');
    // Both values are rounded to 1 decimal place, so allow rounding error
    // proportional to magnitude plus the rounding step (0.1 each side).
    expect(Math.abs(est.totalMeters - est.totalYards * 0.9144)).toBeLessThan(0.25);
  });

  it('skeins rounds up', () => {
    const est = estimateYarn(sampleProject(), 'worsted');
    expect(est.skeins100g * YARN_WEIGHT_DATA['worsted'].yardagePer100g).toBeGreaterThanOrEqual(est.totalYards);
  });

  it('handles zero rowsPer4In gracefully via CYC reference fallback', () => {
    const est = estimateYarn(sampleProject(0, 20, 'DK'), 'DK');
    expect(est.totalYards).toBeGreaterThan(0);
    expect(Number.isFinite(est.totalYards)).toBe(true);
  });

  it('all seven CYC weights have valid reference data', () => {
    for (const w of YARN_WEIGHTS) {
      expect(YARN_WEIGHT_DATA[w].referenceGaugeStitches).toBeGreaterThan(0);
      expect(YARN_WEIGHT_DATA[w].yardagePer100g).toBeGreaterThan(0);
    }
  });
});
