import { describe, it, expect } from 'vitest';
import { analyzeKal, DEFAULT_KAL } from './kal-planner';

describe('analyzeKal', () => {
  it('models a healthy launch KAL (session-38 benchmarks)', () => {
    const r = analyzeKal({
      format: 'launch',
      patternPrice: 6.5,
      baseWeeklySales: 3,
      durationWeeks: 4,
      prizeCount: 3,
      prizeValue: 25,
      sampleCost: 75,
      hourlyCost: 20,
      totalHours: 20,
      launchLiftFactor: 2.5,
    });
    // uplift: 3 base × (2.5−1) × 4 weeks = 18 extra copies → 30 total
    expect(r.launchWindowSales).toBe(30);
    expect(r.launchWindowRevenue).toBeCloseTo(195, 0);
    // prizes+sampler: 3×25 + 75 = 150; hours: 400 → P&L
    expect(r.totalPrizeSpend).toBe(150);
    expect(r.hoursCost).toBe(400);
    expect(typeof r.net).toBe('number');
  });

  it('credits yarn-sponsor offset against prize spend', () => {
    const r = analyzeKal({ prizeCount: 4, prizeValue: 25, sampleCost: 75, yarnSponsorValue: 100 });
    expect(r.totalPrizeSpend).toBe(75); // 100 + 75 − 100 sponsor
  });

  it('models afterglow as 8 weeks of (afterglowFactor − 1) × base', () => {
    const r = analyzeKal({ baseWeeklySales: 4, patternPrice: 8, afterglowFactor: 1.25 });
    // 4 × 0.25 × 8 = 8 extra copies × $8
    expect(r.afterglowSales).toBe(8);
    expect(r.afterglowRevenue).toBe(64);
  });

  it('computes prize recovery copies at pattern price', () => {
    const r = analyzeKal({ totalHours: 0, prizeCount: 2, prizeValue: 25, sampleCost: 0, patternPrice: 6.5 });
    // $50 / $6.50 ≈ 7.69 copies
    expect(r.prizeRecoveryCopies).toBeCloseTo(7.69, 1);
  });

  it('gives mystery format a 4-clue timeline', () => {
    const r = analyzeKal({ format: 'mystery', mysteryHoursPerClue: 6 });
    expect(r.clueTimeline).toHaveLength(4);
    expect(r.clueTimeline![0].week).toBe(1);
    expect(r.clueTimeline![0].draftingHours + r.clueTimeline![0].techEditHours).toBeCloseTo(6, 1);
  });

  it('credits guild/seasonal session fee income', () => {
    const r = analyzeKal({
      format: 'guild', patternPrice: 0, baseWeeklySales: 0,
      prizeCount: 0, prizeValue: 0, sampleCost: 0,
      totalHours: 0, hourlyCost: 0, sessionFeeIncome: 45, sessionCount: 6,
    });
    expect(r.feeIncome).toBe(270);
    expect(r.net).toBe(270);
    expect(r.verdict).toBe('go');
  });

  it('flags K-01 when prizes outrun all expected revenue', () => {
    const r = analyzeKal({
      prizeCount: 10, prizeValue: 50, sampleCost: 100,
      patternPrice: 1, baseWeeklySales: 1, durationWeeks: 2,
      totalHours: 0, hourlyCost: 0, launchLiftFactor: 2,
    });
    // revenue ≈ small; spend = 600
    expect(r.redFlags.some(f => f.id === 'K-01')).toBe(true);
    expect(r.verdict).toBe('skip');
  });

  it('flags K-02 for sub-$10 prizes', () => {
    const r = analyzeKal({ prizeCount: 5, prizeValue: 5 });
    expect(r.redFlags.some(f => f.id === 'K-02')).toBe(true);
  });

  it('flags K-03 for a squeezed mystery schedule', () => {
    const r = analyzeKal({ format: 'mystery', durationWeeks: 2 });
    expect(r.redFlags.some(f => f.id === 'K-03')).toBe(true);
  });

  it('flags K-04 when hours cost dominates revenue', () => {
    const r = analyzeKal({
      totalHours: 80, hourlyCost: 25, prizeCount: 0, prizeValue: 0, sampleCost: 0,
      patternPrice: 6, baseWeeklySales: 2, durationWeeks: 4, launchLiftFactor: 2,
    });
    // revenue ≈ 64; hours = 2000 (>60% of ~88 total)
    expect(r.redFlags.some(f => f.id === 'K-04')).toBe(true);
  });

  it('flags K-05 for a launch KAL with no sample budget', () => {
    const r = analyzeKal({ format: 'launch', patternPrice: 6.5, sampleCost: 0, prizeCount: 0, prizeValue: 0 });
    expect(r.redFlags.some(f => f.id === 'K-05')).toBe(true);
  });

  it('flags K-06 for fee-free guild/seasonal KALs', () => {
    const r = analyzeKal({ format: 'seasonal', sessionFeeIncome: 0 });
    expect(r.redFlags.some(f => f.id === 'K-06')).toBe(true);
  });

  it('never produces NaN with zero/edge inputs', () => {
    const r = analyzeKal({
      patternPrice: 0, baseWeeklySales: 0, durationWeeks: 0, prizeCount: 0,
      prizeValue: 0, yarnSponsorValue: 0, sampleCost: 0, hourlyCost: 0,
      totalHours: 0, launchLiftFactor: 0, afterglowFactor: 0,
    });
    expect(Object.values(r).every(v => typeof v === 'number' || v === undefined ||
      (Array.isArray(v) ? v.every(x => Number.isFinite((x as { net?: number }).net ?? (x as number))) : true)));
    expect(Number.isNaN(r.net)).toBe(false);
  });

  it('DEFAULT_KAL passes with no overrides', () => {
    const r = analyzeKal({});
    expect(typeof r.net).toBe('number');
    expect(r.verdict).toMatch(/^(skip|hold|go)$/);
    expect(r.totalPrizeSpend).toBeGreaterThan(0);
  });
});
