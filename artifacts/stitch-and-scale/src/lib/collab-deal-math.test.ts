import { describe, expect, it } from 'vitest';
import {
  analyzeDealMath,
  DEAL_MATH_DEFAULTS,
  STRUCTURE_LABELS,
  type DealMathInput,
} from './collab-deal-math';

function base(overrides: Partial<DealMathInput> = {}): DealMathInput {
  return { ...DEAL_MATH_DEFAULTS, ...overrides };
}

describe('analyzeDealMath — structure economics', () => {
  it('exclusive_flat: cash nets against work, no ongoing revenue', () => {
    const r = analyzeDealMath(base({ structure: 'exclusive_flat' }));
    expect(r.deal.cash).toBeGreaterThan(0);
    expect(r.deal.royaltyRevenue).toBe(0);
    expect(r.deal.grossInflow).toBeCloseTo(r.deal.cash, 6);
  });

  it('full_buyout locks out BOTH the exclusivity window and the full tail', () => {
    const buy = analyzeDealMath(base({ structure: 'full_buyout', tailMonths: 24 }));
    const flat = analyzeDealMath(base({ structure: 'exclusive_flat', tailMonths: 24 }));
    // same inflow basis, but the buyout must absorb the tail too.
    expect(buy.deal.lockedOutValue).toBeGreaterThan(flat.deal.lockedOutValue);
    expect(buy.deal.brandNet).toBeLessThan(flat.deal.brandNet);
  });

  it('advance_royalty: royalty pays, no lockout — concurrent selling', () => {
    const r = analyzeDealMath(base({ structure: 'advance_royalty', royaltyPct: 0.05 }));
    expect(r.deal.royaltyRevenue).toBeGreaterThan(0);
    expect(r.deal.lockedOutValue).toBe(0);
    // the company's sales are the company's revenue, not a deduction from the royalty
    expect(r.deal.grossInflow).toBeCloseTo(r.deal.cash + r.deal.royaltyRevenue, 6);
  });

  it('royalty gross base pays more than net base', () => {
    const gross = analyzeDealMath(base({ structure: 'advance_royalty', royaltyBase: 'gross', royaltyPct: 0.1 }));
    const net = analyzeDealMath(base({ structure: 'advance_royalty', royaltyBase: 'net', royaltyPct: 0.1 }));
    expect(gross.deal.royaltyRevenue).toBeGreaterThan(net.deal.royaltyRevenue);
  });

  it('yarn_support only: cash is zero and yarn counts as offset, never revenue', () => {
    const r = analyzeDealMath(base({ structure: 'yarn_support', yarnSupportValue: 150, royaltyPct: 0 }));
    expect(r.deal.cash).toBe(0);
    expect(r.deal.yarnOffset).toBe(150);
    // yarn support is a cost offset, not revenue — gross inflow with no royalty is 0,
    // but the $150 of yarn shrinks the designer's cost so the deal is less bad.
    expect(r.deal.grossInflow).toBe(0);
    const noYarn = analyzeDealMath(base({ structure: 'yarn_support', yarnSupportValue: 0, royaltyPct: 0 }));
    expect(r.deal.brandNet).toBeGreaterThan(noYarn.deal.brandNet);
    expect(r.deal.brandNet).toBeLessThan(0); // offset helps, but work still unpaid
  });

  it('lockout scales with exclusivity months and own sales velocity', () => {
    const six = analyzeDealMath(base({ exclusivityMonths: 6 }));
    const twelve = analyzeDealMath(base({ exclusivityMonths: 12 }));
    expect(twelve.deal.lockedOutValue).toBeCloseTo(six.deal.lockedOutValue * 2, 1);
    const idle = analyzeDealMath(base({ exclusivityMonths: 12, ownMonthlySales: 0 }));
    expect(idle.deal.lockedOutValue).toBe(0);
  });

  it('designerCosts = hours×rate + uncovered production costs', () => {
    const r = analyzeDealMath(base({ requiredHours: 40, hourlyRate: 25, uncoveredCosts: 300 }));
    expect(r.deal.designerCosts).toBe(40 * 25 + 300);
  });

  it('effectiveHourly = brandNet / requiredHours', () => {
    const r = analyzeDealMath(base({ requiredHours: 40 }));
    expect(r.deal.effectiveHourly).toBeCloseTo(r.deal.brandNet / 40, 1);
  });
});

