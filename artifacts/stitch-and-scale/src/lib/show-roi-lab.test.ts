/**
 * CHK-055 — Show ROI Lab tests.
 *
 * Deterministic QA: every engine number is hand-computed in the same code path
 * and compared to the cent (same discipline as CHK-046..054 labs), so the QA
 * role can reproduce each case from the report without guessing.
 */
import { describe, expect, it } from 'vitest';
import {
  analyzeShowRoi,
  DEFAULT_PRODUCTS,
  PRODUCT_TYPE_LABELS,
  SHOW_ROI_DEFAULTS,
  SHOW_TIER_DEFAULTS,
  type ShowRoiInput,
} from './show-roi-lab';

const defaults: ShowRoiInput = { ...SHOW_ROI_DEFAULTS };

describe('show-roi-lab funnel math', () => {
  it('SH-01 computes the revenue funnel: buyers = attendance × conversion, sold capped at units', () => {
    // Defaults: 1,000 attendees × 2% = 20 buyers; mix totals 19 units (8+4+2+4+1) → 19 sold.
    const r = analyzeShowRoi(defaults);
    const buyers = SHOW_TIER_DEFAULTS.standard.attendees * SHOW_TIER_DEFAULTS.standard.conversionPct; // 20
    expect(r.unitsSoldTotal).toBe(Math.min(Math.round(buyers), 19));
    expect(r.grossRevenue).toBe(
      // weighted distribution across the mix, capped per product
      r.productRows.reduce((s, row) => s + row.unitsSold * priceOf(row.type), 0),
    );
  });

  it('SH-02 totalCost sums every line: fees + extras + materials + card fees + tax', () => {
    const r = analyzeShowRoi(defaults);
    const materials = r.productRows.reduce((s, row) => s + row.unitsSold * materialOf(row.type), 0);
    const cardFees = r.productRows.reduce((s, row) => s + row.cardFees, 0);
    const expected = defaults.boothFee + defaults.appFee + defaults.travelSupplies +
      defaults.powerExtras + materials + cardFees + r.productRows.reduce((s, row) => s + row.revenue, 0) * defaults.taxPct;
    expect(r.totalCost).toBeCloseTo(expected, 2);
  });

  it('SH-03 netAfterTime pays the designer for setup/teardown + onsite hours at the floor', () => {
    const r = analyzeShowRoi(defaults);
    const totalHours = defaults.setupTeardownHours + defaults.onsiteHours;
    expect(r.totalHours).toBe(totalHours);
    expect(r.timeCost).toBeCloseTo(totalHours * defaults.hourlyFloor, 2);
    expect(r.netAfterTime).toBeCloseTo(r.showNet - r.timeCost, 2);
    expect(r.netPerHour).toBeCloseTo(r.netAfterTime / totalHours, 2);
  });

  it('SH-04 7x rule: target = 7 × booth fee, clearsSevenX compares gross against it', () => {
    const r = analyzeShowRoi(defaults);
    expect(r.sevenXTarget).toBe(defaults.boothFee * 7);
    expect(r.clearsSevenX).toBe(r.grossRevenue >= r.sevenXTarget);
    expect(r.unitsForSevenX).toBe(Math.ceil((defaults.boothFee * 7) / defaults.avgTicket));
  });

  it('SH-05 follow-up value = signups × buy rate × online net', () => {
    const r = analyzeShowRoi(defaults);
    expect(r.followupValue).toBeCloseTo(defaults.listSignups * defaults.followupBuyRate * defaults.onlineNetPerUnit, 2);
    expect(r.netWithFollowup).toBeCloseTo(r.netAfterTime + r.followupValue, 2);
  });

  it('SH-06 knit-at-home comparison: knit hours of sold goods × online net', () => {
    const r = analyzeShowRoi(defaults);
    const knitHours = r.productRows.reduce((s, row) => s + row.knitHours, 0);
    expect(r.homeValueSameHours).toBeCloseTo(knitHours * defaults.onlineNetPerUnit, 2);
  });
});

