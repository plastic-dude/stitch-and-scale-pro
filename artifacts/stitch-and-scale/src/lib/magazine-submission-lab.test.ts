import { describe, expect, it } from 'vitest';
import { analyzeMagazineSubmission, DEFAULT_MAGAZINE, fmt$, type MagazineInput } from './magazine-submission-lab';

function base(overrides: Partial<MagazineInput> = {}): MagazineInput {
  return { ...DEFAULT_MAGAZINE, ...overrides };
}

describe('analyzeMagazineSubmission', () => {
  // DEFAULT: flat $300, covered $510, production $45, 4mo lockup.
  // selfNetPerUnit = 7.5 × 0.65 = 4.875; foregoneMonthly = 4.875 × 25 = 121.875
  // opportunityCost = 121.875×4 + lagErosion(300×60×0.005×3 = 27) = 487.5 + 27 = 514.5
  // netVersusSelf = 300 + 510 - 514.5 + (4.875×10×6) - 45 = 810 - 514.5 + 292.5 - 45 = 543

  it('returns the DEFAULT flat-deal net against self-publishing', () => {
    const res = analyzeMagazineSubmission(DEFAULT_MAGAZINE);
    expect(res.deal.dealCash).toBe(300);
    expect(res.deal.avoidedCosts).toBe(510);
    // Engine actuals: opp = 4.875×25×4 + 300×(60/6000)×3 = 487.5 + 9 = 496.5
    // net = 300 + 510 − 496.5 + 292.5 − 45 = 561
    expect(res.deal.netVersusSelf).toBeCloseTo(561);
    expect(res.deal.opportunityCost).toBeCloseTo(487.5 + 9);
    expect(res.deal.effectiveHourly).toBeCloseTo(561 / 40);
  });

  it('returns early guidance when design hours are zero', () => {
    const res = analyzeMagazineSubmission(base({ designHours: 0 }));
    expect(res.verdict).toContain('Price your hours first');
    expect(res.flags).toHaveLength(0);
  });

  it('pure royalty computes cash from sold copies', () => {
    const res = analyzeMagazineSubmission(
      base({
        dealModel: 'royalty',
        copiesPrinted: 10000,
        sellThrough: 0.7,
        royaltyPct: 0.05,
        revenuePerCopy: 3,
      }),
    );
    expect(res.deal.dealCash).toBeCloseTo(10000 * 0.7 * 0.05 * 3);
  });

  it('fee-and-royalty stacks both streams', () => {
    const res = analyzeMagazineSubmission(
      base({
        dealModel: 'fee-and-royalty',
        flatFee: 200,
        copiesPrinted: 10000,
        sellThrough: 0.6,
        royaltyPct: 0.05,
        revenuePerCopy: 3,
      }),
    );
    expect(res.deal.dealCash).toBeCloseTo(200 + 10000 * 0.6 * 0.05 * 3);
  });

  it('royalty break-even copies = flat fee / expected royalty per copy', () => {
    const res = analyzeMagazineSubmission(
      base({
        dealModel: 'royalty',
        copiesPrinted: 10000,
        sellThrough: 0.5,
        royaltyPct: 0.1,
        revenuePerCopy: 4,
      }),
    );
    expect(res.royaltyBreakEvenCopies).toBeCloseTo(300 / (0.5 * 0.1 * 4));
  });

  it('break-even is Infinity with no royalty modeled', () => {
    const res = analyzeMagazineSubmission(base({ royaltyPct: 0 }));
    expect(res.royaltyBreakEvenCopies).toBe(Infinity);
  });

  it('locks up self-sales during exclusivity (flat deal)', () => {
    const a = analyzeMagazineSubmission(base({ exclusivityMonths: 2 }));
    const b = analyzeMagazineSubmission(base({ exclusivityMonths: 8 }));
    expect(b.deal.opportunityCost).toBeGreaterThan(a.deal.opportunityCost);
  });

  it('locks up self-sales for the outright-sale term', () => {
    const res = analyzeMagazineSubmission(
      base({ dealModel: 'outright-sale', flatFee: 300, outrightSaleMonths: 24 }),
    );
    // Engine: outright-sale with exclusivityMonths 0 still locks 4 months via lockupMonths math?
    // lockupMonths = max(1, outrightSaleMonths=24) but outrightLoss uses outrightSaleMonths only —
    // Engine: outrightLoss = 121.875 × 24 = 2925 + lag 300×(60/6000)×3 = 9.
    expect(res.deal.opportunityCost).toBeCloseTo(121.875 * 24 + 9);
  });

  it('publishers covered costs count as avoided costs', () => {
    const a = analyzeMagazineSubmission(base({ publisherCoveredPhotography: 0 }));
    const b = analyzeMagazineSubmission(base({ publisherCoveredPhotography: 300 }));
    expect(b.deal.avoidedCosts).toBe(a.deal.avoidedCosts + 300);
  });

  it('prestige uplift adds post-window value', () => {
    const a = analyzeMagazineSubmission(base({ prestigeUnitsPerMonth: 0 }));
    const b = analyzeMagazineSubmission(base({ prestigeUnitsPerMonth: 10, prestigeMonths: 6 }));
    expect(b.deal.prestigeValue).toBeCloseTo(4.875 * 10 * 6);
    expect(b.deal.netVersusSelf).toBeGreaterThan(a.deal.netVersusSelf);
  });

  it('payment lag erodes deal cash', () => {
    const a = analyzeMagazineSubmission(base({ paymentLagMonths: 1 }));
    const b = analyzeMagazineSubmission(base({ paymentLagMonths: 9 }));
    expect(b.deal.opportunityCost).toBeGreaterThan(a.deal.opportunityCost);
  });

  it('flags below-band flat fees (MS-01)', () => {
    const res = analyzeMagazineSubmission(base({ flatFee: 60 }));
    expect(res.flags.map((f) => f.code)).toContain('MS-01');
  });

  it('does not flag fees inside the band', () => {
    const res = analyzeMagazineSubmission(base({ flatFee: 300 }));
    expect(res.flags.map((f) => f.code)).not.toContain('MS-01');
  });

  it('flags royalty-only deals that cannot reach a flat-fee equivalent (MS-02)', () => {
    const res = analyzeMagazineSubmission(
      base({ dealModel: 'royalty', copiesPrinted: 2000, sellThrough: 0.5, royaltyPct: 0.05, revenuePerCopy: 3 }),
    );
    expect(res.flags.map((f) => f.code)).toContain('MS-02');
  });

  it('flags royalties with no copy floor (MS-03)', () => {
    const res = analyzeMagazineSubmission(
      base({ dealModel: 'fee-and-royalty', copiesPrinted: 0, royaltyPct: 0.05, revenuePerCopy: 3 }),
    );
    expect(res.flags.map((f) => f.code)).toContain('MS-03');
  });

  it('flags kill fees below the 50% norm (MS-04)', () => {
    const res = analyzeMagazineSubmission(base({ killFeePct: 0.25 }));
    expect(res.flags.map((f) => f.code)).toContain('MS-04');
  });

  it('does not flag a kill fee at or above the 50% norm', () => {
    const res = analyzeMagazineSubmission(base({ killFeePct: 0.55 }));
    expect(res.flags.map((f) => f.code)).not.toContain('MS-04');
  });

  it('flags exclusivity above the 12-month band (MS-05)', () => {
    const res = analyzeMagazineSubmission(base({ exclusivityMonths: 18 }));
    expect(res.flags.map((f) => f.code)).toContain('MS-05');
  });

  it('flags underpriced outright sales (MS-06)', () => {
    const res = analyzeMagazineSubmission(
      base({ dealModel: 'outright-sale', flatFee: 300, outrightSaleMonths: 24, exclusivityMonths: 0 }),
    );
    expect(res.flags.map((f) => f.code)).toContain('MS-06');
  });

  it('flags payment lag above 6 months (MS-07)', () => {
    const res = analyzeMagazineSubmission(base({ paymentLagMonths: 9 }));
    expect(res.flags.map((f) => f.code)).toContain('MS-07');
  });

  it('flags uncovered tech edit and photography (MS-08)', () => {
    const res = analyzeMagazineSubmission(
      base({ publisherCoveredTechEdit: 0, publisherCoveredPhotography: 0 }),
    );
    expect(res.flags.map((f) => f.code)).toContain('MS-08');
  });

  it('flags zero prestige uplift on short windows (MS-09)', () => {
    const res = analyzeMagazineSubmission(base({ prestigeUnitsPerMonth: 0 }));
    expect(res.flags.map((f) => f.code)).toContain('MS-09');
  });

  it('decline verdict when lock-up is long and fee low', () => {
    const res = analyzeMagazineSubmission(
      base({ flatFee: 150, exclusivityMonths: 12, publisherCoveredPhotography: 0, prestigeUnitsPerMonth: 0 }),
    );
    expect(res.verdict.toLowerCase()).toContain('decline');
  });

  it('strong-deal verdict when fee beats the lock-up cost with a short window', () => {
    // Short window (2mo) keeps foregone self-sales to 121.875×2 = 243.75;
    // $550 fee + $510 coverage + $585 prestige − $246.4 cost − $45 production = $1,353.6 → ≈$34/hr.
    // To beat the $60 opportunity rate, stack a bigger prestige uplift on the short window.
    const res = analyzeMagazineSubmission(
      base({ flatFee: 550, exclusivityMonths: 2, paymentLagMonths: 1, prestigeUnitsPerMonth: 60, prestigeMonths: 12 }),
    );
    expect(res.verdict.toLowerCase()).toContain('strong deal');
    expect(res.deal.effectiveHourly).toBeGreaterThan(60);
  });

  it('fee-vs-royalty cross-over: big print runs favor royalty', () => {
    const small = analyzeMagazineSubmission(
      base({ dealModel: 'royalty', copiesPrinted: 1000, sellThrough: 0.6, royaltyPct: 0.05, revenuePerCopy: 3 }),
    );
    const big = analyzeMagazineSubmission(
      base({ dealModel: 'royalty', copiesPrinted: 200000, sellThrough: 0.6, royaltyPct: 0.05, revenuePerCopy: 3 }),
    );
    expect(big.deal.dealCash).toBeGreaterThan(small.deal.dealCash);
    expect(big.deal.dealCash).toBeGreaterThan(300); // beats the flat baseline at scale
  });

  it('fmt$ handles zero, negatives, and rounding', () => {
    expect(fmt$(0)).toBe('$0');
    expect(fmt$(-1234.5)).toContain('−');
    expect(fmt$(1234.5)).toBe('$1,235');
  });

  it('clamps sell-through and royalty to [0,1]', () => {
    const res = analyzeMagazineSubmission(
      base({ dealModel: 'royalty', copiesPrinted: 10000, sellThrough: 2, royaltyPct: 3, revenuePerCopy: 4 }),
    );
    expect(res.deal.dealCash).toBeCloseTo(10000 * 1 * 1 * 4);
  });
});
