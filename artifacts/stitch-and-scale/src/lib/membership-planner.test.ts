import { describe, it, expect } from 'vitest';
import {
  analyzeMembership,
  defaultTiers,
  DEFAULT_EXCLUSIVE_PATTERN_COST,
  PLATFORM_FEE_PCT,
  PROCESSING_FEE_PCT,
} from './membership-planner';

const BASE_INPUT = {
  tiers: defaultTiers(),
  rampMonths: 6,
  platformRate: PLATFORM_FEE_PCT,
  processingRate: PROCESSING_FEE_PCT,
  exclusivePatternsPerMonth: 1,
  exclusivePatternCost: DEFAULT_EXCLUSIVE_PATTERN_COST,
  designerHoursPerPattern: 20,
  designRate: 12,
  parkedPatternPrice: 8,
  parkedPatternMonthlySalesLost: 20,
  platform: 'ravelry' as const,
  parkedHorizonMonths: 12,
};

describe('analyzeMembership', () => {
  it('computes net revenue after platform and processing fees', () => {
    const r = analyzeMembership(BASE_INPUT);
    // gross = 3*60 + 5*30 + 10*10 = 430
    expect(r.grossMonthly).toBe(430);
    // platform 10% = 43; after = 387; processing 5% = 19.35; net = 367.65
    expect(r.platformFees).toBe(43);
    expect(r.netMonthly).toBeCloseTo(367.65, 1);
    expect(r.totalMembers).toBe(100);
  });

  it('per-tier net per member reflects the fee stack', () => {
    const r = analyzeMembership(BASE_INPUT);
    const t3 = r.tiers.find((t) => t.tier.price === 3)!;
    const t10 = r.tiers.find((t) => t.tier.price === 10)!;
    // $3 net: 3 × 0.9 × 0.95 ≈ 2.57
    expect(t3.netPerMember).toBeCloseTo(2.57, 1);
    // $10 net: 10 × 0.9 × 0.95 = 8.55
    expect(t10.netPerMember).toBeCloseTo(8.55, 1);
  });

  it('deducts exclusive-pattern production cost including the labour floor', () => {
    const r = analyzeMembership(BASE_INPUT);
    // 1 pattern × ($155 + 20h × $12) = $395
    expect(r.productionCost).toBe(395);
    expect(r.labourFloor).toBe(240);
    expect(r.profitMonthly).toBeCloseTo(367.65 - 395, 1);
  });

  it('verdict is no when production outweighs net', () => {
    const r = analyzeMembership({
      ...BASE_INPUT,
      exclusivePatternsPerMonth: 3,
      exclusivePatternCost: 300,
      designerHoursPerPattern: 30,
    });
    // production = 3 × (300 + 360) = 1,980 >> net 367.65
    expect(r.profitMonthly).toBeLessThan(-1000);
    expect(r.verdict).toBe('no');
  });

  it('computes breakeven members and churn', () => {
    const r = analyzeMembership(BASE_INPUT);
    // weighted net/member ≈ 3.68; breakeven = ceil(395/3.68) ≈ 108
    expect(r.breakevenMembers).toBeGreaterThanOrEqual(100);
    // churn: 60*0.15 + 30*0.10 + 10*0.08 = 12.8
    expect(r.monthlyChurnedMembers).toBeCloseTo(12.8, 1);
  });

  it('flags a bottom-tier concentration above 80%', () => {
    const r = analyzeMembership({
      ...BASE_INPUT,
      tiers: [
        { name: 'Cheap', price: 3, members: 95, monthlyChurnPct: 15, perks: ['Pattern'] },
        { name: 'Rich', price: 10, members: 5, monthlyChurnPct: 8, perks: ['All'] },
      ],
    });
    expect(r.flags.some((f) => f.includes('churn trap'))).toBe(true);
  });

  it('flags a bottom tier netting under $2/member', () => {
    const r = analyzeMembership({
      ...BASE_INPUT,
      tiers: [
        { name: 'Tiny', price: 2, members: 50, monthlyChurnPct: 10, perks: ['Pattern'] },
      ],
    });
    // 2 × 0.9 × 0.95 = 1.71 < 2
    expect(r.flags.some((f) => f.includes('$5 as the floor tier'))).toBe(true);
  });

  it('flags a platform rate above 12%', () => {
    const r = analyzeMembership({ ...BASE_INPUT, platformRate: 15 });
    expect(r.flags.some((f) => f.includes('legacy plan'))).toBe(true);
  });

  it('flags high churn volume against the base', () => {
    const r = analyzeMembership({
      ...BASE_INPUT,
      tiers: defaultTiers().map((t) => ({ ...t, monthlyChurnPct: 25 })),
    });
    expect(r.flags.some((f) => f.includes('churn monthly'))).toBe(true);
  });

  it('models cannibalization of a parked pattern', () => {
    const r = analyzeMembership(BASE_INPUT);
    // parked: Ravelry net ≈ $5.70 × 20/mo × 12 mo ≈ $1,368 lost
    expect(r.cannibalization.parkedLoss).toBeGreaterThan(1300);
    // replacement = (367.65-395≈-27.35)/114 ≈ negative → net loss
    expect(r.cannibalization.verdict).toBe('net loss');
    expect(r.verdict).toBe('no');
  });

  it('calls cannibalization worth-it when profit covers parked losses 2×+', () => {
    const r = analyzeMembership({
      ...BASE_INPUT,
      parkedPatternMonthlySalesLost: 2, // tiny parked loss
      exclusivePatternsPerMonth: 0, // keep the default tier mix profitable
    });
    expect(r.cannibalization.verdict).toBe('worth it');
  });

  it('verdict is go when profitable with healthy structure', () => {
    const r = analyzeMembership({
      ...BASE_INPUT,
      tiers: [
        { name: 'Stitch Along', price: 5, members: 80, monthlyChurnPct: 8, perks: ['Monthly pattern'] },
        { name: 'Inner Circle', price: 12, members: 25, monthlyChurnPct: 6, perks: ['All', 'KAL'] },
      ],
      parkedPatternMonthlySalesLost: 0,
    });
    expect(r.profitMonthly).toBeGreaterThan(0);
    expect(r.verdict).toBe('go');
    expect(r.flags).toHaveLength(0);
  });

  it('handles a zero-member empty launch gracefully', () => {
    const r = analyzeMembership({
      ...BASE_INPUT,
      tiers: [{ name: 'Empty', price: 5, members: 0, monthlyChurnPct: 0, perks: [] }],
    });
    expect(r.netMonthly).toBe(0);
    expect(r.totalMembers).toBe(0);
    expect(r.verdict).toBe('no');
  });

  it('generates paste-ready tier page copy', () => {
    const r = analyzeMembership(BASE_INPUT);
    expect(r.tierCopy).toContain('Stitch Along');
    expect(r.tierCopy).toContain('$5/month');
    expect(r.tierCopy).toContain('KAL access');
  });

  it('uses the default tier structure', () => {
    const t = defaultTiers();
    expect(t).toHaveLength(3);
    expect(t[0].price).toBe(3);
  });
});
