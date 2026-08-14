import { describe, expect, it } from 'vitest';
import {
  analyzePreorderCampaign,
  PREORDER_CAMPAIGN_DEFAULTS as D,
} from './preorder-campaign-lab';

/**
 * Hand-verified determinism. The engine is deliberately free of randomness:
 * demand sources are rounded conversions, revenue mixes the early-bird share
 * linearly, and the threshold is the Hey-Dom formula (fixed + predicted ×
 * safe cost basis) ÷ net price. Every numeric expectation below was computed
 * step by step from the defaults and re-checked against the smoke run of
 * 2026-08-14.
 */

describe('analyzePreorderCampaign', () => {
  it('returns deterministic defaults with every field', () => {
    const a = analyzePreorderCampaign();
    const b = analyzePreorderCampaign();
    expect(a).toEqual(b);
    expect(a.predictedOrders).toBe(57);
  });

  it('computes demand from email, waitlist, and social sources', () => {
    const r = analyzePreorderCampaign();
    // 1200 x 3% = 36; 90 x 10% = 9; social 12 → 57.
    expect(r.emailOrders).toBe(36);
    expect(r.waitlistOrders).toBe(9);
    expect(r.socialOrders).toBe(12);
    expect(r.predictedOrders).toBe(57);
  });

  it('mixes early-bird and full price at the configured share', () => {
    const r = analyzePreorderCampaign();
    // 0.6 x 198 + 0.4 x 248 = 118.8 + 99.2 = 218.
    expect(r.avgRevenuePerOrder).toBe(218);
  });

  it('deducts platform fees from revenue', () => {
    const r = analyzePreorderCampaign();
    // 57 x 218 = 12426; fees 3.5% = 434.91; net 11991.09.
    expect(r.platformFees).toBe(434.91);
    expect(r.netCampaignRevenue).toBe(11991.09);
  });

  it('builds the unit cost basis with 12% overhead on materials + labor', () => {
    const r = analyzePreorderCampaign();
    // labor 1.7h x 25 = 42.50; materials 30; overhead (30+42.50) x 0.12 = 8.70;
    // fulfillment 0.7h x 25 = 17.50; shipping 12 → 30+42.50+8.70+17.50+12 = 110.70.
    expect(r.costPerUnit).toBe(110.7);
    // safe = 110.70 x 1.30 = 143.91.
    expect(r.costPerUnitSafe).toBe(143.91);
  });

  it('computes the all-or-nothing threshold from fixed + safe cost basis', () => {
    const r = analyzePreorderCampaign();
    // (420 + 57 x 143.91) = 420 + 8202.87 = 8622.87 ÷ 218 = 39.55 → 40 units.
    expect(r.minimumThreshold).toBe(40);
    // coverage 57/40 = 1.425.
    expect(r.thresholdCoverage).toBe(1.43);
  });

  it('adds buffer units beyond pre-orders', () => {
    const r = analyzePreorderCampaign();
    // 57 x 12% = 6.84 → 7 buffer; 64 total units.
    expect(r.bufferUnits).toBe(7);
  });

  it('deducts every cost including buffer for true profit', () => {
    const r = analyzePreorderCampaign();
    // production cost = 420 + 64 x 143.91 = 420 + 9210.24 = 9630.24;
    // profit = 11991.09 - 9630.24 = 2360.85.
    expect(r.netProfit).toBe(2360.85);
    expect(r.profitMarginPct).toBe(0.19);
  });

  it('reports knit and fulfillment hours honestly', () => {
    const r = analyzePreorderCampaign();
    // 64 x 1.7 = 108.8 knit; 64 x 0.7 = 44.8 fulfillment; 153.6 total.
    expect(r.totalKnitHours).toBe(108.8);
    expect(r.totalFulfillmentHours).toBe(44.8);
    // 2360.85 / 153.6 = 15.37.
    expect(r.netPerProductionHour).toBe(15.37);
    expect(r.effectiveHourly).toBe(15.37);
  });

  it('lands on the fund verdict at healthy defaults', () => {
    const r = analyzePreorderCampaign();
    expect(r.flags.find((f) => f.id === 'PC-06')).toBeTruthy();
    expect(r.verdict).toMatch(/^Fund this drop/);
  });

  it('fires PC-01 when demand falls short of the threshold', () => {
    const r = analyzePreorderCampaign({ emailListSize: 200, emailConversion: 0.03 });
    // email 6 + waitlist 9 + social 12 = 27 orders; threshold (420 + 27 x 143.91)/218
    // = 4305.57/218 = 19.75 → 20; coverage 1.35 — still fine; drive harder:
    const r2 = analyzePreorderCampaign({
      emailListSize: 150,
      waitlistSize: 20,
      socialExpectedOrders: 3,
    });
    // email 4 + 2 + 3 = 9; threshold (420 + 9 x 143.91)/218 = 1715.19/218 = 7.87 → 8;
    // coverage 1.125. Not failing. Use tiny fixed costs removed: raise fixed 1200:
    const r3 = analyzePreorderCampaign({ fixedSeriesCosts: 2400 });
    // orders 57; threshold (2400 + 57 x 143.91)/218 = 10602.87/218 = 48.6 → 49;
    // coverage 57/49 = 1.163. Still above 1. Force a fail with cost basis higher:
    const r4 = analyzePreorderCampaign({ knitHoursPerUnit: 3 });
    // cost/unit: labor 75 + 30 + (105x.12=12.6) + 17.5 + 12 = 147.1; safe 191.23;
    // avgRev 218; threshold (420 + 57 x 191.23)/218 = 11320.11/218 = 51.9 → 52;
    // coverage 57/52 = 1.096 — still above 1 (the safe margin holds 30%).
    // Realistic miss: cut demand AND raise cost: email 400 + knit 4h:
    const r5 = analyzePreorderCampaign({ emailListSize: 400, knitHoursPerUnit: 4 });
    // email 12 + 9 + 12 = 33; labor 100; cost = 30+100+15.6+17.5+12 = 175.1;
    // safe 227.63; threshold (420 + 33 x 227.63)/218 = 7931.79/218 = 36.38 → 37;
    // coverage 33/37 = 0.89 < 1 → PC-01 fires.
    expect(r5.flags.find((f) => f.id === 'PC-01')).toBeTruthy();
    expect(r5.thresholdCoverage).toBe(0.89);
    expect(r5.minimumThreshold).toBe(37);
  });

  it('fires PC-02 when the early-bird gap is under 15%', () => {
    const r = analyzePreorderCampaign({ earlyBirdPrice: 230 });
    // gap (248-230)/248 = 7.3% < 15%.
    expect(r.flags.find((f) => f.id === 'PC-02')).toBeTruthy();
    expect(r.avgRevenuePerOrder).toBe(237.2);
  });

  it('fires PC-03 and PC-04 outside the 14–45 day window', () => {
    const shortR = analyzePreorderCampaign({ campaignDays: 10 });
    expect(shortR.flags.find((f) => f.id === 'PC-03')).toBeTruthy();
    const longR = analyzePreorderCampaign({ campaignDays: 50 });
    expect(longR.flags.find((f) => f.id === 'PC-04')).toBeTruthy();
  });

  it('fires PC-05 on upfront charging with a long lead time', () => {
    const r = analyzePreorderCampaign({ chargeModel: 'upfront', leadTimeDays: 90 });
    expect(r.flags.find((f) => f.id === 'PC-05')).toBeTruthy();
    // deposit model with the same lead time must stay clean.
    const clean = analyzePreorderCampaign({ leadTimeDays: 90 });
    expect(clean.flags.find((f) => f.id === 'PC-05')).toBeFalsy();
  });

  it('fires PC-06 when fulfillment dominates production hours', () => {
    const r = analyzePreorderCampaign({ fulfillmentHoursPerUnit: 2 });
    expect(r.flags.find((f) => f.id === 'PC-06')).toBeTruthy();
    // defaults must also fire PC-06 (fulfillment 44.8/153.6 = 29%).
    const def = analyzePreorderCampaign();
    expect(def.flags.find((f) => f.id === 'PC-06')).toBeTruthy();
  });

  it('fires PC-07 below the 10% buffer standard', () => {
    const r = analyzePreorderCampaign({ bufferShare: 0.05 });
    expect(r.flags.find((f) => f.id === 'PC-07')).toBeTruthy();
    expect(r.bufferUnits).toBe(3);
  });

  it('verdicts skip when demand is nowhere near the threshold', () => {
    const r = analyzePreorderCampaign({ emailListSize: 100, waitlistSize: 10, socialExpectedOrders: 2 });
    // email 3 + 1 + 2 = 6; threshold (420 + 6 x 143.91)/218 = 1283.46/218 = 5.89 → 6;
    // coverage 1.0 — exactly on the bar. Push fixed costs up:
    const r2 = analyzePreorderCampaign({
      emailListSize: 100,
      waitlistSize: 10,
      socialExpectedOrders: 2,
      fixedSeriesCosts: 900,
    });
    // orders 6; threshold (900 + 6 x 143.91)/218 = 1763.46/218 = 8.09 → 9;
    // coverage 6/9 = 0.67 < 0.7 AND orders 6 < 0.7 x 9 = 6.3 → skip.
    expect(r2.verdict).toMatch(/^Skip this drop/);
    expect(r2.flags.find((f) => f.id === 'PC-01')).toBeTruthy();
  });

  it('verdicts don\'t-fund when the price can\'t cover the safe cost basis', () => {
    const r = analyzePreorderCampaign({
      knitHoursPerUnit: 2.3,
      fixedSeriesCosts: 1800,
    });
    // labor 57.5; cost 30+57.5+10.5+17.5+12 = 127.5; safe 165.75; threshold
    // (1800 + 57 x 165.75)/218 = 11247.75/218 = 51.6 → 52; coverage 57/52 =
    // 1.1 → demand clears the bar, but production cost 1800 + 65 x 165.75 =
    // 12573.75 against 11991.09 net revenue loses $583 — the demand question
    // passes and the pricing question fails, so don't-fund fires.
    expect(r.thresholdCoverage).toBeGreaterThanOrEqual(1);
    expect(r.netProfit).toBeLessThan(0);
    expect(r.verdict).toMatch(/^Don't fund this campaign/);
  });

  it('verdicts underpays when the threshold clears but the hour rate doesn\'t', () => {
    const r = analyzePreorderCampaign({ knitHoursPerUnit: 2.6 });
    // avg rev 218; labor 65; cost = 30+65+11.4+17.5+12 = 135.9; safe 176.67;
    // threshold (420+57x176.67)/218 = 10490.19/218 = 48.1 → 49; coverage
    // 57/49 = 1.16 >= 1 → campaign closes; profit: production cost = 420 +
    // 65 units x 176.67 = 11903.55; revenue 11991.09-... (fees on avgRev mix
    // unchanged) ≈ 86 profit on ~196 hours → well under $15/hr.
    expect(r.thresholdCoverage).toBeGreaterThanOrEqual(1);
    expect(r.effectiveHourly).toBeLessThan(15);
    expect(r.verdict).toMatch(/underpays|closes but underpays/);
  });

  it('verdicts borderline when coverage hovers at the threshold', () => {
    // Coverage in [0.7, 1) with non-negative profit is structurally impossible
    // at the default margin: coverage < 1 means fixed > orders x (rev - safe
    // cost), while profit >= 0 means fixed <= revenue - production cost - the
    // two contradict at 57 orders. The borderline branch answers "the campaign
    // closes funded or empty - one communication beat decides": coverage in
    // [0.7, 1), skipped only when demand is well short.
    const r = analyzePreorderCampaign({
      itemPrice: 398,
      earlyBirdPrice: 318, // 20% gap keeps PC-02 quiet
      fixedSeriesCosts: 12500,
    });
    // avg rev = 0.6 x 318 + 0.4 x 398 = 350; safe cost 143.91; threshold
    // (12500 + 57 x 143.91)/350 = 20702.87/350 = 59.15 -> 60; coverage
    // 57/60 = 0.95 -> in [0.7, 1), and 57 > 0.7 x 60 = 42 -> borderline.
    expect(r.thresholdCoverage).toBe(0.95);
    expect(r.minimumThreshold).toBe(60);
    expect(r.verdict).toMatch(/^Borderline/);
  });

  it('threshold math is exact at known inputs', () => {
    // Predicted 57, safe cost 143.91, fixed 420, avg rev 218:
    const r = analyzePreorderCampaign();
    expect(r.minimumThreshold).toBe(40);
    expect(r.thresholdCoverage).toBe(1.43);
  });

  it('honors useThreshold=false (no all-or-nothing bar)', () => {
    const r = analyzePreorderCampaign({ useThreshold: false });
    expect(r.minimumThreshold).toBe(0);
    expect(r.thresholdCoverage).toBe(r.predictedOrders);
  });

  it('keeps results bounded for edge inputs', () => {
    const r = analyzePreorderCampaign({
      emailListSize: 0,
      emailConversion: 0,
      waitlistSize: 0,
      socialExpectedOrders: 0,
    });
    // Demand floors at 1 predicted order; nothing may produce NaN.
    expect(r.predictedOrders).toBe(1);
    expect(JSON.stringify(r)).not.toContain('null');
  });
});
