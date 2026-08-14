/**
 * Lookbook Desk tests — CHK-044
 *
 * Covers the math and the honest-verdict ladder: tier economics, the
 * construction-derived hours budget, trait-driven shot lists, platform
 * framing minimums, and every L-0x flag path including the budget
 * blocker. Fixture mirrors sample-projects.ts shapes with valid
 * grading keys and measurement types (the yarn estimator grades against
 * bust/backLength/upperArm/sleeveLength keys).
 */
import { describe, it, expect } from 'vitest';
import {
  analyzeLookbook,
  DEFAULT_LOOKBOOK,
  hoursBudget,
  shotList,
  platformFraming,
  formatUsd,
  type LookbookInputs,
} from './lookbook-desk';
import type { PatternProject, SectionMeasurement } from './grading-engine';

const BODY_KEYS: Array<[string, string, number]> = [
  ['bust', 'circumference', 40],
  ['backLength', 'length', 24],
  ['upperArm', 'circumference', 14],
  ['sleeveLength', 'length', 18],
];

function makeProject(opts: {
  name?: string;
  description?: string;
  yarnWeight?: PatternProject['yarnWeight'];
  extraMeasurements?: number;
} = {}): PatternProject {
  const { name, description, yarnWeight, extraMeasurements = 0 } = opts;
  const measurements: SectionMeasurement[] = BODY_KEYS.map(([gradingKey, measurementType, baseValue], i) => ({
    id: `m-${i}`,
    label: gradingKey,
    measurementType: measurementType as SectionMeasurement['measurementType'],
    gradingKey: gradingKey as SectionMeasurement['gradingKey'],
    baseValue,
  }));
  for (let i = 0; i < extraMeasurements; i++) {
    measurements.push({
      id: `x-${i}`,
      label: `extra${i}`,
      measurementType: 'circumference',
      gradingKey: 'hip' as SectionMeasurement['gradingKey'],
      baseValue: 44,
    });
  }
  return {
    id: 'lb-test-1',
    name: name ?? 'Lookbook Test Sweater',
    author: 'Test Designer',
    baseSize: 'M',
    gauge: { stitchesPer4in: 18, rowsPer4in: 24 },
    sections: [{ id: 'body', name: 'Body', measurements }],
    createdAt: '2026-08-14T00:00:00Z',
    updatedAt: '2026-08-14T00:00:00Z',
    description,
    yarnWeight,
  } as PatternProject;
}

describe('hoursBudget — derived from the pattern itself', () => {
  it('anchors at 9h base (2 mood + 5 practical + 2 editing)', () => {
    const project = makeProject();
    // Base is always mood + practical + editing hours from the inputs.
    expect(hoursBudget(DEFAULT_LOOKBOOK, project).base).toBe(9);
    // A worsted-weight 4-key fixture still carries a small yardage term
    // (fixture yardage exceeds the 1,200 yd detail threshold), so the
    // minimum complexity is not zero — but the baseline anchor holds.
    expect(hoursBudget(DEFAULT_LOOKBOOK, project).total).toBeGreaterThanOrEqual(9);
  });

  it('adds size-range hours once measurements exceed the 4-key baseline', () => {
    const baseline = makeProject();
    const expanded = makeProject({ extraMeasurements: 3 });
    expect(hoursBudget(DEFAULT_LOOKBOOK, expanded).total).toBeGreaterThan(hoursBudget(DEFAULT_LOOKBOOK, baseline).total);
    // 3 extras beyond the 4-key baseline → +3h of size-range time.
    expect(hoursBudget(DEFAULT_LOOKBOOK, expanded).complexity).toBeGreaterThan(hoursBudget(DEFAULT_LOOKBOOK, baseline).complexity + 2);
  });

  it('adds texture hours when the description carries cable/texture language', () => {
    const plain = makeProject({ description: 'A straightforward top-down beanie in DK weight.' });
    const textured = makeProject({ description: 'A cable-yoke pullover with mosaic colorwork sleeves.' });
    expect(hoursBudget(DEFAULT_LOOKBOOK, textured).total).toBeGreaterThan(hoursBudget(DEFAULT_LOOKBOOK, plain).total);
  });

  it('adds yarn-detail hours for high-yardage patterns', () => {
    // Fingering-weight sweater yardage runs ~2,600 yd vs ~210 yd for
    // super-bulky at identical measurements — the 1,200 yd threshold
    // splits them cleanly.
    const fingering = makeProject({ yarnWeight: 'fingering' });
    const bulky = makeProject({ yarnWeight: 'super-bulky' });
    expect(hoursBudget(DEFAULT_LOOKBOOK, fingering).total).toBeGreaterThan(hoursBudget(DEFAULT_LOOKBOOK, bulky).total);
    expect(hoursBudget(DEFAULT_LOOKBOOK, fingering).complexity).toBeGreaterThan(hoursBudget(DEFAULT_LOOKBOOK, bulky).complexity);
  });
});

