import { describe, expect, it } from 'vitest';
import { bufferFor, buyPlan, type YarnBuyInputs } from './yarn-buy-calculator';
import { PatternProject } from './grading-engine';
import { SAMPLE_CREW_NECK_SWEATER } from './sample-projects';

function sampleInputs(overrides: Partial<YarnBuyInputs> = {}): YarnBuyInputs {
  return {
    skeinYardage: 220, // e.g. Cascade 220 worsted
    skeinPrice: 14.99,
    weight: 'worsted',
    swatchConfirmed: false,
    ...overrides,
  };
}

const project = SAMPLE_CREW_NECK_SWEATER as never as PatternProject;

describe('bufferFor', () => {
  it('applies the documented 10% floor', () => {
    expect(bufferFor(sampleInputs(), 1).pct).toBe(0.1);
  });
  it('raises the buffer for fine yarn (documented risk: more yardage = more gauge-drift exposure)', () => {
    expect(bufferFor(sampleInputs({ weight: 'fingering' }), 1).pct).toBe(0.125);
  });
  it('raises the buffer for 4+ graded sizes (multi-size yardage uncertainty)', () => {
    expect(bufferFor(sampleInputs(), 5).pct).toBe(0.125);
  });
  it('combines fine yarn + large size range, capped at 15% (documented ceiling)', () => {
    const buf = bufferFor(sampleInputs({ weight: 'lace' }), 6);
    expect(buf.pct).toBe(0.15);
    expect(buf.reasons.length).toBeGreaterThanOrEqual(2);
  });
  it('lists a swatch confirmation as an explicit buffer reason', () => {
    const buf = bufferFor(sampleInputs({ swatchConfirmed: true }), 1);
    expect(buf.reasons.some(r => r.includes('swatch'))).toBe(true);
  });
});

describe('buyPlan', () => {
  it('rounds up to whole skeins and never sells a fraction of a skein', () => {
    const plan = buyPlan(project, sampleInputs());
    expect(plan.skeinsGross).toBe(Math.ceil(plan.targetYards / 220));
    expect(Number.isInteger(plan.skeinsGross)).toBe(true);
    expect(plan.skeinsGross * 220).toBeGreaterThanOrEqual(plan.targetYards);
  });
  it('applies the risk buffer so the target yards exceeds the base estimate', () => {
    const plan = buyPlan(project, sampleInputs());
    expect(plan.targetYards).toBeGreaterThan(plan.baseYards);
    expect(plan.bufferPct).toBeGreaterThanOrEqual(0.1);
    expect(plan.bufferPct).toBeLessThanOrEqual(0.15);
  });
  it('covers a realistic worsted sweater (≈1200 yd benchmark) with a sensible skein count', () => {
    const plan = buyPlan(project, sampleInputs());
    expect(plan.skeinsToBuy).toBeGreaterThan(5); // ~1200–1800 yd at 220 yd/skein
    expect(plan.totalCost).toBeGreaterThan(0);
    expect(plan.totalCost).toBeLessThan(300); // 300 dollars of yarn for one pattern is the sanity ceiling
  });
  it('offsets stash grams as whole skeins only', () => {
    const plan = buyPlan(project, sampleInputs({ stashGrams: 150, skeinGrams: 100 }));
    const planNoStash = buyPlan(project, sampleInputs());
    expect(plan.stashSkeins).toBe(1); // 150g = 1.5 skeins → only 1 whole skein covered
    expect(plan.skeinsToBuy).toBe(planNoStash.skeinsToBuy - 1);
  });
  it('recommends an insurance skein at 3+ skeins with no stash', () => {
    const plan = buyPlan(project, sampleInputs({ skeinYardage: 220 }));
    if (plan.skeinsToBuy >= 3) expect(plan.insuranceSkein).toBe(true);
    const smallYarn = buyPlan(project, sampleInputs({ skeinYardage: 440 })); // fewer, bigger skeins
    if (smallYarn.skeinsToBuy < 3) expect(smallYarn.insuranceSkein).toBe(false);
  });
  it('rejects invalid inputs explicitly instead of inventing numbers', () => {
    const plan = buyPlan(project, sampleInputs({ skeinYardage: 0 }));
    expect(plan.invalid).toBe(true);
    expect(plan.skeinsToBuy).toBe(0);
  });
  it('prices per skein consistently with the entered skein price', () => {
    const plan = buyPlan(project, sampleInputs({ skeinPrice: 10 }));
    expect(plan.totalCost).toBe(Math.round(plan.skeinsToBuy * 10 * 100) / 100);
  });
  it('computes a per-size-grade cost spread when the project grades across sizes', () => {
    const plan = buyPlan(project, sampleInputs());
    if (plan.costPerSizeLow !== null && plan.costPerSizeHigh !== null) {
      expect(plan.costPerSizeLow).toBeLessThanOrEqual(plan.costPerSizeHigh);
      expect(plan.costPerSizeLow).toBeGreaterThan(0);
    }
  });
});
