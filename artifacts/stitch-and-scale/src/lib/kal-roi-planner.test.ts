import { describe, expect, it } from 'vitest';
import {
  analyzeKal,
  defaultKalEvent,
  rightsChecklist,
  estimateCollabFee,
  generateCollabPitch,
  KAL_FORMAT_LABELS,
} from './kal-roi-planner';

describe('analyzeKal', () => {
  it('returns a go for a healthy free KAL with leads and cross-sell', () => {
    const e = defaultKalEvent();
    e.format = 'free-kal';
    e.newLeads = 80;
    e.crossSellRevenue = 150;
    e.affiliateBuyers = 8;
    e.affiliateRate = 0.1;
    e.affiliateCartValue = 50;
    e.promotionHours = 2;
    e.supportHours = 3;
    e.durationWeeks = 4;
    e.hourlyRate = 12;
    // gross = 80*0.35 + 150 + 8*50*0.1 = 28 + 150 + 40 = 218 + default tail 4*3*8=96 → 314
    const r = analyzeKal(e);
    expect(r.grossRevenue).toBeCloseTo(314);
    expect(r.netProfit).toBeGreaterThan(0);
    // effective hourly under the bar because lead value is spread thin vs promo hours
    expect(r.effectiveHourly).toBeLessThan(12);
    expect(r.verdict).toBe('maybe');
    expect(r.notes.some((n) => n.includes('$12/hr'))).toBe(true);
  });

  it('flags a free KAL with no goal as a no', () => {
    const e = defaultKalEvent();
    e.format = 'free-kal';
    e.newLeads = 0;
    e.crossSellRevenue = 0;
    e.affiliateBuyers = 0;
    expect(analyzeKal(e).verdict).toBe('no');
  });

  it('flags missing affiliate rate when affiliate buyers > 0', () => {
    const e = defaultKalEvent();
    e.format = 'free-kal';
    e.newLeads = 40;
    e.affiliateBuyers = 5;
    e.affiliateRate = 0;
    const r = analyzeKal(e);
    expect(r.notes.some((n) => n.includes('10%'))).toBe(true);
  });

  it('prices the paid KAL against sales, fees, and the hourly bar', () => {
    const e = defaultKalEvent();
    e.format = 'paid-kal';
    e.patternPrice = 8;
    e.discountPct = 25;
    e.eventSalesUnits = 60;
    e.tailSalesPerMonth = 5;
    e.tailMonths = 3;
    e.crossSellRevenue = 100;
    e.platformFeeRate = 0.05;
    e.sampleYarnCost = 40;
    e.otherCosts = 0;
    e.designHours = 12;
    e.promotionHours = 2;
    e.supportHours = 6;
    e.durationWeeks = 4;
    e.hourlyRate = 12;
    const r = analyzeKal(e);
    // 60 * 6 + 5*3*8 + 100 = 360 + 120 + 100 = 580, plus default leads 31.25 → 611.25
    expect(r.grossRevenue).toBeCloseTo(611.25);
    expect(r.platformFees).toBeCloseTo(30.125);
    // labour = 12 + 2*4 + 6 = 26h * $12 = $312; cash = $40 yarn
    expect(r.labourCost).toBeCloseTo(312);
    expect(r.netCash).toBeCloseTo(541.125);
    expect(r.netProfit).toBeCloseTo(229.125);
    // cash-positive but the effective hourly rate sits under the $12 bar
    expect(r.verdict).toBe('maybe');
  });

  it('marks a paid KAL with zero expected sales as a no', () => {
    const e = defaultKalEvent();
    e.format = 'paid-kal';
    e.eventSalesUnits = 0;
    expect(analyzeKal(e).verdict).toBe('no');
  });

  it('accepts a sponsored KAL that clears the bar and covers costs', () => {
    const e = defaultKalEvent();
    e.format = 'sponsored-kal';
    e.eventSalesUnits = 40;
    e.crossSellRevenue = 80;
    e.sampleYarnCost = 0;
    e.otherCosts = 0;
    e.designHours = 14;
    e.promotionHours = 3;
    e.supportHours = 6;
    e.durationWeeks = 4;
    e.hourlyRate = 12;
    // event revenue = 40*8 + 80 + default leads 25*0.35 → 527.25; fees ≈ 25.9; labour = 14+12+6 = 32h → $384
    const r = analyzeKal(e);
    expect(r.grossRevenue).toBeCloseTo(527.25);
    expect(r.labourCost).toBeCloseTo(384);
    expect(r.netProfit).toBeGreaterThan(0);
    // Cash covers it but time sits under the hourly bar → maybe, not go
    expect(r.verdict).toBe('maybe');
    expect(r.notes.some((n) => n.includes('$80–$140'))).toBe(true);
  });

  it('warns on lump-sum deals without self-resell', () => {
    const e = defaultKalEvent();
    e.format = 'sponsored-kal';
    e.eventSalesUnits = 20;
    e.hourlyRate = 12;
    const r = analyzeKal(e);
    expect(r.notes.some((n) => n.includes('rights clause'))).toBe(true);
  });

  it('prices giveaways against prize + labour costs', () => {
    const e = defaultKalEvent();
    e.format = 'giveaway';
    e.otherCosts = 200; // expensive prize
    e.newLeads = 5;
    e.crossSellRevenue = 10;
    e.hourlyRate = 12;
    e.designHours = 4;
    e.promotionHours = 3;
    e.supportHours = 2;
    e.durationWeeks = 2;
    expect(analyzeKal(e).verdict).toBe('no');
  });

  it('approves a break-even giveaway that grows the list', () => {
    const e = defaultKalEvent();
    e.format = 'giveaway';
    e.otherCosts = 25;
    e.newLeads = 30;
    e.crossSellRevenue = 30;
    e.hourlyRate = 12;
    e.designHours = 3;
    e.promotionHours = 2;
    e.supportHours = 2;
    e.durationWeeks = 1;
    const r = analyzeKal(e);
    expect(r.netProfit).toBeGreaterThanOrEqual(0);
    expect(r.verdict).toBe('go');
  });

  it('handles sale events where volume beats the discount loss', () => {
    const e = defaultKalEvent();
    e.format = 'sale-event';
    e.discountPct = 25;
    e.eventSalesUnits = 100;
    e.tailSalesPerMonth = 0;
    e.tailMonths = 0;
    e.crossSellRevenue = 50;
    e.promotionHours = 2;
    e.supportHours = 2;
    e.durationWeeks = 1;
    e.hourlyRate = 12;
    expect(analyzeKal(e).verdict).toBe('go');
    expect(analyzeKal(e).notes.some((n) => n.includes('GAL'))).toBe(true);
  });

  it('rejects a sale event where the discount outweighs volume', () => {
    const e = defaultKalEvent();
    e.format = 'sale-event';
    e.discountPct = 50;
    e.eventSalesUnits = 5;
    e.tailSalesPerMonth = 0;
    e.tailMonths = 0;
    e.crossSellRevenue = 0;
    e.promotionHours = 3;
    e.supportHours = 3;
    e.durationWeeks = 2;
    e.hourlyRate = 15;
    expect(analyzeKal(e).verdict).toBe('no');
  });
});

