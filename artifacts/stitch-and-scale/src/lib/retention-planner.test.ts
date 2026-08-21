import { describe, expect, it } from 'vitest';
import {
  analyzeRetention,
  DEFAULT_RETENTION,
  EMAIL_TIERS,
  tierForListSize,
} from './retention-planner';

describe('analyzeRetention', () => {
  it('returns positive monthly buyers and revenue for the default input', () => {
    const r = analyzeRetention();
    expect(r.monthlyBuyers).toBeGreaterThan(0);
    expect(r.monthlyListRevenue).toBeGreaterThan(0);
    expect(r.monthlyCost).toBeGreaterThanOrEqual(0);
    expect(r.twelveMonthListRevenue).toBeGreaterThan(0);
  });

  it('the default retention motion is profitable (go verdict)', () => {
    const r = analyzeRetention();
    expect(r.monthlyProfit).toBeGreaterThan(0);
    expect(r.verdict).toBe('go');
  });

  it('a big list with good purchase rate is highly profitable', () => {
    const r = analyzeRetention({
      listSize: 5000,
      activeRatePct: 60,
      releasePurchaseRatePct: 5,
      emailToolingMonthly: 49,
    });
    expect(r.verdict).toBe('go');
    expect(r.monthlyProfit).toBeGreaterThan(800);
  });

  it('heavy tooling costs flip the tooling overhead watch-out', () => {
    const r = analyzeRetention({
      listSize: 200,
      activeRatePct: 40,
      releasePurchaseRatePct: 3,
      emailToolingMonthly: 99,
    });
    expect(r.watchOut.toolingOverhead).toBe(true);
    expect(r.watchOut.items.some(i => i.includes('tooling'))).toBe(true);
  });

  it('expensive fan acquisition flips the acquisition waste watch-out', () => {
    const r = analyzeRetention({ acquisitionCostPerFan: 20 });
    expect(r.watchOut.acquisitionWaste).toBe(true);
    expect(r.watchOut.items.some(i => i.includes('underwater'))).toBe(true);
  });

  it('an optimistic purchase rate flags above the ~5% benchmark', () => {
    const r = analyzeRetention({ releasePurchaseRatePct: 9 });
    expect(r.watchOut.optimisticPurchaseRate).toBe(true);
    expect(r.watchOut.items.length).toBeGreaterThan(0);
  });

  it('a weak repeat rate flags under the 20% line', () => {
    const r = analyzeRetention({ repeatPurchaseRatePct: 8 });
    expect(r.watchOut.weakRepeat).toBe(true);
    expect(r.watchOut.items.some(i => i.includes('2nd pattern'))).toBe(true);
  });

  it('over-releasing vs consumption flags the cadence warning', () => {
    const r = analyzeRetention({ releasesPerMonth: 3, patternsConsumedPerQuarter: 2 });
    expect(r.watchOut.overRelease).toBe(true);
    expect(r.watchOut.items.some(i => i.includes('quarter'))).toBe(true);
  });

  it('a losing retention motion produces a no verdict', () => {
    const r = analyzeRetention({
      listSize: 100,
      activeRatePct: 20,
      releasePurchaseRatePct: 1,
      emailToolingMonthly: 149,
      acquisitionCostPerFan: 10,
    });
    expect(r.monthlyProfit).toBeLessThan(0);
    expect(r.verdict).toBe('no');
  });

  it('retained sales cost far less than acquired sales', () => {
    const r = analyzeRetention();
    expect(r.costPerRetainedSale).toBeGreaterThan(0);
    expect(r.costPerRetainedSale).toBeLessThan(r.costPerAcquiredSale);
    expect(r.retentionAdvantageMultiple).toBeGreaterThan(1);
  });

  it('the cohort ladder decays: first > 2nd > 3rd > loyal', () => {
    const r = analyzeRetention();
    const [first, second, third, loyal] = r.cohortLadder;
    expect(first.buyers).toBeGreaterThan(second.buyers);
    expect(second.buyers).toBeGreaterThan(third.buyers);
    expect(third.buyers).toBeGreaterThan(loyal.buyers);
    expect(first.label).toBe('First purchase');
    expect(loyal.label).toBe('Loyal (4+)');
  });

  it('a bigger repeat rate raises the cohort ladder and 12-month revenue', () => {
    const low = analyzeRetention({ repeatPurchaseRatePct: 10 });
    const high = analyzeRetention({ repeatPurchaseRatePct: 40 });
    expect(high.cohortLadder[1].buyers).toBeGreaterThan(low.cohortLadder[1].buyers);
    expect(high.twelveMonthListRevenue).toBeGreaterThan(low.twelveMonthListRevenue);
    expect(high.twelveMonthNet).toBeGreaterThan(low.twelveMonthNet);
  });

  it('cold acquisition of the repeat-buyer pool costs a large share of their 12-month revenue', () => {
    // Repeat buyers arrive free via the retention motion; buying that same
    // pool cold at $3/fan would consume a substantial slice of what they
    // would otherwise pay you. Use a higher acq cost to make the math
    // unambiguous: at $12/fan the cold cost of the buyer pool dwarfs
    // 12 months of retention motion net.
    const r = analyzeRetention({ acquisitionCostPerFan: 12 });
    expect(r.twelveMonthColdAcquisitionCost).toBeGreaterThan(
      Math.abs(r.twelveMonthNet) + 100);
  });

  it('CHK-146: never leaks NaN/Infinity into the cold-acquisition cost', () => {
    // Extended audit E-02 repro: with no real price, net-per-sale was 0 and
    // the division produced Infinity/NaN, which surfaced as "$NaN". Now the
    // cost must itself be non-finite when the comparison is meaningless.
    const zeroPrice = analyzeRetention({ avgPrice: 0 });
    expect(Number.isFinite(zeroPrice.twelveMonthColdAcquisitionCost)).toBe(false);
    // Sanity: a normal price still computes a finite cost.
    const normal = analyzeRetention({ avgPrice: 8 });
    expect(Number.isFinite(normal.twelveMonthColdAcquisitionCost)).toBe(true);
    expect(normal.twelveMonthColdAcquisitionCost).toBeGreaterThan(0);
  });

  it('Etsy net is lower than Ravelry at the same list (fee seam)', () => {
    const etsy = analyzeRetention({ platform: 'etsy' });
    const ravelry = analyzeRetention({ platform: 'ravelry' });
    expect(etsy.monthlyListRevenue).toBeLessThan(ravelry.monthlyListRevenue);
  });

  it('emails include the key merge fields', () => {
    const r = analyzeRetention();
    expect(r.releaseEmail).toContain('{first name}');
    expect(r.releaseEmail).toContain('{pattern name}');
    expect(r.welcomeEmail).toContain('free');
    expect(r.welcomeEmail).toContain('{designer name}');
  });

  it('release email cadence token adapts', () => {
    const monthly = analyzeRetention({ releasesPerMonth: 1 });
    const biweekly = analyzeRetention({ releasesPerMonth: 2 });
    expect(monthly.welcomeEmail).toContain('1 release(s)');
    expect(biweekly.welcomeEmail).toContain('2 release(s)');
  });
});

describe('email tiers', () => {
  it('tierForListSize picks the cheapest tier that covers the list', () => {
    expect(tierForListSize(100).monthly).toBe(0);
    expect(tierForListSize(2500).monthly).toBe(19);
    expect(tierForListSize(8000).monthly).toBe(49);
    expect(tierForListSize(60000).monthly).toBe(149);
  });

  it('tiers are strictly increasing in coverage and cost', () => {
    for (let i = 1; i < EMAIL_TIERS.length; i++) {
      expect(EMAIL_TIERS[i].maxContacts).toBeGreaterThan(EMAIL_TIERS[i - 1].maxContacts);
      expect(EMAIL_TIERS[i].monthly).toBeGreaterThan(EMAIL_TIERS[i - 1].monthly);
    }
  });
});

describe('default values', () => {
  it('defaults assume a small warm list on Ravelry with one release a month', () => {
    const d = DEFAULT_RETENTION;
    expect(d.platform).toBe('ravelry');
    expect(d.listSize).toBe(800);
    expect(d.releasesPerMonth).toBe(1);
    expect(d.repeatPurchaseRatePct).toBe(20);
    expect(d.emailToolingMonthly).toBe(0);
  });
});
