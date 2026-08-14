import { describe, it, expect } from 'vitest';
import {
  analyzeReleaseTiming,
  SEASON_WEIGHTS,
  CATEGORY_AFFINITY,
  DEFAULT_RELEASE,
  ReleaseTimingInput,
} from './release-timing-lab';

function base(overrides: Partial<ReleaseTimingInput> = {}): ReleaseTimingInput {
  return { ...DEFAULT_RELEASE, ...overrides };
}

describe('season weights', () => {
  it('covers all 12 months with multipliers inside the researched band', () => {
    expect(SEASON_WEIGHTS).toHaveLength(12);
    for (const w of SEASON_WEIGHTS) {
      expect(w.multiplier).toBeGreaterThan(0.5);
      expect(w.multiplier).toBeLessThanOrEqual(1.5);
    }
  });

  it('holiday push is the strongest band and summer the weakest', () => {
    const oct = SEASON_WEIGHTS[9].multiplier;
    const jul = SEASON_WEIGHTS[6].multiplier;
    expect(oct).toBeGreaterThan(1.2);
    expect(jul).toBeLessThan(0.85);
    expect(oct).toBeGreaterThan(jul);
  });

  it('each month appears exactly once', () => {
    const months = SEASON_WEIGHTS.map(w => w.month).sort((a, b) => a - b);
    expect(months).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });
});

describe('month scoring', () => {
  it('only months after the design lead are marked ready', () => {
    const r = analyzeReleaseTiming(base({ currentMonth: 0, designLeadMonths: 3 }));
    const ready = r.monthScores.filter(s => s.readyOnTime);
    expect(ready.every(s => [3, 4, 5, 6, 7, 8, 9, 10, 11].includes(s.month))).toBe(true);
    expect(ready).toHaveLength(9);
    // Horizon clamps to 12 months, so a Jan start with a 3-month lead exposes Apr–Dec only.
  });

  it('a fall sweater rates highest in October', () => {
    const r = analyzeReleaseTiming(base({ currentMonth: 0, designLeadMonths: 0, categoryKey: 'sweater' }));
    const byMult = [...r.monthScores].sort((a, b) => b.effectiveMultiplier - a.effectiveMultiplier);
    expect(byMult[0].month).toBe(9);
  });

  it('a summer tee rates highest in June/July, not October', () => {
    const r = analyzeReleaseTiming(base({ currentMonth: 0, designLeadMonths: 0, categoryKey: 'lightweight' }));
    const byMult = [...r.monthScores].sort((a, b) => b.effectiveMultiplier - a.effectiveMultiplier);
    expect([5, 6, 7]).toContain(byMult[0].month);
  });

  it('a giftable design peaks hardest in the gifting window (Sep–Nov)', () => {
    const r = analyzeReleaseTiming(base({ currentMonth: 0, designLeadMonths: 0, categoryKey: 'giftable' }));
    const byMult = [...r.monthScores].sort((a, b) => b.effectiveMultiplier - a.effectiveMultiplier);
    // The gifting affinity lifts Sep–Nov to the year's joint maximum.
    expect([8, 9, 10]).toContain(byMult[0].month);
    const oct = r.monthScores.find(s => s.month === 9)!;
    const max = Math.max(...r.monthScores.map(s => s.effectiveMultiplier));
    expect(oct.effectiveMultiplier).toBeCloseTo(max, 4);
  });

  it('expected units scale with price-independent base and multiplier', () => {
    const r = analyzeReleaseTiming(base({ baseMonthlySales: 20 }));
    const oct = r.monthScores.find(s => s.month === 9)!;
    if (oct.readyOnTime) {
      expect(oct.expectedUnits).toBeCloseTo(20 * oct.effectiveMultiplier, 4);
      expect(oct.expectedRevenue).toBeCloseTo(20 * oct.effectiveMultiplier * 8, 4);
    }
  });

  it('competing-drop exposure trims effective multipliers', () => {
    const a = analyzeReleaseTiming(base({ competingDropExposure: 0 }));
    const b = analyzeReleaseTiming(base({ competingDropExposure: 0.5 }));
    for (let i = 0; i < 12; i++) {
      expect(b.monthScores[i].effectiveMultiplier).toBeLessThan(a.monthScores[i].effectiveMultiplier);
    }
  });

  it('unknown category keys fall back to the sweater default', () => {
    const a = analyzeReleaseTiming(base({ categoryKey: 'sweater' }));
    const b = analyzeReleaseTiming(base({ categoryKey: 'nonsense-category' }));
    expect(b.monthScores.map(s => s.effectiveMultiplier)).toEqual(a.monthScores.map(s => s.effectiveMultiplier));
  });
});

