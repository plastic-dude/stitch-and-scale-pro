import { describe, it, expect } from 'vitest';
import { platformNet, breakeven, PLATFORMS } from './pattern-income-calculator';

describe('platformNet', () => {
  it('returns net revenue below gross for every platform at $8 / 50 sales', () => {
    for (const p of PLATFORMS) {
      const n = platformNet(p, 8, 50);
      expect(n.netRevenue).toBeGreaterThan(0);
      expect(n.netRevenue).toBeLessThan(400); // 8 * 50 gross
      expect(n.totalFees).toBeGreaterThan(0);
      expect(Math.round((n.netRevenue + n.totalFees) * 100) / 100).toBe(400);
    }
  });

  it('Ravelry charges no commission below the $30/month threshold', () => {
    const n = platformNet('ravelry', 6, 4); // $24 gross, under $30
    // Only processing (~5%) should apply; fees strictly below 6% of gross.
    expect(n.totalFees).toBeCloseTo(24 * 0.05, 4);
    expect(n.effectiveFeePct).toBe(5);
  });

  it('Ravelry commission activates above $30/month', () => {
    const n = platformNet('ravelry', 6, 6); // $36 gross
    expect(n.totalFees).toBe(36 * 0.085); // 3.5% commission + 5% processing
    expect(n.effectiveFeePct).toBe(8.5);
  });

  it('Etsy fixed fees dominate at low prices', () => {
    const n = platformNet('etsy', 4, 10);
    // gross 40; fees = 10*0.20 + 40*0.065 + 40*0.03 + 10*0.25 = 2+2.6+1.2+2.5 = 8.3
    expect(n.totalFees).toBe(8.3);
    expect(n.effectiveFeePct).toBeCloseTo(20.8, 1);
  });

  it('Ribblr uses the greater of 4% or $0.25 per sale', () => {
    const low = platformNet('ribblr', 3, 1); // 4% = $0.12 < $0.25 → uses $0.25
    expect(low.totalFees).toBe(0.64); // $0.25 floor exceeds 4%; cent-rounded (0.637 → 0.64)
    const high = platformNet('ribblr', 12, 1); // 4% = $0.48 > $0.25 → uses 4%
    expect(high.totalFees).toBeCloseTo(0.48 + 12 * 0.029 + 0.3, 1); // 4% exceeds $0.25
  });

  it('net per sale is consistent with total net', () => {
    const n = platformNet('payhip', 8, 50);
    expect(n.netPerSale).toBeCloseTo(n.netRevenue / 50, 2);
  });
});

describe('breakeven', () => {
  it('computes sales to break even from hours × rate', () => {
    // 20 hours × $25 = $500; payhip $8 net ≈ $6.45/sale → ceil(500/6.45) ≈ 78
    const b = breakeven('payhip', 8, 10, 20, 25);
    const n = platformNet('payhip', 8, 1);
    expect(b.salesToBreakEven).toBe(Math.ceil(500 / n.netPerSale));
  });

  it('annualizes monthly net correctly', () => {
    const b = breakeven('ravelry', 6, 30, 10, 20);
    expect(b.annualizedNet).toBeCloseTo(platformNet('ravelry', 6, 30).netRevenue * 12, 1);
  });

  it('handles zero monthly sales gracefully', () => {
    const b = breakeven('etsy', 5, 0, 10, 20);
    expect(b.monthsToBreakEven).toBe(0);
    expect(b.salesToBreakEven).toBeGreaterThan(0);
  });
});