describe('analyzeDealMath — verdicts', () => {
  it('defaults produce a losing deal (CHK-052 lens: most brand offers do)', () => {
    const r = analyzeDealMath(base());
    expect(r.deal.ok).toBe(false);
    expect(r.deal.effectiveHourly).toBeLessThan(DEAL_MATH_DEFAULTS.hourlyRate);
  });

  it('a buyout that clears costs + perpetuity lockout is a take', () => {
    // costs 1,000 (40h×25); perpetuity lockout = 12mo exclusivity + 24mo tail of own channel.
    const r = analyzeDealMath(base({
      structure: 'full_buyout', fixedFee: 8000, yarnSupportValue: 0,
      tailMonths: 24, exclusivityMonths: 12, uncoveredCosts: 0, ownMonthlySales: 10,
    }));
    expect(r.deal.ok).toBe(true);
    expect(r.deal.brandNet).toBeGreaterThan(0);
  });

  it('bestStructure ranks the four structures by brandNet', () => {
    // At a decent fee with no exclusivity, advance_royalty wins (no lockout, royalty pays, own channel kept).
    const r = analyzeDealMath(base({ fixedFee: 2500, exclusivityMonths: 0 }));
    const scored = ['full_buyout', 'exclusive_flat', 'advance_royalty', 'yarn_support']
      .map((s) => analyzeDealMath(base({ structure: s as DealMathInput['structure'], fixedFee: 2500, exclusivityMonths: 0 })));
    scored.sort((a, b) => b.deal.brandNet - a.deal.brandNet);
    expect(r.bestStructure).toBe(scored[0].deal.structure);
    expect(scored[0].deal.ok).toBe(true);
  });

  it('bestStructure is null when every structure loses money', () => {
    const r = analyzeDealMath(base({ fixedFee: 10, requiredHours: 200, hourlyRate: 50 }));
    const everyLoses = ['full_buyout', 'exclusive_flat', 'advance_royalty', 'yarn_support']
      .every((s) => !analyzeDealMath(base({ structure: s as DealMathInput['structure'], fixedFee: 10, requiredHours: 200, hourlyRate: 50 })).deal.ok);
    expect(everyLoses).toBe(true);
    expect(r.bestStructure).toBeNull();
  });
});

describe('analyzeDealMath — clause flags', () => {
  it('DM-01 flags full-buyout perpetuity', () => {
    const r = analyzeDealMath(base({ structure: 'full_buyout' }));
    expect(r.clauseFlags.some((f) => f.code === 'DM-01' && f.severity === 'critical')).toBe(true);
  });

  it('DM-02 flags the sole-recommended-yarn clause', () => {
    const r = analyzeDealMath(base({ soleYarnClause: true }));
    expect(r.clauseFlags.some((f) => f.code === 'DM-02')).toBe(true);
    const none = analyzeDealMath(base({ soleYarnClause: false }));
    expect(none.clauseFlags.some((f) => f.code === 'DM-02')).toBe(false);
  });

  it('DM-03 flags exclusivity lockout', () => {
    const r = analyzeDealMath(base({ exclusivityMonths: 12 }));
    expect(r.clauseFlags.some((f) => f.code === 'DM-03')).toBe(true);
  });

  it('DM-04 flags underpaying yarn-support-only deals', () => {
    const r = analyzeDealMath(base({ structure: 'yarn_support', yarnSupportValue: 80, uncoveredCosts: 300, requiredHours: 40, hourlyRate: 25 }));
    expect(r.clauseFlags.some((f) => f.code === 'DM-04')).toBe(true);
    // generous yarn support (covers costs) clears the flag
    const rich = analyzeDealMath(base({ structure: 'yarn_support', yarnSupportValue: 1500 }));
    expect(rich.clauseFlags.some((f) => f.code === 'DM-04')).toBe(false);
  });
});

describe('analyzeDealMath — channel comparison and counter letter', () => {
  it('channelComparison spread = brand inflow minus own channel tail net', () => {
    const r = analyzeDealMath(base());
    const ownTail = r.channels.find((c) => c.channel === 'own')?.netRevenue ?? 0;
    expect(r.channelComparison.spread).toBeCloseTo(r.channelComparison.brandNet - ownTail, 6);
    expect(r.channelComparison.note.length).toBeGreaterThan(0);
  });

  it('counterLetter is paste-ready and references the offer numbers', () => {
    const r = analyzeDealMath(base({ fixedFee: 246 }));
    expect(r.counterLetter).toContain('246');
    expect(r.counterLetter.toLowerCase()).toContain('exclusivity');
    expect(r.counterLetter.length).toBeGreaterThan(120);
  });

  it('STRUCTURE_LABELS covers all four structures', () => {
    expect(Object.keys(STRUCTURE_LABELS).sort()).toEqual(
      ['advance_royalty', 'exclusive_flat', 'full_buyout', 'yarn_support'],
    );
  });
});