describe('tierPhoto economics — cash vs opportunity cost', () => {
  it('DIY costs only misc + hours × opportunity rate', () => {
    const project = makeProject();
    const result = analyzeLookbook(project, { tier: 'diy', miscCost: 10 });
    expect(result.tiers.diy.cashCost).toBe(10);
    expect(result.tiers.diy.totalCost).toBeCloseTo(10 + result.tiers.diy.opportunityCost, 0);
  });

  it('pro tier carries session rate + model; friend tier carries mate rate', () => {
    const project = makeProject();
    const result = analyzeLookbook(project, { proSessionRate: 250, friendRate: 50, modelCost: 40 });
    expect(result.tiers.pro.cashCost).toBe(290);
    expect(result.tiers.friend.cashCost).toBe(90);
    expect(result.tiers.diy.cashCost).toBe(0);
  });

  it('planned tier matches the selected tier', () => {
    const project = makeProject();
    const friend = analyzeLookbook(project, { tier: 'friend' });
    expect(friend.planned).toEqual(friend.tiers.friend);
  });
});

describe('shotList — required only when the pattern demands it', () => {
  it('always requires mood + practical set', () => {
    const list = shotList(makeProject(), false);
    expect(list.some((s) => s.code === 'S-01' && s.required)).toBe(true);
    expect(list.some((s) => s.code === 'S-02' && s.required)).toBe(true);
  });

  it('adds the texture macro shot only for textured/colorwork descriptions', () => {
    const plain = shotList(makeProject({ description: 'Simple ribbed beanie.' }), false);
    const textured = shotList(makeProject({ description: 'Cable-yoke colorwork pullover.' }), false);
    expect(plain.some((s) => s.code === 'S-03')).toBe(false);
    expect(textured.some((s) => s.code === 'S-03' && s.required)).toBe(true);
  });

  it('adds yarn styling shot for high-yardage (fingering) projects', () => {
    const fine = shotList(makeProject({ yarnWeight: 'fingering' }), false);
    const chunky = shotList(makeProject({ yarnWeight: 'super-bulky' }), false);
    expect(fine.some((s) => s.code === 'S-04' && s.required)).toBe(true);
    expect(chunky.some((s) => s.code === 'S-04')).toBe(false);
  });

  it('adds tester FO size-range shot when testerFos is planned', () => {
    const list = shotList(makeProject({ extraMeasurements: 2 }), true);
    expect(list.some((s) => s.code === 'S-05' && s.kind === 'size-range')).toBe(true);
  });
});