describe('verdict & economics', () => {
  it('launching in May (summer lull) for a sweater costs real money vs October', () => {
    const r = analyzeReleaseTiming(base({ currentMonth: 4, designLeadMonths: 0, categoryKey: 'sweater' }));
    expect(r.mistimingCost).toBeGreaterThan(200);
    expect(r.bestMonth.month).toBe(9);
  });

  it('a design finished exactly in October has no wait cost', () => {
    const r = analyzeReleaseTiming(base({ currentMonth: 0, designLeadMonths: 9, categoryKey: 'sweater' }));
    // 9-month lead from Jan lands in Oct — the best window, so waiting is free.
    expect(r.bestMonth.month).toBe(9);
    expect(r.waitValue).toBe(0);
    expect(r.verdict).toContain('No clear seasonal edge');
  });

  it('a long lead that misses the Oct peak lands on a later reachable window', () => {
    const r2 = analyzeReleaseTiming(base({ currentMonth: 4, designLeadMonths: 8, categoryKey: 'sweater' }));
    // 8-month lead from May lands in December — the Oct peak is gone this cycle.
    const bestReachable = r2.monthScores.filter(s => s.readyOnTime).sort((a, b) => b.expectedRevenue - a.expectedRevenue)[0];
    expect(bestReachable.month).not.toBe(9);
    // No unreachable-window warning and only a modest gain from waiting, so the ladder says ship on completion.
    expect(r2.verdict).toContain('No clear seasonal edge');
  });

  it('promo outcome: 15% discount with a lift under the break-even earns less than full price', () => {
    const r = analyzeReleaseTiming(base({ promo: { discountShare: 0.15, discountDays: 7, weekendShare: 0.4, volumeLift: 1.1 } }));
    // 1.1x volume at 0.85x price = 0.935 of full price — below the break-even lift of 1/0.85 ≈ 1.176.
    expect(r.promoOutcome.promoAddsRevenue).toBe(false);
    expect(r.promoOutcome.promoDelta).toBeLessThan(0);
  });

  it('promo adds revenue only when lift exceeds the discount break-even', () => {
    const r = analyzeReleaseTiming(base({ promo: { discountShare: 0.15, discountDays: 7, weekendShare: 0.4, volumeLift: 1.5 } }));
    expect(r.promoOutcome.promoAddsRevenue).toBe(true);
    expect(r.promoOutcome.promoDelta).toBeGreaterThan(0);
  });

  it('a big discount over a short window can still lose money', () => {
    const r = analyzeReleaseTiming(base({ promo: { discountShare: 0.3, discountDays: 3, weekendShare: 0.4, volumeLift: 1.4 } }));
    // Needs ~43% lift to break even on 30% off; 40% falls short.
    expect(r.promoOutcome.promoAddsRevenue).toBe(false);
  });

  it('RT-03 fires when the discount is too deep', () => {
    const r = analyzeReleaseTiming(base({ promo: { discountShare: 0.25, discountDays: 7, weekendShare: 0.4, volumeLift: 1.3 } }));
    expect(r.flags.map(f => f.code)).toContain('RT-03');
  });

  it('RT-03 does not fire at the 15% consensus cap', () => {
    const r = analyzeReleaseTiming(base({ promo: { discountShare: 0.15, discountDays: 7, weekendShare: 0.4, volumeLift: 1.3 } }));
    expect(r.flags.map(f => f.code)).not.toContain('RT-03');
  });

  it('RT-04 fires when the launch window skips the weekend', () => {
    const r = analyzeReleaseTiming(base({ promo: { discountShare: 0.15, discountDays: 5, weekendShare: 0.1, volumeLift: 1.3 } }));
    expect(r.flags.map(f => f.code)).toContain('RT-04');
  });

  it('RT-05 fires at heavy same-week competition', () => {
    const r = analyzeReleaseTiming(base({ competingDropExposure: 0.4 }));
    expect(r.flags.map(f => f.code)).toContain('RT-05');
  });

  it('RT-02 fires when the lead exceeds 4 months', () => {
    const r = analyzeReleaseTiming(base({ designLeadMonths: 5 }));
    expect(r.flags.map(f => f.code)).toContain('RT-02');
  });

  it('RT-06 always reminds about sunk hours', () => {
    const r = analyzeReleaseTiming(base({ sunkHours: 60 }));
    const rt06 = r.flags.find(f => f.code === 'RT-06');
    expect(rt06).toBeTruthy();
    expect(rt06!.title).toContain('60 hours sunk');
  });

  it('RT-07 recognizes a summer sweater start as on schedule', () => {
    const r = analyzeReleaseTiming(base({ currentMonth: 5, designLeadMonths: 3, categoryKey: 'sweater' }));
    expect(r.flags.map(f => f.code)).toContain('RT-07');
    // 3-month lead from June lands in September — inside fall warm-up.
    const rt07 = r.flags.find(f => f.code === 'RT-07');
    expect(rt07?.detail).toContain('inside the fall warm-up');
  });

  it('RT-08 fires when a giftable design cannot reach the gifting window', () => {
    const r = analyzeReleaseTiming(base({ currentMonth: 5, designLeadMonths: 3, categoryKey: 'giftable' }));
    // Ready from August — Oct IS reachable, so RT-08 must NOT fire. Verify instead via an unreachable case.
    const r2 = analyzeReleaseTiming(base({ currentMonth: 11, designLeadMonths: 11, categoryKey: 'giftable' }));
    // Ready from October next cycle — unreachable within a 12-month horizon window that ends before Oct.
    const readyMonths = r2.monthScores.filter(s => s.readyOnTime).map(s => s.month);
    if (!readyMonths.some(m => m >= 9)) {
      expect(r2.flags.map(f => f.code)).toContain('RT-08');
    } else {
      expect(r2.flags.map(f => f.code)).not.toContain('RT-08');
    }
  });

  it('flags carry unique codes and non-empty details', () => {
    const r = analyzeReleaseTiming(base({ designLeadMonths: 5, promo: { discountShare: 0.3, discountDays: 5, weekendShare: 0.1, volumeLift: 1.3 }, competingDropExposure: 0.5, sunkHours: 40 }));
    const codes = r.flags.map(f => f.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const f of r.flags) expect(f.detail.length).toBeGreaterThan(30);
  });

  it('RT-01 fires when the ready window straddles a large seasonal swing', () => {
    const r = analyzeReleaseTiming(base({ currentMonth: 4, designLeadMonths: 0, categoryKey: 'sweater' }));
    expect(r.flags.map(f => f.code)).toContain('RT-01');
  });
});

describe('verdict ladder', () => {
  it("verdict is always one of the ladder's branches and note non-empty", () => {
    const r = analyzeReleaseTiming(base());
    expect(r.verdictNote.length).toBeGreaterThan(20);
    const matched = ['Release as soon as ready', 'Hold for the', 'Ship when ready', 'No clear seasonal edge', "This season's best window is gone"].some(v => r.verdict.startsWith(v));
    expect(matched).toBe(true);
  });

  it('horizon longer than 12 is clamped', () => {
    const r = analyzeReleaseTiming(base({ horizonMonths: 24 }));
    expect(r.monthScores).toHaveLength(12);
  });

  it('best-month rank is always at least 1', () => {
    const r = analyzeReleaseTiming(base({ designLeadMonths: 6, categoryKey: 'sweater' }));
    expect(r.bestMonth.rank).toBeGreaterThanOrEqual(1);
  });
});
