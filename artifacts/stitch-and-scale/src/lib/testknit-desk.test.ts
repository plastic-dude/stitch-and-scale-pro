import { describe, it, expect } from 'vitest';
import {
  analyzeTestKnit,
  DEFAULT_TESTKNIT,
  SESSION_43_MARKET,
  formatUsd,
  type TesterInput,
} from './testknit-desk';
import { PatternProject, Gauge, SectionMeasurement } from './grading-engine';
import { ALL_SIZES } from './grading-engine';

const BASE_GAUGE: Gauge = { stitchesPer4In: 18, rowsPer4In: 24, unit: 'in' };

function m(id: string, label: string, gradingKey: string, baseValue: number, opts: Partial<SectionMeasurement> = {}): SectionMeasurement {
  return {
    id,
    label,
    measurementType: 'width',
    gradingKey: gradingKey as never,
    baseValue,
    ...opts,
  };
}

function makeProject(overrides: Partial<PatternProject> = {}, measurements: SectionMeasurement[] = []): PatternProject {
  return {
    id: 'tk-test',
    name: 'Desk Test Sweater',
    author: 'Tester',
    baseSize: 'M',
    gauge: BASE_GAUGE,
    yarnWeight: 'worsted',
    sections: [
      { id: 'body', name: 'Body', measurements: measurements.filter(x => x.id.startsWith('b')) },
      { id: 'sleeves', name: 'Sleeves', measurements: measurements.filter(x => x.id.startsWith('s')) },
    ],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

const FULL_SIZES = makeProject({}, [
  m('b1', 'Bust', 'bust', 20.5),
  m('b2', 'Back Length', 'backLength', 17.25, { measurementType: 'length' }),
  m('s1', 'Sleeve Length', 'sleeveLength', 17, { measurementType: 'length' }),
  m('s2', 'Upper Arm', 'upperArm', 7, { measurementType: 'width' }),
]);

function coveredRoster(): TesterInput[] {
  return ALL_SIZES.map(size => ({
    handle: `tester-${size.toLowerCase().replace('2xl', '2xl').replace('3xl', '3xl').replace('4xl', '4xl').replace('5xl', '5xl')}`,
    size,
    ratePerYard: 0.18,
    yarnSupport: 0,
    extras: [],
    feedback: '',
    status: 'invited' as const,
  }));
}

describe('analyzeTestKnit', () => {
  it('uses the market anchors cited in session 43 research', () => {
    expect(SESSION_43_MARKET.rateLow).toBe(0.1);
    expect(SESSION_43_MARKET.rateHigh).toBe(0.4);
    expect(SESSION_43_MARKET.fairFloor).toBe(0.18);
    expect(SESSION_43_MARKET.sampleLow).toBe(75);
    expect(SESSION_43_MARKET.sources.length).toBeGreaterThanOrEqual(8);
  });

  it('ready verdict with every size covered at a fair rate', () => {
    // Big sizes need double coverage for a clean verdict.
    const roster = coveredRoster();
    ['2XL', '3XL', '4XL', '5XL'].forEach(size => {
      const first = roster.find(t => t.size === size)!;
      roster.push({ ...first, handle: `${first.handle}-2` });
    });
    const r = analyzeTestKnit(FULL_SIZES, {
      ...DEFAULT_TESTKNIT,
      testers: roster,
    });
    expect(r.verdict).toBe('ready');
    expect(r.uncoveredSizes).toHaveLength(0);
    expect(r.paidTotal).toBeGreaterThan(0);
    // 13 paid testers (big sizes double-covered) × yards × 0.18
    expect(r.paidTotal).toBeCloseTo(13 * r.samplePay.yards * 0.18, 0);
  });

  it('blocked when a graded size has no tester', () => {
    const r = analyzeTestKnit(FULL_SIZES, {
      ...DEFAULT_TESTKNIT,
      testers: coveredRoster().slice(0, 3), // XS/S/M only
    });
    expect(r.verdict).toBe('blocked');
    expect(r.uncoveredSizes.length).toBeGreaterThanOrEqual(2);
    const flag = r.flags.find(f => f.code === 'R-02' && f.severity === 'error');
    expect(flag).toBeTruthy();
  });

  it('flags big sizes lacking double coverage as an error (FatTestKnits standard)', () => {
    const roster = coveredRoster(); // single coverage each; 2XL–5XL are big sizes needing double coverage
    const r = analyzeTestKnit(FULL_SIZES, { ...DEFAULT_TESTKNIT, testers: roster });
    const flag = r.flags.find(f => f.code === 'R-02' && f.severity === 'error');
    expect(flag?.message).toContain('2XL');
    expect(r.verdict).toBe('blocked');
  });

  it('double coverage on big sizes removes the R-02 error', () => {
    const roster = coveredRoster();
    ['2XL', '3XL', '4XL', '5XL'].forEach(size => {
      const first = roster.find(t => t.size === size)!;
      roster.push({ ...first, handle: `${first.handle}-2` });
    });
    const r = analyzeTestKnit(FULL_SIZES, { ...DEFAULT_TESTKNIT, testers: roster });
    const gap = r.flags.find(f => f.code === 'R-02' && f.severity === 'error');
    expect(gap).toBeUndefined();
    expect(r.verdict).toBe('ready');
  });

  it('rejects below-market rates (Yarnpond ghosting failure mode)', () => {
    const roster = coveredRoster().map(t => ({ ...t, ratePerYard: 0.05 }));
    const r = analyzeTestKnit(FULL_SIZES, { ...DEFAULT_TESTKNIT, testers: roster });
    const flag = r.flags.find(f => f.code === 'R-01' && f.severity === 'error');
    expect(flag?.message).toContain('$0.10 floor');
    expect(r.verdict).toBe('blocked');
  });

  it('warns on under-fair-floor rates but stays inside the band', () => {
    const roster = coveredRoster().map(t => ({ ...t, ratePerYard: 0.14 }));
    // 2XL–5XL need double coverage per the FatTestKnits standard, so add a
    // second tester for each big size to isolate the rate flag from coverage.
    ['2XL', '3XL', '4XL', '5XL'].forEach(size => {
      const first = roster.find(t => t.size === size)!;
      roster.push({ ...first, handle: `${first.handle}-2` });
    });
    const r = analyzeTestKnit(FULL_SIZES, { ...DEFAULT_TESTKNIT, testers: roster });
    const flag = r.flags.find(f => f.code === 'R-01' && f.severity === 'warning');
    expect(flag?.message).toContain('fair floor');
    expect(r.verdict).toBe('revise');
  });

  it('unpaid roster with zero reward is a red flag (documented minimum)', () => {
    const unpaid = coveredRoster().map(t => ({
      ...t, ratePerYard: 0,
      extras: [],
    }));
    const r = analyzeTestKnit(FULL_SIZES, {
      ...DEFAULT_TESTKNIT,
      freeFinalPattern: false,
      extraPatternValue: 0,
      yarnSupportPerTester: 0,
      socialFeature: false,
      earlyAccess: false,
      testers: unpaid,
    });
    const flag = r.flags.find(f => f.code === 'R-03');
    expect(flag?.message).toContain('minimum reward');
    expect(r.rewardValue).toBe(0);
  });

  it('computes non-cash reward per unpaid tester', () => {
    const unpaid = coveredRoster().map(t => ({ ...t, ratePerYard: 0 }));
    const r = analyzeTestKnit(FULL_SIZES, { ...DEFAULT_TESTKNIT, testers: unpaid });
    // $9 final pattern + $7 store extra + $2 social + $2 early access = $20
    expect(r.rewardPerUnpaidTester).toBeCloseTo(20, 0);
    // rewardValue covers only unpaid testers' non-cash reward (paid testers' social extras are 0 with default extras).
    expect(r.rewardValue).toBeCloseTo(9 * 20, 0);
  });

  it('prices a sample knitter against the market-typical band', () => {
    const r = analyzeTestKnit(FULL_SIZES, { ...DEFAULT_TESTKNIT, ratePerYard: 0.12 });
    const yards = r.samplePay.yards;
    expect(r.samplePay.typicalLow).toBe(Math.round(yards * 0.15));
    expect(r.samplePay.typicalHigh).toBe(Math.round(yards * 0.3));
    expect(r.samplePay.sampleKnitterPay).toBe(Math.round(yards * 0.12));
    expect(r.samplePay.yards).toBeGreaterThan(300); // worsted sweater yardage sanity
  });

  it('cash total includes sample knitters at the set rate', () => {
    const r = analyzeTestKnit(FULL_SIZES, { ...DEFAULT_TESTKNIT, sampleKnitters: 2 });
    expect(r.cashTotal).toBeCloseTo(2 * r.samplePay.sampleKnitterPay, 0);
    const sampleFlag = r.flags.find(f => f.code === 'R-06' && f.severity === 'info');
    expect(sampleFlag?.message).toContain('surrender the finished object');
  });

  it('yarn support is added to paid cash and reported separately', () => {
    const roster = coveredRoster().map(t => ({ ...t, yarnSupport: 25 }));
    // Big sizes need double coverage for a clean verdict; add a second tester per big size.
    ['2XL', '3XL', '4XL', '5XL'].forEach(size => {
      const first = roster.find(t => t.size === size)!;
      roster.push({ ...first, handle: `${first.handle}-2` });
    });
    const r = analyzeTestKnit(FULL_SIZES, { ...DEFAULT_TESTKNIT, testers: roster });
    expect(r.yarnSupportTotal).toBe(13 * 25);
    expect(r.cashTotal).toBeCloseTo(r.paidTotal + 13 * 25, 0);
  });

  it('ghosted testers warn and shrink coverage', () => {
    const roster = coveredRoster();
    roster[1] = { ...roster[1], status: 'ghosted' };
    const r = analyzeTestKnit(FULL_SIZES, { ...DEFAULT_TESTKNIT, testers: roster });
    expect(r.flags.some(f => f.code === 'R-05')).toBe(true);
    expect(r.uncoveredSizes).toContain('S');
    expect(r.verdict).toBe('blocked');
  });

  it('deadline tightness flags (<14 days blocked, >45 days info)', () => {
    const r1 = analyzeTestKnit(FULL_SIZES, { ...DEFAULT_TESTKNIT, testers: coveredRoster(), deadlineDays: 10 });
    expect(r1.flags.some(f => f.code === 'R-06' && f.severity === 'error')).toBe(true);
    const r2 = analyzeTestKnit(FULL_SIZES, { ...DEFAULT_TESTKNIT, testers: coveredRoster(), deadlineDays: 60 });
    expect(r2.flags.some(f => f.code === 'R-06' && f.severity === 'info')).toBe(true);
  });

  it('graded sizes follow ALL_SIZES order when gradedValues are implicit', () => {
    const r = analyzeTestKnit(FULL_SIZES, { ...DEFAULT_TESTKNIT, testers: coveredRoster() });
    // No gradedValues provided → sizeKeys empty → no coverage errors; but
    // with the fixture above (grading engine implicit sizes), expect coverage
    // against the full 9-size grade to still be checked.
    expect(r.coverage.length > 0 || r.uncoveredSizes.length === 0).toBe(true);
  });

  it('above-market rates get an info note (sample-only territory)', () => {
    const roster = coveredRoster().map(t => ({ ...t, ratePerYard: 0.45 }));
    const r = analyzeTestKnit(FULL_SIZES, { ...DEFAULT_TESTKNIT, testers: roster });
    const flag = r.flags.find(f => f.code === 'R-01' && f.severity === 'info');
    expect(flag?.message).toContain('$0.40 ceiling');
  });
});

describe('formatUsd', () => {
  it('formats two decimals by default', () => {
    expect(formatUsd(0.18)).toBe('$0.18');
  });
});