describe('platformFraming — per-platform gallery minimums', () => {
  it('flags only the platforms the designer enabled', () => {
    const inputs: LookbookInputs = {
      ...DEFAULT_LOOKBOOK,
      platforms: { ravelry: true, etsy: false, ownStore: true, social: false },
    };
    const pf = platformFraming(inputs);
    expect(pf.find((p) => p.platform === 'Ravelry')?.covered).toBe(true);
    expect(pf.find((p) => p.platform === 'Etsy')?.covered).toBe(false);
    expect(pf.find((p) => p.platform === 'Social')?.covered).toBe(false);
  });

  it('Ravelry minimum is 4 gallery images', () => {
    expect(platformFraming(DEFAULT_LOOKBOOK).find((p) => p.platform === 'Ravelry')?.minImages).toBe(4);
  });
});

describe('flags — the honest-verdict ladder', () => {
  it('L-01 fires when a wide size range has no tester FOs', () => {
    const result = analyzeLookbook(makeProject({ extraMeasurements: 2 }), { testerFos: false });
    expect(result.flags.some((f) => f.code === 'L-01')).toBe(true);
    const withFos = analyzeLookbook(makeProject({ extraMeasurements: 2 }), { testerFos: true });
    expect(withFos.flags.some((f) => f.code === 'L-01')).toBe(false);
  });

  it('L-03 fires without tester FOs regardless of size count', () => {
    const result = analyzeLookbook(makeProject(), { testerFos: false });
    expect(result.flags.some((f) => f.code === 'L-03')).toBe(true);
  });

  it('L-04 blocks the launch when the photo budget exceeds half of expected revenue', () => {
    // $8 pattern × 10 expected sales = $80 revenue; half is $40. A $50
    // pro session pushes the cash cost past the line.
    const result = analyzeLookbook(makeProject(), {
      tier: 'pro',
      proSessionRate: 50,
      patternPrice: 8,
      expectedSales: 10,
    });
    expect(result.flags.some((f) => f.code === 'L-04')).toBe(true);
    expect(result.verdict).toBe('blocked');
  });

  it('L-05 notes the Ravelry gallery minimum when Ravelry is planned', () => {
    const result = analyzeLookbook(makeProject(), { platforms: { ravelry: true, etsy: false, ownStore: false, social: false } });
    expect(result.flags.some((f) => f.code === 'L-05')).toBe(true);
  });

  it('L-06 fires when DIY opportunity cost exceeds hiring a friend', () => {
    // 9h × $25/hr = $225 of DIY opportunity cost vs a $50 friend fee —
    // self-shooting is only "free" when your hours are worth less than
    // the hire's cash cost. The flag compares against hire cash because
    // hours are identical across tiers.
    const result = analyzeLookbook(makeProject(), {
      tier: 'diy',
      opportunityHourly: 25,
      friendRate: 50,
    });
    expect(result.flags.some((f) => f.code === 'L-06')).toBe(true);
    expect(result.flags.some((f) => f.severity === 'major')).toBe(true);
  });

  it('a clean plan returns go with no flags', () => {
    // Low opportunity rate kills L-06; huge expected sales kills L-04;
    // testerFos kills L-01/L-03; Ravelry off kills L-05.
    const result = analyzeLookbook(makeProject(), {
      tier: 'diy',
      opportunityHourly: 2,
      patternPrice: 6.5,
      expectedSales: 100,
      testerFos: true,
      platforms: { ravelry: false, etsy: false, ownStore: false, social: false },
    });
    expect(result.verdict).toBe('go');
    expect(result.flags.length).toBe(0);
  });

  it('breakeven copies derive from cash cost and the net-per-copy price', () => {
    const result = analyzeLookbook(makeProject(), {
      tier: 'friend',
      friendRate: 50,
      patternPrice: 10,
      expectedSales: 50,
    });
    // $50 ÷ ($10 × 0.95) = 5.26 → 6 copies
    expect(result.breakevenCopiesAtPrice).toBe(6);
  });
});

describe('formatUsd', () => {
  it('formats dollars with no fraction digits by default', () => {
    expect(formatUsd(123.456)).toBe('$123');
    expect(formatUsd(9)).toBe('$9');
  });
});
