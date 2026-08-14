import { describe, expect, it } from 'vitest';
import {
  analyzeWholesaleDeal,
  analyzeBookDeal,
  buildWholesalePack,
  HOURLY_FLOOR,
  AGENT_SHARE,
  TAX_SHARE,
} from './wholesale-book-analyzer';

describe('analyzeWholesaleDeal', () => {
  const defaults = {
    patterns: 5,
    retailPrice: 8,
    wholesaleRate: 4,
    orderQuantity: 100,
    repeatOrderChance: 0.4,
    workHours: 40,
    exclusive: false,
    cashCosts: 200,
    yourRate: 0,
  };

  it('computes wholesale net with repeat-order uplift', () => {
    const r = analyzeWholesaleDeal(defaults);
    // 100 × $4 × (1 + 0.4×0.5) = 400 × 1.2 = 480
    expect(r.wholesaleNet).toBe(480);
  });

  it('direct equivalent beats wholesale at same volume', () => {
    const r = analyzeWholesaleDeal(defaults);
    // Ravelry net on $8 ≈ $7.47; qty 100 × (1.4) × 7.47 ≈ 1045.8
    expect(r.directNetEquivalent).toBeGreaterThan(r.wholesaleNet);
    expect(r.directNetEquivalent).toBeLessThan(1100);
  });

  it('volume breakeven is copies of direct sales matching the cheque', () => {
    const r = analyzeWholesaleDeal(defaults);
    const rate = r.directNetEquivalent / (100 * 1.4);
    expect(r.volumeBreakeven).toBe(Math.ceil(480 / rate));
    expect(r.volumeBreakeven).toBeGreaterThan(48);
  });

  it('flags hourly below the floor on a low-rate deal', () => {
    const r = analyzeWholesaleDeal({
      ...defaults,
      wholesaleRate: 1.5,
      workHours: 60,
      cashCosts: 100,
    });
    expect(r.effectiveHourly).toBeLessThan(HOURLY_FLOOR);
    expect(r.verdict).toBe('no');
    expect(r.notes.some((n) => n.includes('$12/hr'))).toBe(true);
  });

  it('verdict go clears cash costs plus labour at the floor', () => {
    const r = analyzeWholesaleDeal({
      ...defaults,
      wholesaleRate: 4,
      workHours: 15, // 480 / 15 = 32/hr
      cashCosts: 100,
    });
    expect(r.verdict).toBe('go');
    expect(r.labourCovered).toBe(true);
  });

  it('under-keystone rate gets an anchoring note', () => {
    const r = analyzeWholesaleDeal({ ...defaults, wholesaleRate: 3 }); // 37.5% of $8
    expect(r.notes.some((n) => n.includes('keystone'))).toBe(true);
  });

  it('non-exclusive is flagged as pure upside', () => {
    const r = analyzeWholesaleDeal(defaults);
    expect(r.notes.some((n) => n.includes('pure upside'))).toBe(true);
  });

  it('exclusive deal notes the direct sales given up', () => {
    const r = analyzeWholesaleDeal({ ...defaults, exclusive: true });
    expect(r.notes.some((n) => n.includes('Exclusive deal'))).toBe(true);
  });

  it('handles zero self-sell rate fallback safely', () => {
    const r = analyzeWholesaleDeal({ ...defaults, yourRate: 0, retailPrice: 0 });
    // no retail price → yourRate falls back to 0 (Ravelry net on $0 is 0)
    expect(r.volumeBreakeven).toBe(Infinity);
  });
});

