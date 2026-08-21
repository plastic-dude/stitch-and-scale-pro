import { describe, expect, it } from 'vitest';
import {
  analyzePriceWindow,
  DEFAULT_PRICE_WINDOW,
  MONTH_SEASON,
  SEASON_MULTIPLIERS,
} from './price-window-optimizer';

describe('analyzePriceWindow', () => {
  it('returns three paths plus a delta for the default input', () => {
    const r = analyzePriceWindow();
    expect(r.fullPricePath.netRevenue).toBeGreaterThan(0);
    expect(r.launchDiscountPath.netRevenue).toBeGreaterThan(0);
    expect(r.permanentDiscountPath.netRevenue).toBeGreaterThan(0);
    expect(r.horizonMonths).toBe(3);
    expect(typeof r.seasonNote).toBe('string');
  });

  it('defaults to 20% launch sale × 2 weeks with go/maybe/no verdicts', () => {
    const r = analyzePriceWindow();
    expect(r.launchDiscountPath.name).toContain('20%');
    expect(r.launchDiscountPath.name).toContain('2 wk');
    expect(['go', 'maybe', 'no']).toContain(r.launchDiscountPath.verdict);
    expect(['go', 'maybe', 'no']).toContain(r.fullPricePath.verdict);
    expect(r.permanentDiscountPath.verdict).toBe('no');
  });

  it('deeper, longer discounts flip the trap audit', () => {
    const r = analyzePriceWindow({ launchDiscountPct: 40, launchWeeks: 8 });
    expect(r.trap.tooDeep).toBe(true);
    expect(r.trap.tooLong).toBe(true);
    expect(r.trap.items.length).toBe(2);
    expect(r.permanentDiscountPath.name).toContain('trap');
  });

  it('a 20% × 2-week window inside the standard band is clean', () => {
    const r = analyzePriceWindow({ launchDiscountPct: 20, launchWeeks: 2 });
    expect(r.trap.tooDeep).toBe(false);
    expect(r.trap.tooLong).toBe(false);
    expect(r.trap.items.length).toBe(0);
  });

  it('all net revenue runs through the platform fee seam (Etsy)', () => {
    const etsy = analyzePriceWindow({ platform: 'etsy' });
    const ravelry = analyzePriceWindow({ platform: 'ravelry' });
    // Etsy fees (~9.75% + fixed) take more than Ravelry (5.5%) at the same
    // price/volume, so Etsy net must be lower on every path.
    expect(etsy.fullPricePath.netRevenue).toBeLessThan(ravelry.fullPricePath.netRevenue);
    expect(etsy.launchDiscountPath.netRevenue).toBeLessThan(ravelry.launchDiscountPath.netRevenue);
  });

  it('a big fave queue makes the launch window profitable', () => {
    const r = analyzePriceWindow({ faveQueue: 200, discountUpliftMultiple: 3 });
    expect(r.launchDelta).toBeGreaterThan(0);
    expect(r.launchDiscountPath.verdict).toBe('go');
  });

  it('a tiny queue with a deep discount makes the window unprofitable', () => {
    const r = analyzePriceWindow({ faveQueue: 2, launchDiscountPct: 50 });
    expect(r.launchDelta).toBeLessThan(0);
    expect(['maybe', 'no']).toContain(r.launchDiscountPath.verdict);
  });

  it('season multiplier scales both paths proportionally', () => {
    const slow = analyzePriceWindow({ seasonMult: 0.6 });
    const peak = analyzePriceWindow({ seasonMult: 1.75 });
    expect(peak.fullPricePath.netRevenue).toBeGreaterThan(slow.fullPricePath.netRevenue);
    expect(peak.launchDiscountPath.netRevenue).toBeGreaterThan(slow.launchDiscountPath.netRevenue);
  });

  it('a forever sale always loses to a full-price baseline at default inputs', () => {
    const r = analyzePriceWindow();
    expect(r.permanentDiscountPath.netRevenue).toBeLessThan(r.fullPricePath.netRevenue);
  });

  it('listing copy carries the sale price, deadline and full price', () => {
    const r = analyzePriceWindow({ launchDiscountPct: 20, launchWeeks: 2, listPrice: 8 });
    expect(r.listingCopy).toContain('20% off');
    expect(r.listingCopy).toContain('day 14');
    expect(r.listingCopy).toContain('$8');
    expect(r.listingCopy).toContain('$6');
  });

  it('zero launch weeks with a discount percentage is flagged', () => {
    const r = analyzePriceWindow({ launchDiscountPct: 15, launchWeeks: 0 });
    expect(r.trap.items.some(i => i.includes('zero sale weeks'))).toBe(true);
  });

  it('normalizes hostile direct inputs before pricing math', () => {
    const r = analyzePriceWindow({
      platform: 'not-a-platform' as never,
      listPrice: Number.POSITIVE_INFINITY,
      baselineMonthlySales: -20,
      faveQueue: Number.NaN,
      launchDiscountPct: 150,
      launchWeeks: Number.POSITIVE_INFINITY,
      promoThreadLiftPerWeek: -4,
      promoThreadMonths: 0,
      fullPriceConversionPct: Number.POSITIVE_INFINITY,
      discountUpliftMultiple: -2,
      seasonMult: Number.NaN,
    });

    for (const path of [r.fullPricePath, r.launchDiscountPath, r.permanentDiscountPath]) {
      expect(Number.isFinite(path.netRevenue)).toBe(true);
      expect(Number.isFinite(path.sales)).toBe(true);
    }
    expect(Number.isFinite(r.launchDelta)).toBe(true);
    expect(r.launchDiscountPath.name).toContain('100%');
    expect(r.horizonMonths).toBe(1);
  });
});

describe('season tables', () => {
  it('covers all 12 months exactly once', () => {
    const seasons = Object.values(MONTH_SEASON);
    expect(seasons).toHaveLength(12);
    const unique = new Set(seasons);
    // 7 season ids across 12 months — some repeat by design.
    expect(unique.size).toBe(7);
  });

  it('multipliers bracket the year: summer lowest, Nov-Dec highest', () => {
    const m = SEASON_MULTIPLIERS;
    expect(m.jul.mult).toBeLessThan(m.sepoct.mult);
    expect(m.novdec.mult).toBeGreaterThan(m.mayjun.mult);
  });
});

describe('default values', () => {
  it('default input uses a Ravelry-first stance and 2-week window', () => {
    const d = DEFAULT_PRICE_WINDOW;
    expect(d.platform).toBe('ravelry');
    expect(d.launchWeeks).toBe(2);
    expect(d.launchDiscountPct).toBe(20);
  });
});