describe('rightsChecklist', () => {
  const base = {
    upfrontPayment: 0,
    yarnProvided: true,
    selfResellRight: true,
    resalePriceFloor: false,
    rightsTransferred: false,
    exclusivityMonths: 0,
    sizingScope: '',
    deliverables: [] as string[],
  };

  it('flags yarn-only payment for a sized garment', () => {
    const checks = rightsChecklist({ ...base, sizingScope: 'XXS-5XL' });
    const sizing = checks.find((c) => c.item.includes('Yarn-only payment'));
    expect(sizing?.ok).toBe(false);
  });

  it('flags unpaid offers with no yarn support at all', () => {
    const checks = rightsChecklist({ ...base, yarnProvided: false });
    expect(checks.find((c) => c.item.includes('Unpaid'))?.ok).toBe(false);
  });

  it('flags lost self-resell rights on lump-sum deals', () => {
    const checks = rightsChecklist({ ...base, upfrontPayment: 300, selfResellRight: false });
    expect(checks.find((c) => c.item.includes('Self-resell'))?.ok).toBe(false);
  });

  it('flags long exclusivity windows beyond the magazine norm', () => {
    const checks = rightsChecklist({ ...base, upfrontPayment: 250, exclusivityMonths: 10 });
    const exclusivity = checks.find((c) => c.item.includes('Exclusivity'));
    expect(exclusivity?.ok).toBe(false);
    expect(exclusivity?.detail.includes('4–5 months')).toBe(true);
  });

  it('flags oversized deliverable scope', () => {
    const checks = rightsChecklist({
      ...base,
      upfrontPayment: 120,
      deliverables: ['pattern', 'chart', 'video tutorial', 'mood board', '3 reels', 'blog post', 'newsletter blurb'],
    });
    expect(checks.find((c) => c.item.includes('Deliverables'))?.ok).toBe(false);
  });

  it('passes a fair small deal', () => {
    const checks = rightsChecklist({ ...base, upfrontPayment: 100, deliverables: ['pattern', 'chart', 'photos'] });
    expect(checks.every((c) => c.ok)).toBe(true);
  });
});

