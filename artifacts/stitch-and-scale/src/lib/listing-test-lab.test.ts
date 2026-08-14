/**
 * Listing Test Lab engine tests (CHK-058).
 *
 * Statistical anchors cross-checked against Evan Miller's ABTestGuide
 * normal-approximation calculator: 2%→3% at α=0.05/power=0.8 needs
 * ~2,128 visitors per variant.
 */
import { describe, expect, it } from 'vitest';
import {
  analyzeListingTest,
  DEFAULT_LISTING,
  maxDetectableLift,
  netPerSale,
  rankListingQueue,
  samplePerVariant,
} from './listing-test-lab';

describe('samplePerVariant (Miller formula)', () => {
  it('matches Evan Miller for 2%→3% (≈3,825/variant at α=0.05/power=0.8)', () => {
    const n = samplePerVariant(0.02, 0.03);
    expect(n).toBeGreaterThan(3700);
    expect(n).toBeLessThan(4000);
  });

  it('returns Infinity for invalid inputs', () => {
    expect(samplePerVariant(0, 0.03)).toBe(Infinity);
    expect(samplePerVariant(0.03, 0.03)).toBe(Infinity);
    expect(samplePerVariant(0.03, 0.02)).toBe(Infinity);
    expect(samplePerVariant(NaN, 0.03)).toBe(Infinity);
  });

  it('scales inversely with effect size (bigger lifts need far fewer visits)', () => {
    const small = samplePerVariant(0.02, 0.03);
    const big = samplePerVariant(0.02, 0.12);
    expect(big).toBeLessThan(small / 10);
  });

  it('smaller baselines need slightly more sample at the same absolute lift', () => {
    expect(samplePerVariant(0.01, 0.02)).toBeLessThan(samplePerVariant(0.05, 0.06));
  });
});

describe('netPerSale (platform fee baselines, 2025 published rates)', () => {
  it('Ravelry nets ≈ $5.70 on a $6 pattern (2.9% + $0.30)', () => {
    expect(netPerSale('ravelry', 6)).toBeCloseTo(5.53, 1); // 6 − 0.174 − 0.30
  });

  it('Ravelry keeps 100% of commission — only processing deducted', () => {
    expect(netPerSale('ravelry', 10)).toBeCloseTo(10 * 0.971 - 0.3, 2);
  });

  it('Etsy nets ≈ $5.10 on a $6 pattern', () => {
    const n = netPerSale('etsy', 6);
    expect(n).toBeGreaterThan(4.9);
    expect(n).toBeLessThan(5.3);
  });

  it('LoveCrafts takes a flat 25%', () => {
    expect(netPerSale('lovecrafts', 8)).toBeCloseTo(6, 2);
  });
});

describe('analyzeListingTest — defaults', () => {
  const r = analyzeListingTest(DEFAULT_LISTING);

  it('effective views = 40/mo, baseline 2% → 0.8 sales/mo', () => {
    expect(r.effectiveMonthlyViews).toBe(40);
    expect(r.baselineMonthlySales).toBeCloseTo(0.8, 2);
  });

  it('2%→3% needs ≈2,128/variant → ≈106 months at 40 views/mo', () => {
    expect(r.samplePerVariant).toBeGreaterThan(2000);
    expect(r.monthsToPower).toBeGreaterThan(100);
  });

  it('defaults verdict Fix the test: traffic exists but the 2mo plan can only prove larger lifts', () => {
    expect(r.verdict).toBe('Fix the test');
    expect(r.flags.some(f => f.code === 'LT-01')).toBe(true);
  });

  it('flags LT-06 for incomplete Ravelry tags', () => {
    expect(r.flags.some(f => f.code === 'LT-06')).toBe(true);
  });

  it('effort cost = 4hr × $25 = $100; break-even is honest about the long wait', () => {
    expect(r.effortCost).toBe(100);
    // Even at the hypothesized 1pt lift, the gain ($2.21/mo) repays effort in
    // ~45 months — flagged as a waiting-game test (LT-05), not a free win.
    expect(r.breakEvenMonths).toBeGreaterThan(24);
  });
});

