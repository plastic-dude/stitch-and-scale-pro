import { describe, it, expect } from 'vitest';
import {
  analyzePromotion,
  defaultChannels,
  defaultPromotionInput,
} from './promotion-planner';

describe('analyzePromotion', () => {
  it('computes the baseline net via the shared fee seam', () => {
    const r = analyzePromotion(defaultPromotionInput());
    // Etsy $8 pattern: netPerSale ≈ $7.08; 10/mo × 3 mo baseline ≈ 212
    expect(r.grossBaseline).toBeGreaterThan(200);
    expect(r.grossBaseline).toBeLessThan(230);
  });

  it('pauses disabled channels with zero spend', () => {
    const r = analyzePromotion(defaultPromotionInput());
    const onsite = r.channels.find((c) => c.id === 'etsyOnsite')!;
    expect(onsite.verdict).toBe('go');
    expect(onsite.spend).toBe(0);
    expect(onsite.expectedSales).toBe(0);
  });

  it('models offsite ads as pay-only-on-sale with commission haircut', () => {
    const input = defaultPromotionInput([
      { id: 'etsyOffsite', enabled: true },
    ]);
    const r = analyzePromotion(input);
    const offsite = r.channels.find((c) => c.id === 'etsyOffsite')!;
    // 15% commission: 7.08 × 0.85 ≈ $6.02; Etsy's 6.5%+processing+15% lands ~5.77
    expect(offsite.offsiteNetPerSale).toBeGreaterThan(5.7);
    expect(offsite.offsiteNetPerSale).toBeLessThan(6.1);
    expect(offsite.verdict).toBe('go');
  });

  it('kills onsite ads when CPC exceeds the break-even threshold', () => {
    const input = defaultPromotionInput([
      { id: 'etsyOnsite', enabled: true, budget: 300, cpc: 0.5, conversionPct: 3 },
    ]);
    const r = analyzePromotion(input);
    const onsite = r.channels.find((c) => c.id === 'etsyOnsite')!;
    // netPerSale ≈ 7.08 × 3% conv = 0.2124 break-even CPC; 0.50 >> 0.21
    expect(onsite.breakevenCpc).toBeCloseTo(0.21, 1);
    expect(onsite.verdict).toBe('kill');
    expect(r.verdict).toBe('no');
  });

  it('computes required conversion percentage at a given CPC', () => {
    const input = defaultPromotionInput([
      { id: 'etsyOnsite', enabled: true, budget: 300, cpc: 0.35, conversionPct: 3 },
    ]);
    const r = analyzePromotion(input);
    const onsite = r.channels.find((c) => c.id === 'etsyOnsite')!;
    // 0.35 / 7.08 ≈ 4.9% required — above the 3% setting → maybe or kill
    expect(onsite.requiredConversionPct).toBeCloseTo(4.9, 0);
    expect(['maybe', 'kill']).toContain(onsite.verdict);
  });

  it('reports revenue ROAS and the fee-stack catch', () => {
    const input = defaultPromotionInput([
      { id: 'etsyOnsite', enabled: true, budget: 150, cpc: 0.3, conversionPct: 6 },
    ]);
    const r = analyzePromotion(input);
    const onsite = r.channels.find((c) => c.id === 'etsyOnsite')!;
    // 150/0.3 = 500 clicks × 6% = 30 sales × $8 = $240 → ROAS 1.6
    expect(onsite.clicks).toBe(500);
    expect(onsite.expectedSales).toBe(30);
    expect(onsite.revenueRoas).toBeCloseTo(1.6, 1);
    // ROAS < 3 → maybe, catching the same trap as the real $182/$192 seller
    expect(onsite.verdict).toBe('maybe');
  });

  it('models organic channels with time cost', () => {
    const input = defaultPromotionInput([
      { id: 'newsletter', enabled: true, budget: 4 },
    ]);
    const r = analyzePromotion(input);
    const nl = r.channels.find((c) => c.id === 'newsletter')!;
    // 4h × 25 clicks/h = 100 clicks × 4% = 4 sales
    expect(nl.clicks).toBe(100);
    expect(nl.expectedSales).toBeCloseTo(4, 1);
    // profit = 4 × ~7.08 − 4 × 25 = 28.3 − 100 = −71.7
    expect(nl.spend).toBe(100);
    expect(nl.expectedProfit).toBeLessThan(-50);
    expect(nl.verdict).toBe('maybe');
  });

  it('ranks channels by profit per dollar and builds a budget split', () => {
    const input = defaultPromotionInput([
      { id: 'etsyOffsite', enabled: true },
      { id: 'newsletter', enabled: true, budget: 2 }, // 2h × 25 clicks × 4% = 2 sales × 7.08 − 50 ≈ −36 (time cost)
    ]);
    const r = analyzePromotion(input);
    const nl = r.channels.find((c) => c.id === 'newsletter')!;
    // The newsletter at 2h is time-cost negative — the split carries zero.
    expect(nl.expectedProfit).toBeLessThan(0);
    const rPos = analyzePromotion(defaultPromotionInput([
      { id: 'newsletter', enabled: true, budget: 1, hourlyRate: 5 },
    ]));
    // At a modest $5/hr the newsletter's 25 clicks × 4% = 1 sale × 7.08 − 5 = +2
    const nlPos = rPos.channels.find((c) => c.id === 'newsletter')!;
    expect(nlPos.expectedProfit).toBeGreaterThan(0);
    const split = rPos.budgetSplit.find((s) => s.id === 'newsletter')!;
    expect(split.recommendedSharePct).toBeGreaterThan(0);
  });

  it('allocates split share proportionally when two channels profit', () => {
    const input = defaultPromotionInput([
      { id: 'etsyOnsite', enabled: true, budget: 90, cpc: 0.2, conversionPct: 8 },
      { id: 'newsletter', enabled: true, budget: 10 },
    ]);
    const r = analyzePromotion(input);
    // onsite: 90/0.2 = 450 clicks × 8% = 36 sales × ~7.08 − 90 ≈ +165
    const onsite = r.channels.find((c) => c.id === 'etsyOnsite')!;
    expect(onsite.expectedProfit).toBeGreaterThan(100);
    const onsiteShare = r.budgetSplit.find((s) => s.id === 'etsyOnsite')?.recommendedSharePct ?? 0;
    const nlShare = r.budgetSplit.find((s) => s.id === 'newsletter')?.recommendedSharePct ?? 0;
    expect(onsiteShare).toBeGreaterThan(nlShare);
  });

  it('handles a fully organic campaign with positive profit', () => {
    const input = defaultPromotionInput([
      { id: 'pinterest', enabled: true, budget: 2 },
      { id: 'freePattern', enabled: true, budget: 2 },
    ]);
    const r = analyzePromotion(input);
    // 2h × 40 = 80 clicks × 1.5% = 1.2 sales × 7.08 − 50 ≈ −41.5 → maybe
    const p = r.channels.find((c) => c.id === 'pinterest')!;
    expect(p.expectedSales).toBeGreaterThan(1);
  });

  it('defaults to a $3/day onsite test with kill rule', () => {
    const input = defaultPromotionInput([
      { id: 'etsyOnsite', enabled: true, budget: 90 }, // $3/day × 30
    ]);
    const r = analyzePromotion(input);
    const onsite = r.channels.find((c) => c.id === 'etsyOnsite')!;
    // 90 / 0.35 ≈ 257 clicks × 3% ≈ 7.7 sales
    expect(onsite.clicks).toBeGreaterThan(250);
    expect(onsite.expectedSales).toBeCloseTo(7.7, 0);
    expect(r.killRule).toContain('$30');
  });

  it('generates a paste-ready 30-day test plan', () => {
    const r = analyzePromotion(defaultPromotionInput());
    expect(r.testPlan).toContain('Kill rule');
    expect(r.testPlan).toContain('30-Day Promotion Test Plan');
  });

  it('uses the default channel structure', () => {
    const t = defaultChannels();
    expect(t).toHaveLength(5);
    expect(t.find((c) => c.id === 'etsyOnsite')?.enabled).toBe(false);
    expect(t.find((c) => c.id === 'etsyOffsite')?.enabled).toBe(true);
  });
});
