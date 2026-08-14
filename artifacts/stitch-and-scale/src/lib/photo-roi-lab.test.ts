import { describe, expect, it } from 'vitest';
import { analyzePhotoRoi } from './photo-roi-lab';

describe('analyzePhotoRoi', () => {
  it('defaults without throwing and returns three options', () => {
    const r = analyzePhotoRoi({});
    expect(r.options).toHaveLength(3);
    expect(r.options.map(o => o.id)).toEqual(['diy', 'proCatalog', 'proLifestyle']);
    expect(['diy', 'proCatalog', 'proLifestyle']).toContain(r.best);
    expect(r.liftRevenue).toBeGreaterThan(0);
  });

  it('DIY costs designer time at the hourly rate plus model pay and gear amortization', () => {
    const r = analyzePhotoRoi({
      patterns: 1,
      hourlyRate: 25,
      diyHoursPerPattern: 2.5,
      gearValue: 1800,
      gearLibrarySize: 50,
      modelHourlyRate: 35,
      modelHoursPerPattern: 1,
    });
    const diy = r.options.find(o => o.id === 'diy')!;
    // 25×2.5 (time) + 35×1 (model) + 1800/50 (gear) = 62.5 + 35 + 36 = $133.50/pattern
    expect(diy.perPattern).toBeCloseTo(133.5, 0);
    expect(diy.timeCost).toBeCloseTo(62.5, 0);
    expect(diy.cashCost).toBeCloseTo(71, 0);
  });

  it('pro catalog is per-image pricing with extras', () => {
    const r = analyzePhotoRoi({
      patterns: 1,
      imagesPerPattern: 5,
      proPerImageRate: 25,
      proExtrasPerImage: 5,
    });
    const pro = r.options.find(o => o.id === 'proCatalog')!;
    expect(pro.perPattern).toBeCloseTo(5 * 30, 0);
    expect(pro.timeCost).toBe(0);
  });

  it('pro lifestyle spreads a half-day across the batch', () => {
    const r = analyzePhotoRoi({
      patterns: 4,
      imagesPerPattern: 5,
      proHalfDayRate: 400,
      patternsPerHalfDay: 4,
      proExtrasPerImage: 0,
    });
    const life = r.options.find(o => o.id === 'proLifestyle')!;
    // $400/4 patterns = $100/pattern, batched
    expect(life.perPattern).toBeCloseTo(100, 0);
    expect(life.totalCost).toBeCloseTo(400, 0);
  });

  it('break-even units use the pattern price net of platform fees', () => {
    const r = analyzePhotoRoi({
      patterns: 1,
      patternPrice: 8,
      platformFeePct: 0.15,
      imagesPerPattern: 5,
      proPerImageRate: 25,
      diyHoursPerPattern: 0,
      gearValue: 0,
      modelHourlyRate: 0,
    });
    const pro = r.options.find(o => o.id === 'proCatalog')!;
    // net per sale 6.80; 125 / 6.80 = 18.38 → 19 units
    expect(pro.breakEvenUnits).toBe(19);
  });

  it('CTR-lift economics scale with monthly sales, lift pct, and runway', () => {
    const r = analyzePhotoRoi({
      monthlySales: 100,
      thumbCtrLift: 0.15,
      patternPrice: 10,
      platformFeePct: 0.15,
      liftMonths: 12,
    });
    // 100 × 0.15 = 15 extra units/mo × $8.50 net × 12 months = $1,530
    expect(r.extraSalesPerMonth).toBeCloseTo(15, 0);
    expect(r.liftRevenue).toBeCloseTo(1530, 0);
  });

  it('winner is the cheapest total-cost option', () => {
    const r = analyzePhotoRoi({
      hourlyRate: 50,
      diyHoursPerPattern: 4,
      patterns: 1,
      imagesPerPattern: 5,
      proPerImageRate: 25,
      proHalfDayRate: 800,
      patternsPerHalfDay: 1,
    });
    const minCost = Math.min(...r.options.map(o => o.totalCost));
    const winner = r.options.find(o => o.id === r.best)!;
    expect(winner.totalCost).toBe(minCost);
  });

  it('flags over-large DIY blocks and gear amortization', () => {
    const r = analyzePhotoRoi({
      hourlyRate: 30,
      diyHoursPerPattern: 5,
      gearValue: 3000,
      gearLibrarySize: 20,
      modelHourlyRate: 0,
    });
    const diy = r.options.find(o => o.id === 'diy')!;
    expect(diy.redFlags.some(f => f.id === 'PR-01')).toBe(true);
    expect(diy.redFlags.some(f => f.id === 'PR-02')).toBe(true); // 3000/20 = 150 > 50
    expect(diy.redFlags.some(f => f.id === 'PR-03')).toBe(true); // no model budget
  });

  it('flags suspicious low per-image quotes and per-image-count bloat', () => {
    const r = analyzePhotoRoi({ proPerImageRate: 6, imagesPerPattern: 10 });
    const pro = r.options.find(o => o.id === 'proCatalog')!;
    expect(pro.redFlags.some(f => f.id === 'PR-04')).toBe(true);
    expect(pro.redFlags.some(f => f.id === 'PR-06')).toBe(true);
  });

  it('clamps lift and fee inputs and never explodes on zeros', () => {
    expect(() => analyzePhotoRoi({
      monthlySales: 0,
      thumbCtrLift: 2,
      platformFeePct: -1,
      patterns: 0,
      patternPrice: 0,
    })).not.toThrow();
    const r = analyzePhotoRoi({ monthlySales: 0, thumbCtrLift: 2, platformFeePct: -1, patterns: 0, patternPrice: 0 });
    expect(r.liftRevenue).toBe(0);
    expect(r.extraSalesPerMonth).toBe(0);
  });

  it('batching favors the lifestyle shoot as batch size grows', () => {
    const small = analyzePhotoRoi({ patterns: 1, proHalfDayRate: 400, patternsPerHalfDay: 4, proExtrasPerImage: 5, imagesPerPattern: 5 });
    const big = analyzePhotoRoi({ patterns: 4, proHalfDayRate: 400, patternsPerHalfDay: 4, proExtrasPerImage: 5, imagesPerPattern: 5 });
    const life = (r: ReturnType<typeof analyzePhotoRoi>) => r.options.find(o => o.id === 'proLifestyle')!;
    // Per-pattern: small = 400/1 + 25 extras = 425; big = 400/4 + 25 = 125 — the half-day
    // rate divides across the batch while extras scale per image
    expect(life(small).perPattern).toBeGreaterThan(life(big).perPattern);
  });

  it('verdict is skip-like guidance when break-even far exceeds velocity', () => {
    const r = analyzePhotoRoi({
      monthlySales: 2,
      patterns: 6,
      imagesPerPattern: 8,
      proPerImageRate: 90,
      hourlyRate: 40,
      diyHoursPerPattern: 4,
      patternPrice: 6,
    });
    expect(r.verdict).toContain('beyond your current velocity');
    expect(r.suggestion).toContain('batch size to 1');
  });

  it('verdict celebrates when a month of sales covers the shoot', () => {
    const r = analyzePhotoRoi({
      monthlySales: 100,
      patterns: 1,
      imagesPerPattern: 5,
      proPerImageRate: 25,
      patternPrice: 8,
    });
    expect(r.verdict).toContain('covers it');
  });
});