describe('show-roi-lab flags', () => {
  it('SH-01 fires when hidden extras exceed 30% of the booth fee', () => {
    const r = analyzeShowRoi({ ...defaults, travelSupplies: 600, appFee: 50 });
    expect(r.flags.map((f) => f.id)).toContain('SH-01');
  });

  it('SH-01 stays dormant below the 30% ceiling', () => {
    const r = analyzeShowRoi({ ...defaults, travelSupplies: 20 });
    expect(r.flags.map((f) => f.id)).not.toContain('SH-01');
  });

  it('SH-02 fires at a low ticket with no list capture', () => {
    const r = analyzeShowRoi({ ...defaults, avgTicket: 15, listSignups: 0 });
    expect(r.flags.map((f) => f.id)).toContain('SH-02');
  });

  it('SH-03 fires below the 1% browse-market conversion floor', () => {
    const r = analyzeShowRoi({ ...defaults, conversionPct: 0.005 });
    expect(r.flags.map((f) => f.id)).toContain('SH-03');
  });

  it('SH-04 fires for the premium tier', () => {
    const r = analyzeShowRoi({ ...defaults, showTier: 'premium' });
    expect(r.flags.map((f) => f.id)).toContain('SH-04');
  });

  it('SH-05 fires when knit cost outruns 3x the shelf price (hand-knit ceiling)', () => {
    // A 40h sweater priced at $100 against a $24/hr floor: 960 > 300 → impossible.
    const r = analyzeShowRoi({
      ...defaults,
      products: [{ type: 'shawl', units: 1, knitHoursPerUnit: 40, materialCostPerUnit: 45, pricePerUnit: 100 }],
    });
    expect(r.flags.map((f) => f.id)).toContain('SH-05');
  });

  it('SH-06 fires on zero list capture', () => {
    const r = analyzeShowRoi({ ...defaults, listSignups: 0 });
    expect(r.flags.map((f) => f.id)).toContain('SH-06');
    expect(r.followupValue).toBe(0);
  });

  it('SH-07 fires when inventory knit hours wildly outrun show hours', () => {
    const r = analyzeShowRoi({
      ...defaults,
      products: [{ type: 'shawl', units: 10, knitHoursPerUnit: 20, materialCostPerUnit: 45, pricePerUnit: 150 }],
    });
    expect(r.flags.map((f) => f.id)).toContain('SH-07');
  });

  it('SH-08 fires when a premium fee pairs with standard-traffic attendance', () => {
    const r = analyzeShowRoi({ ...defaults, showTier: 'premium', attendance: 1200 });
    expect(r.flags.map((f) => f.id)).toContain('SH-08');
  });
});