describe('analyzeBookDeal', () => {
  const defaults = {
    patterns: 10,
    advance: 5000,
    installments: 3 as const,
    royaltyRate: 10,
    coverPrice: 28,
    workHours: 400,
    cashCosts: 800,
    selfPublishMonths: 24,
    monthlySelfSellUnits: 8,
    unitNet: 5.7,
  };

  it('earns out = advance / per-copy royalty', () => {
    const r = analyzeBookDeal(defaults);
    expect(r.perCopyRoyalty).toBe(2.8);
    expect(r.earnOutCopies).toBe(1786); // ceil(5000/2.8)
  });

  it('net advance clears 15% agent then ~35% tax', () => {
    const r = analyzeBookDeal(defaults);
    expect(r.agentCut).toBe(750);
    const afterAgent = 5000 - 750;
    expect(r.taxCut).toBeCloseTo(afterAgent * TAX_SHARE, 1);
    expect(r.netAdvanceAfterDeductions).toBeCloseTo(
      afterAgent - afterAgent * TAX_SHARE,
      0
    );
  });

  it('three installments land at signing, ~8mo, ~14mo', () => {
    const r = analyzeBookDeal(defaults);
    expect(r.installmentTimeline).toEqual([
      'At signing (month 0)',
      'Month ~8',
      'Month ~14',
    ]);
  });

  it('four installments add a publication payment', () => {
    const r = analyzeBookDeal({ ...defaults, installments: 4 });
    expect(r.installmentTimeline.length).toBe(4);
    expect(r.installmentTimeline[3]).toContain('Month ~20');
  });

  it('self-publish comparison uses unit net over the window', () => {
    const r = analyzeBookDeal(defaults);
    // 8 units × $5.70 × 24 months = 1094.4
    expect(r.selfPublishNet).toBeCloseTo(1094.4, 0);
  });

  it('verdict go requires hourly clearance and beating self-sell', () => {
    const r = analyzeBookDeal({
      ...defaults,
      advance: 30000, // nets ~12k+ after deductions, 400h → >$12/hr
    });
    expect(r.dealNetPerHour).toBeGreaterThan(HOURLY_FLOOR);
    expect(r.netAdvanceAfterDeductions).toBeGreaterThan(r.selfPublishNet);
    expect(r.verdict).toBe('go');
  });

  it('verdict no when self-sell out-earns the deal', () => {
    const r = analyzeBookDeal({
      ...defaults,
      advance: 1000,
      monthlySelfSellUnits: 30,
    });
    expect(r.verdict).toBe('no');
    expect(r.notes.some((n) => n.includes('Verdict is no'))).toBe(true);
  });

  it('maybe when hourly clears but advance undercuts self-sell', () => {
    // self-publish nets ~$1,094.4 over 24 months; advance must net below
    // ~766 (70% of self-publish) for the maybe branch, with hourly ≥ $12
    // → advance 1800: net ≈ 1800×0.85×0.65 ≈ 994.5... still above; use 1400
    const r2 = analyzeBookDeal({ ...defaults, advance: 1400, workHours: 60 });
    // net ≈ 1400 × 0.85 × 0.65 ≈ 773.5 < 1094.4 ✓ ; hourly ≈ 773.5/60 ≈ 12.9 ✓
    expect(r2.dealNetPerHour).toBeGreaterThan(HOURLY_FLOOR);
    expect(r2.netAdvanceAfterDeductions).toBeLessThan(r2.selfPublishNet);
    expect(r2.verdict).toBe('maybe');
  });

  it('low royalty rate triggers a counter note', () => {
    const r = analyzeBookDeal({ ...defaults, royaltyRate: 5 });
    expect(r.notes.some((n) => n.includes('counter'))).toBe(true);
  });

  it('statement lag is ~6 months after release', () => {
    const r = analyzeBookDeal(defaults);
    expect(r.firstStatementLagMonths).toBeGreaterThanOrEqual(6);
  });
});

describe('buildWholesalePack', () => {
  it('flags small quantities, unpaid labour, open exclusivity', () => {
    const result = analyzeWholesaleDeal({
      patterns: 3,
      retailPrice: 8,
      wholesaleRate: 4,
      orderQuantity: 12,
      repeatOrderChance: 0,
      workHours: 60,
      exclusive: true,
      cashCosts: 500,
      yourRate: 7,
    });
    const pack = buildWholesalePack(
      {
        patterns: 3,
        retailPrice: 8,
        wholesaleRate: 4,
        orderQuantity: 12,
        repeatOrderChance: 0,
        workHours: 60,
        exclusive: true,
        cashCosts: 500,
        yourRate: 7,
      },
      result
    );
    expect(pack.checklist.some((c) => c.flag && c.check.includes('Volume'))).toBe(true);
    expect(pack.checklist.some((c) => c.flag && c.check.includes('Labour'))).toBe(true);
    expect(pack.checklist.some((c) => c.flag && c.check.includes('Exclusivity'))).toBe(true);
    expect(pack.reply.includes('12-month term')).toBe(true);
  });

  it('reply includes deposit terms and reorder-rate lock', () => {
    const result = analyzeWholesaleDeal({
      patterns: 5,
      retailPrice: 8,
      wholesaleRate: 4,
      orderQuantity: 100,
      repeatOrderChance: 0.4,
      workHours: 40,
      exclusive: false,
      cashCosts: 200,
      yourRate: 0,
    });
    const pack = buildWholesalePack(
      {
        patterns: 5,
        retailPrice: 8,
        wholesaleRate: 4,
        orderQuantity: 100,
        repeatOrderChance: 0.4,
        workHours: 40,
        exclusive: false,
        cashCosts: 200,
        yourRate: 0,
      },
      result
    );
    expect(pack.reply.includes('deposit')).toBe(true);
    expect(pack.reply.includes('Reorder rate locked')).toBe(true);
  });
});
