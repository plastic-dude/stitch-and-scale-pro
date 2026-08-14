import { describe, expect, it } from 'vitest';
import {
  analyzePricingPsychology,
  DEFAULT_PRICING_PSYCHOLOGY,
  PricingPsychologyInput,
} from './pricing-psychology-lab';

function run(overrides: Partial<PricingPsychologyInput> = {}) {
  return analyzePricingPsychology({ ...DEFAULT_PRICING_PSYCHOLOGY, ...overrides });
}

describe('analyzePricingPsychology — baseline', () => {
  it('computes current net as price × units × (1 − take rate)', () => {
    const r = run();
    expect(r.current.monthlyNet).toBeCloseTo(10 * 25 * 0.9, 1); // 225
  });

  it('applies the charm lift + ending effect to implied units at mainstream tier', () => {
    const r = run();
    // candidate 9.99 crosses the 10 → 9 left digit (3%) + 8% mainstream charm effect
    expect(r.candidate.impliedUnits).toBeCloseTo(25 * 1.11, 1);
  });

  it('candidate nets above current when crossing a left-digit barrier', () => {
    const r = run();
    expect(r.candidate.monthlyNet).toBeGreaterThan(r.current.monthlyNet);
    expect(r.candidate.leftDigitChange).toBe(1);
  });

  it('returns the recommended ending by tier position', () => {
    expect(run().recommendedEnding).toBe('charm-99');
    expect(run({ tierPositioning: 'premium' }).recommendedEnding).toBe('round-00');
    expect(run({ candidatePrice: 22 }).recommendedEnding).toBe('mixed');
  });
});

describe('left-digit barriers', () => {
  it('flags PP-01 when the candidate sits on a barrier it could drop under', () => {
    const r = run({ currentPrice: 10.0, candidatePrice: 9.99 });
    expect(r.flags.some(f => f.code === 'PP-01')).toBe(true);
  });

  it('does not flag PP-01 when the current price already sits below the candidate digit', () => {
    const r = run({ currentPrice: 11.0, candidatePrice: 9.99 });
    expect(r.flags.some(f => f.code === 'PP-01')).toBe(false);
  });

  it('flags PP-01 on a same-digit edge price without a candidate drop', () => {
    const r = run({ currentPrice: 10.5, candidatePrice: 10.5 });
    expect(r.flags.some(f => f.code === 'PP-01')).toBe(true);
  });

  it('flags PP-06 on a cut that does not cross a digit', () => {
    const r = run({ currentPrice: 9.5, candidatePrice: 8.99 });
    // 9.50 → 8.99 crosses a digit, so PP-06 should NOT fire; use 9.50 → 9.29
    const r2 = run({ currentPrice: 9.5, candidatePrice: 9.29 });
    expect(r2.flags.some(f => f.code === 'PP-06')).toBe(true);
  });

  it('computes barriers as 5-dollar bands around the candidate', () => {
    const r = run({ candidatePrice: 11.99 });
    expect(r.barriers.below).toBe(10);
    expect(r.barriers.above).toBe(15);
  });
});

describe('charm vs premium flip', () => {
  it('flags PP-02 for charm endings at high prices', () => {
    const r = run({ candidatePrice: 64.99, tierPositioning: 'mainstream' });
    expect(r.flags.some(f => f.code === 'PP-02')).toBe(true);
  });

  it('applies a negative effect for premium positioning (charm drag)', () => {
    const r = run({ candidatePrice: 12.99, tierPositioning: 'premium' });
    expect(r.candidate.endingModifier).toBe(-0.04);
    expect(r.flags.some(f => f.code === 'PP-03')).toBe(true);
  });

  it('moderate price mainstream charm effect is small positive', () => {
    const r = run({ candidatePrice: 22.99, tierPositioning: 'mainstream' });
    expect(r.candidate.endingModifier).toBe(0.03);
    expect(r.flags.some(f => f.code === 'PP-02')).toBe(false);
  });
});