describe('estimateCollabFee', () => {
  it('suggests within the $80–$140 band for a small single-size design', () => {
    const est = estimateCollabFee({
      upfrontPayment: 0,
      yarnProvided: true,
      selfResellRight: true,
      resalePriceFloor: false,
      rightsTransferred: false,
      exclusivityMonths: 0,
      sizingScope: 'M',
      deliverables: ['pattern'],
    });
    expect(est.suggestedMin).toBe(110);
    expect(est.suggestedMax).toBe(143);
  });

  it('doubles the fee for full rights transfer', () => {
    const est = estimateCollabFee({
      upfrontPayment: 0,
      yarnProvided: true,
      selfResellRight: false,
      resalePriceFloor: false,
      rightsTransferred: true,
      exclusivityMonths: 0,
      sizingScope: '',
      deliverables: [],
    });
    expect(est.suggestedMin).toBe(220);
    expect(est.notes.some((n) => n.includes('buying an asset'))).toBe(true);
  });

  it('adds 50% for multi-size grading and per-item scope premiums', () => {
    const est = estimateCollabFee({
      upfrontPayment: 0,
      yarnProvided: true,
      selfResellRight: true,
      resalePriceFloor: false,
      rightsTransferred: false,
      exclusivityMonths: 0,
      sizingScope: 'XS-3XL',
      deliverables: ['pattern', 'chart', 'video', 'reel1', 'reel2', 'reel3', 'blog'],
    });
    expect(est.sizingMultiplier).toBe(1.5);
    expect(est.scopeMultiplier).toBeGreaterThan(1);
    expect(est.suggestedMin).toBeGreaterThan(165);
  });
});

describe('generateCollabPitch', () => {
  it('produces a complete paste-ready pitch with fee ask', () => {
    const pitch = generateCollabPitch({
      designerName: 'Me',
      patternName: 'Tide Pullover',
      brandName: 'Northwind Yarns',
      kpis: { followers: 2400, newsletter: 310, patternsSold: 18 },
      ask: 'yarn support for a March KAL',
      feeAsk: 165,
    });
    expect(pitch).toContain('Subject: Design partnership idea');
    expect(pitch).toContain('Tide Pullover');
    expect(pitch).toContain('fee is $165');
    expect(pitch).toContain('retain self-resell rights');
  });

  it('uses the yarn-only ask variant when no fee', () => {
    const pitch = generateCollabPitch({
      designerName: 'Me',
      patternName: 'Tide Pullover',
      brandName: 'Northwind Yarns',
      kpis: { followers: 900, newsletter: 120, patternsSold: 6 },
      ask: 'yarn support for a sock design',
      feeAsk: 0,
    });
    expect(pitch).toContain('materials list');
    expect(pitch).not.toContain('fee is');
  });
});

describe('KAL_FORMAT_LABELS', () => {
  it('has a label for every format', () => {
    const formats = Object.keys(KAL_FORMAT_LABELS) as (keyof typeof KAL_FORMAT_LABELS)[];
    expect(formats).toHaveLength(5);
    formats.forEach((f) => expect(KAL_FORMAT_LABELS[f].length).toBeGreaterThan(0));
  });
});
