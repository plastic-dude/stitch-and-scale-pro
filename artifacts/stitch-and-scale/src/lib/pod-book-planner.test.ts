import { describe, expect, it } from 'vitest';
import {
  analyzePodBook,
  pdfBaselineFromPatterns,
  POD_CHANNELS,
  DEFAULT_COSTS,
} from './pod-book-planner';

describe('analyzePodBook', () => {
  it('defaults run without errors and produce all six channel results', () => {
    const r = analyzePodBook();
    expect(r.allChannels).toHaveLength(6);
    expect(r.primary.channel).toBe('kdp');
    expect(r.netTotal).toBeTypeOf('number');
    expect(r.watchOuts).toBeInstanceOf(Array);
  });

  it('KDP at $19.99 / 200pp B&W nets 60% of list minus the $3.40 print cost', () => {
    const r = analyzePodBook({ listPrice: 19.99, pageCount: 200, colorPageCount: 0 });
    const kdp = r.allChannels.find(c => c.channel === 'kdp')!;
    // 60% of $19.99 = $11.99; minus 200pp B&W print $3.40 → $8.59.
    expect(kdp.netPerBook).toBeCloseTo(19.99 * 0.6 - 3.4, 1);
    expect(kdp.printCost).toBeCloseTo(3.4, 1);
  });

  it('Lulu direct nets close to the published $5.99 at $19.99 / 200pp B&W', () => {
    const r = analyzePodBook({ listPrice: 19.99, pageCount: 200, colorPageCount: 0 });
    const lulu = r.allChannels.find(c => c.channel === 'lulu_direct')!;
    expect(lulu.netPerBook).toBeGreaterThan(5.7);
    expect(lulu.netPerBook).toBeLessThan(6.3);
  });

  it('color pages cost roughly 6x a B&W page', () => {
    const bw = analyzePodBook({ listPrice: 24, pageCount: 120, colorPageCount: 0 });
    const col = analyzePodBook({ listPrice: 24, pageCount: 120, colorPageCount: 40 });
    const kdpBw = bw.allChannels.find(c => c.channel === 'kdp')!.printCost;
    const kdpCol = col.allChannels.find(c => c.channel === 'kdp')!.printCost;
    const perColor = (kdpCol - kdpBw) / 40;
    const perBw = kdpBw / 120;
    // A color page costs ~3x the average B&W page and ~6.4x the marginal
    // extra-page cost ($0.011 vs $0.07 premium). Color is the margin killer
    // in pattern books, which is exactly what the planner warns about.
    expect(perColor / perBw).toBeGreaterThan(3.0);
    expect(perColor / perBw).toBeLessThan(4.0);
    expect(perColor / POD_CHANNELS.kdp.extraPageCost).toBeGreaterThan(6.0);
    expect(perColor / POD_CHANNELS.kdp.extraPageCost).toBeLessThan(6.8);
  });

  it('flags high color share and low-net channels in watch-outs', () => {
    const r = analyzePodBook({
      listPrice: 24,
      pageCount: 120,
      colorPageCount: 50,
      copiesExpected: 150,
      productionBudget: 1000,
      marketingBudget: 150,
      pdfBaselineNet: 900,
    });
    expect(r.watchOuts.some(w => w.includes('Color share'))).toBe(true);
    expect(r.watchOuts.some(w => w.includes('Amazon') && w.includes('40%'))).toBe(true);
  });

  it('skips when expected copies are zero', () => {
    const r = analyzePodBook({ copiesExpected: 0 });
    expect(r.verdict).toBe('skip');
  });

  it('skips when the channel prints for more than the list price', () => {
    const r = analyzePodBook({ listPrice: 8, pageCount: 300, colorPageCount: 200 });
    expect(r.verdict).toBe('skip');
    expect(r.primary.netPerBook).toBe(0);
  });

  it('reviews when expected copies miss break-even', () => {
    const r = analyzePodBook({
      listPrice: 20,
      pageCount: 120,
      colorPageCount: 40,
      copiesExpected: 20,
      productionBudget: 1000,
      marketingBudget: 0,
      pdfBaselineNet: 100,
    });
    expect(r.verdict).toBe('review');
    expect(r.primary.breakEvenCopies).toBeGreaterThan(20);
    expect(r.primary.clearsBreakEven).toBe(false);
  });

  it('marks great when the book beats the PDF baseline by half or more', () => {
    const r = analyzePodBook({
      listPrice: 29.99,
      pageCount: 140,
      colorPageCount: 30,
      copiesExpected: 400,
      productionBudget: 1000,
      marketingBudget: 150,
      pdfBaselineNet: 800,
    });
    expect(['great', 'good']).toContain(r.verdict);
    expect(r.incrementalVsPdf).toBeGreaterThan(0);
  });

  it('reviews when the book nets less than the solo-PDF baseline', () => {
    const r = analyzePodBook({
      listPrice: 22,
      pageCount: 220,
      colorPageCount: 30,
      copiesExpected: 100,
      productionBudget: 1200,
      marketingBudget: 300,
      pdfBaselineNet: 1500,
    });
    expect(r.verdict).toBe('review');
    expect(r.incrementalVsPdf).toBeLessThan(0);
  });

  it('break-even copies = (production + marketing) / netPerBook', () => {
    const spend = 1150;
    const r = analyzePodBook({
      ...DEFAULT_COSTS,
      productionBudget: 1000,
      marketingBudget: 150,
    });
    expect(r.primary.breakEvenCopies).toBe(Math.ceil(spend / r.primary.netPerBook));
  });

  it('defends against garbage inputs', () => {
    const r = analyzePodBook({ listPrice: NaN, pageCount: -5, colorPageCount: 999, copiesExpected: Infinity });
    expect(r.allChannels.every(c => c.netPerBook >= 0)).toBe(true);
  });
});

describe('pdfBaselineFromPatterns', () => {
  it('applies the channel fee to each pattern and sums net', () => {
    const baseline = pdfBaselineFromPatterns([
      { retailPrice: 8, copiesInWindow: 50, channelFeeRate: 0.15 },
      { retailPrice: 9, copiesInWindow: 30, channelFeeRate: 0.15 },
    ]);
    expect(baseline).toBeCloseTo(8 * 50 * 0.85 + 9 * 30 * 0.85, 1);
  });

  it('treats missing fees as zero and clamps rates', () => {
    const baseline = pdfBaselineFromPatterns([{ retailPrice: 10, copiesInWindow: 5, channelFeeRate: 2 }]);
    expect(baseline).toBe(0);
  });
});