describe('shop anchors and decoys', () => {
  it('highestShopAnchor reflects the max of current/candidate/shop tiers', () => {
    expect(run({ shopTiers: [5, 8, 14] }).highestShopAnchor).toBe(14);
    expect(run({ shopTiers: [5, 8], candidatePrice: 12 }).highestShopAnchor).toBe(12);
  });

  it('flags PP-04 when nothing in the shop anchors higher than the candidate', () => {
    const r = run({ shopTiers: [5, 8, 9.5], candidatePrice: 9.99 });
    expect(r.flags.some(f => f.code === 'PP-04')).toBe(true);
  });

  it('does not flag PP-04 when a higher tier exists', () => {
    const r = run({ shopTiers: [5, 8, 14], candidatePrice: 9.99 });
    expect(r.flags.some(f => f.code === 'PP-04')).toBe(false);
  });

  it('flags PP-05 when two tiers are within 10% of each other', () => {
    const r = run({ shopTiers: [8.0, 8.5, 14.0] });
    expect(r.flags.some(f => f.code === 'PP-05')).toBe(true);
  });

  it('does not flag PP-05 with well-separated tiers', () => {
    const r = run({ shopTiers: [5.0, 8.0, 14.0] });
    expect(r.flags.some(f => f.code === 'PP-05')).toBe(false);
  });

  it('flags PP-07 on inconsistent endings across 3+ prices', () => {
    const r = run({ shopTiers: [5.0, 7.99, 14.0] });
    expect(r.flags.some(f => f.code === 'PP-07')).toBe(true);
  });

  it('does not flag PP-07 when all prices share an ending style', () => {
    // default currentPrice is 10.00 (rounded) — include it in the set and use
    // a .00 candidate too, so every active price ends .00
    const r = run({ shopTiers: [4.0, 7.0, 12.0], candidatePrice: 10.0 });
    expect(r.flags.some(f => f.code === 'PP-07')).toBe(false);
  });
});

describe('bundle ending rules (Baumgartner & Hähnchen 2016)', () => {
  it('returns null bundle comparison when not bundling', () => {
    expect(run({ bundleSize: 0 }).bundle).toBeNull();
  });

  it('reports component ends-even and total ends-odd as the best configuration', () => {
    const r = run({ componentPrice: 8.0, bundleCandidateTotal: 21.99 });
    expect(r.bundle?.componentsEndEven).toBe(true);
    expect(r.bundle?.totalEndsOdd).toBe(true);
  });

  it('flags PP-08 when the bundle total ends even with even components', () => {
    const r = run({ componentPrice: 8.0, bundleCandidateTotal: 22.0 });
    expect(r.flags.some(f => f.code === 'PP-08')).toBe(true);
    expect(r.bundle?.totalEndsOdd).toBe(false);
    expect(r.bundle?.componentsEndEven).toBe(true);
  });

  it('flags PP-09 when the bundle undercuts the sum of singles too deeply', () => {
    const r = run({ bundleCandidateTotal: 15.99, bundleSize: 3 });
    // sum of singles = 24.00; 15.99 is a 33% leak — above the 10-15% framing need
    expect(r.flags.some(f => f.code === 'PP-09')).toBe(true);
  });

  it('does not flag PP-09 at a 13% framing discount', () => {
    const r = run({ bundleCandidateTotal: 20.99, bundleSize: 3 });
    // 20.99 is 12.5% under 24.00 — inside the 15% framing need
    expect(r.flags.some(f => f.code === 'PP-09')).toBe(false);
  });

  it('bundle net beats single net when bundle volume is at or above the singles run-rate', () => {
    // bundleUnitsPerMonth default (12) is per-singles run-rate (25) — set it
    // equal to the sum of singles so the 1.3× multiplier wins
    const r = run({ bundleUnitsPerMonth: 75 });
    expect(r.bundle!.bundleNet).toBeGreaterThan(r.bundle!.singleNet);
  });
});

describe('verdict ladder', () => {
  it('asks for volume when units are zero', () => {
    const r = run({ unitsPerMonth: 0 });
    expect(r.verdict).toBe('Enter your volume first');
    expect(r.flags).toHaveLength(0);
  });

  it('crosses-the-barrier verdict when barrier crossed and net improves', () => {
    const r = run();
    expect(r.verdict).toContain('Cross the barrier');
  });

  it('costs-you-money verdict when the candidate nets below its no-lift baseline', () => {
    // Premium positioning applies a 4% charm DRAG. At the same listed price there
    // is no digit change to offset the drag: candidate nets 96% of the no-lift
    // baseline — under the 95% safety line after the verdict band check.
    const r = run({ tierPositioning: 'premium', currentPrice: 24.99, candidatePrice: 24.99 });
    const noLift = 24.99 * 25 * 0.9;
    expect(r.candidate.monthlyNet).toBeLessThan(noLift);
    expect(r.verdict).toContain('costs you money');
  });

  it('marginal verdict when prices net close together', () => {
    // Mainstream candidate $22.00 vs current $22.99: no left-digit change, the
    // small +3% mainstream lift can't cover the 4.3% price cut — the two prices
    // net within the 5% band, so the decision rests on tier positioning, not cents.
    const r = run({ candidatePrice: 22.0, currentPrice: 22.99 });
    expect(r.verdict).toContain('Marginal');
  });
});

describe('fmt$', () => {
  it('formats dollars with sign and two decimals', () => {
    expect(fmt$(-22.5)).toBe('−$22.50');
    expect(fmt$(22)).toBe('$22.00');
  });
});

import { fmt$ } from './pricing-psychology-lab';