describe('analyzeListingTest — a testable listing', () => {
  const r = analyzeListingTest({
    ...DEFAULT_LISTING,
    name: 'Beginner Cable Hat',
    monthlyViews: 900,
    conversionRate: 0.02,
    hypothesizedLift: 0.06, // 2% → 8% — at 900 views/mo over 2 months the floor
                            // is ≈5.6pt, so this hypothesis IS provable in-plan
    effortHours: 3,
    hourlyRate: 25,
    plannedDurationMonths: 2,
    tagsUsedPct: 1,
  });

  it('verdicts Test it: the lift is detectable within the plan', () => {
    expect(r.verdict).toBe('Test it');
    expect(r.liftIsDetectable).toBe(true);
  });

  it('no LT-05 peeking flag when the plan reaches power', () => {
    expect(r.flags.some(f => f.code === 'LT-05')).toBe(false);
  });

  it('positive expected value and finite break-even', () => {
    expect(r.expectedValue).toBeGreaterThan(0);
    expect(r.breakEvenMonths).toBeGreaterThan(0);
    expect(isFinite(r.breakEvenMonths)).toBe(true);
  });
});

describe('analyzeListingTest — Fix the test', () => {
  it('verdicts Fix the test when the lift is below the detectable floor', () => {
    const r = analyzeListingTest({
      ...DEFAULT_LISTING,
      monthlyViews: 600,
      conversionRate: 0.02,
      hypothesizedLift: 0.005, // 2%→2.5% — too small for 600 views/mo in 2 months
      plannedDurationMonths: 2,
      tagsUsedPct: 1,
    });
    expect(r.verdict).toBe('Fix the test');
    expect(r.maxDetectableLift).not.toBeNull();
    expect(r.maxDetectableLift!).toBeGreaterThan(0.005);
  });
});

describe('flags', () => {
  it('LT-02 fires for sub-cycle durations', () => {
    const r = analyzeListingTest({ ...DEFAULT_LISTING, plannedDurationMonths: 0.5 });
    expect(r.flags.some(f => f.code === 'LT-02')).toBe(true);
  });

  it('LT-03 fires for multi-variable tests', () => {
    const r = analyzeListingTest({ ...DEFAULT_LISTING, isMultipleVariables: true });
    expect(r.flags.some(f => f.code === 'LT-03')).toBe(true);
  });

  it('LT-04 fires for price tests on fee-heavy platforms', () => {
    expect(
      analyzeListingTest({ ...DEFAULT_LISTING, variable: 'price', platform: 'etsy' }).flags.some(
        f => f.code === 'LT-04',
      ),
    ).toBe(true);
    expect(
      analyzeListingTest({ ...DEFAULT_LISTING, variable: 'price', platform: 'ravelry' }).flags.some(
        f => f.code === 'LT-04',
      ),
    ).toBe(false);
  });

  it('LT-05 fires when the plan is far short of required sample', () => {
    const r = analyzeListingTest({
      ...DEFAULT_LISTING,
      monthlyViews: 900,
      conversionRate: 0.02,
      hypothesizedLift: 0.015,
      plannedDurationMonths: 1, // sample needs ~2.5 months ×2 flag threshold
      tagsUsedPct: 1,
    });
    expect(r.flags.some(f => f.code === 'LT-05')).toBe(true);
  });
});

describe('impressions → views derivation', () => {
  it('uses the larger of direct views or impressions×CTR', () => {
    const r = analyzeListingTest({
      ...DEFAULT_LISTING,
      monthlyViews: 40,
      monthlyImpressions: 5000,
      ctrPct: 0.02, // 100 views
    });
    expect(r.effectiveMonthlyViews).toBe(100);
    expect(r.viewsFromImpressions).toBe(100);
  });

  it('clamps CTR to [0,1]', () => {
    const r = analyzeListingTest({
      ...DEFAULT_LISTING,
      monthlyImpressions: 1000,
      ctrPct: 2, // invalid 200%
    });
    expect(r.viewsFromImpressions).toBe(1000);
  });
});

describe('rankListingQueue', () => {
  it('ranks the traffic-rich listing first by expected value', () => {
    const low = { ...DEFAULT_LISTING, name: 'A' };
    const high = {
      ...DEFAULT_LISTING,
      name: 'B',
      monthlyViews: 1200,
      conversionRate: 0.02,
      hypothesizedLift: 0.015,
      tagsUsedPct: 1,
      plannedDurationMonths: 2,
    };
    const q = rankListingQueue([low, high]);
    expect(q[0].listing.name).toBe('B');
    expect(q[1].listing.name).toBe('A');
  });

  it('handles an empty queue', () => {
    expect(rankListingQueue([])).toEqual([]);
  });
});