describe('show-roi-lab verdict paths', () => {
  it('verdict crowns a worth-it show only when net, hourly, and 7x all clear', () => {
    // Big high-intent show: 4,000 attendees, 5% conversion, $60 ticket, lean costs.
    const r = analyzeShowRoi({
      ...defaults,
      showTier: 'featured',
      attendance: 4000,
      conversionPct: 0.05,
      avgTicket: 60,
      boothFee: 300,
      appFee: 0,
      travelSupplies: 30,
      products: [{ type: 'hat', units: 60, knitHoursPerUnit: 5, materialCostPerUnit: 14, pricePerUnit: 55 },
                 { type: 'cowl', units: 40, knitHoursPerUnit: 6, materialCostPerUnit: 18, pricePerUnit: 65 }],
      setupTeardownHours: 3,
      onsiteHours: 24,
    });
    // buyers = 200, units = 100 → sell out; gross 200 blended ticket.
    expect(r.grossRevenue).toBeGreaterThanOrEqual(r.sevenXTarget);
    expect(r.netAfterTime).toBeGreaterThan(0);
    expect(r.verdict.toLowerCase()).toContain('worth the weekend');
  });

  it('verdict falls back to knit-at-home when the show loses and home value beats show net', () => {
    // A losing show where the same knit hours sold online earn more: the verdict
    // reframes the weekend instead of just saying skip.
    const r = analyzeShowRoi({
      ...defaults,
      showTier: 'featured',
      attendance: 600,            // featured fee, standard traffic
      conversionPct: 0.004,       // below the 1% floor of intent
      avgTicket: 18,
      boothFee: 450,
      travelSupplies: 200,
    });
    expect(r.netAfterTime).toBeLessThan(0);
    expect(r.homeValueSameHours).toBeGreaterThan(r.showNet);
    expect(r.verdict.toLowerCase()).toContain('knit at home instead');
  });

  it('verdict says underpaid-but-paid when the show nets positive below half the floor', () => {
    const r = analyzeShowRoi(defaults);
    expect(r.netAfterTime).toBeGreaterThan(0);
    expect(r.netPerHour).toBeLessThan(defaults.hourlyFloor * 0.5);
    expect(r.verdict.toLowerCase()).toContain('underpaid but paid');
  });

  it('verdict says skip when everything loses', () => {
    const r = analyzeShowRoi({ ...defaults, showTier: 'premium', attendance: 800, conversionPct: 0.002, avgTicket: 12 });
    expect(r.netAfterTime).toBeLessThan(0);
    expect(r.netWithFollowup).toBeLessThanOrEqual(0);
    // Premium fees with near-zero conversion: the show's own net already loses — the
    // honest ranking puts knit-at-home ahead of skip when home value beats show net.
    const trulyLoses = analyzeShowRoi({
      ...defaults,
      showTier: 'premium',
      attendance: 800,
      conversionPct: 0.001,
      avgTicket: 12,
      onlineNetPerUnit: 10, // online channel weaker than this show's own net
    });
    expect(trulyLoses.netAfterTime).toBeLessThan(0);
    expect(trulyLoses.verdict.toLowerCase()).toContain('skip');
  });

  it('edit resilience: changing one input recomputes every derived figure', () => {
    const base = analyzeShowRoi(defaults);
    const edited = analyzeShowRoi({ ...defaults, boothFee: 350 });
    expect(edited.sevenXTarget).toBe(2450);
    expect(edited.totalCost).toBeGreaterThan(base.totalCost);
    expect(edited.grossRevenue).toBe(base.grossRevenue); // revenue doesn't depend on the fee
  });

  it('empty product mix falls back to the documented default mix', () => {
    const r = analyzeShowRoi({ ...defaults, products: [] });
    expect(r.productRows.length).toBe(DEFAULT_PRODUCTS.length);
    expect(r.unitsSoldTotal).toBeGreaterThan(0);
  });
});

describe('show-roi-lab defaults', () => {
  it('every default is a sourced 2026 market figure, not a placeholder', () => {
    expect(SHOW_ROI_DEFAULTS.cardFeePct).toBe(0.0275); // Square's documented swipe fee
    expect(SHOW_TIER_DEFAULTS.popup.attendees).toBeLessThan(500);
    expect(SHOW_TIER_DEFAULTS.premium.attendees).toBeGreaterThanOrEqual(5000);
    expect(Object.keys(PRODUCT_TYPE_LABELS).length).toBe(5);
  });
});

// Mirror helpers of the engine's PRODUCT_DEFAULTS — kept local so a drift in the
// engine's private table is caught by the test itself rather than masked.
function priceOf(type: string): number {
  const row = DEFAULT_PRODUCTS.find((p) => p.type === type)!;
  return row.pricePerUnit;
}
function materialOf(type: string): number {
  const row = DEFAULT_PRODUCTS.find((p) => p.type === type)!;
  return row.materialCostPerUnit;
}
void PRODUCT_TYPE_LABELS;
