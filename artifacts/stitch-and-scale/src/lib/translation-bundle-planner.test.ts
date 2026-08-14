import { describe, expect, it } from 'vitest';
import {
  translationCost,
  planTranslations,
  planBundle,
  generateBundlePitch,
  TranslationInput,
  BundleInput,
} from './translation-bundle-planner';

const deMarket = { code: 'de', label: 'German', demandShare: 0.5, upliftFactor: 0.3 };
const jaMarket = { code: 'ja', label: 'Japanese', demandShare: 0.3, upliftFactor: 0.4 };

const baseTranslation: TranslationInput = {
  wordCount: 2000,
  repeatedWords: 400,
  perWordRate: 0.01, // Knitlingo cited rate
  repeatDiscount: 0.5,
  fixedFees: 10,
  homeMonthlyCopies: 20,
  pricePerCopy: 8,
  channelFeeRate: 0.15,
  markets: [deMarket, jaMarket],
};

describe('translationCost', () => {
  it('bills base words full price and repeated words at discount', () => {
    // (2000-400) × 0.01 + 400 × 0.01 × 0.5 = 16 + 2 = 18 + 10 fixed = 28
    expect(translationCost(baseTranslation)).toBe(28);
  });

  it('returns just fixed fees when word count is zero', () => {
    expect(translationCost({ ...baseTranslation, wordCount: 0, repeatedWords: 0 })).toBe(10);
  });

  it('ignores negative words and negative discount', () => {
    const out = translationCost({ ...baseTranslation, wordCount: -100, repeatedWords: -10, repeatDiscount: -1 });
    expect(out).toBe(10);
  });
});

describe('planTranslations', () => {
  it('computes added copies from home volume × uplift × demand share', () => {
    const out = planTranslations(baseTranslation);
    const de = out.rows.find(r => r.market.code === 'de')!;
    // 20 × 0.3 × 0.5 = 3 copies/month
    expect(de.addedMonthlyCopies).toBe(3);
    const ja = out.rows.find(r => r.market.code === 'ja')!;
    // 20 × 0.4 × 0.3 = 2.4 → 2.4
    expect(ja.addedMonthlyCopies).toBe(2.4);
  });

  it('computes net after channel fee and payback months', () => {
    const out = planTranslations(baseTranslation);
    const de = out.rows.find(r => r.market.code === 'de')!;
    // cost 28; added net = 3 × 8 × 0.85 = 20.4; payback = 28/20.4 ≈ 1.4 mo
    expect(de.addedMonthlyNet).toBe(20.4);
    expect(de.paybackMonths).toBeCloseTo(1.4, 0);
    expect(de.worthIt).toBe(true);
  });

  it('ranks markets by fastest payback first', () => {
    const out = planTranslations(baseTranslation);
    expect(out.priorityOrder[0]).toBe('de');
    expect(out.priorityOrder[1]).toBe('ja');
  });

  it('marks a high-cost/low-demand market as not worth it past 24 months', () => {
    const out = planTranslations({
      ...baseTranslation,
      perWordRate: 0.15, // expensive human specialist
      markets: [{ code: 'tlh', label: 'Klingon', demandShare: 0.01, upliftFactor: 0.01 }],
    });
    const row = out.rows[0];
    // cost = 1600×0.15+60+10=310; net = 20×0.01×0.01×8×0.85 = 0.0136/mo → payback ≈ 22,000 mo
    expect(row.worthIt).toBe(false);
    expect(row.paybackMonths).toBeGreaterThan(24);
  });

  it('sums the worthwhile portfolio cost and net', () => {
    const out = planTranslations(baseTranslation);
    expect(out.totalCost).toBe(56); // 28 × 2 markets
    // de 20.40 + ja 16.32 (demand shares are per-market slices, not fractions of a whole)
    expect(out.addedMonthlyNet).toBeCloseTo(36.72, 1);
  });

  it('handles an empty market list', () => {
    const out = planTranslations({ ...baseTranslation, markets: [] });
    expect(out.rows).toHaveLength(0);
    expect(out.totalCost).toBe(0);
    expect(out.priorityOrder).toHaveLength(0);
  });
});

const baseBundle: BundleInput = {
  patterns: [
    { name: 'Calyx Pullover', mine: true, retailPrice: 8, soloWindowCopies: 5 },
    { name: 'Moorland Hat', mine: true, retailPrice: 4, soloWindowCopies: 8 },
    { name: 'Partner Cowl', mine: false, retailPrice: 5, soloWindowCopies: 0 },
  ],
  bundlePrice: 9,
  expectedUnits: 120,
  channelFeeRate: 0.15,
  splitMode: 'perPattern',
};

describe('planBundle', () => {
  it('computes sum of parts, discount depth and price per pattern', () => {
    const out = planBundle(baseBundle);
    expect(out.sumOfParts).toBe(17);
    expect(out.pricePerPattern).toBe(3);
    // 9/17 ≈ 47% discount depth
    expect(out.discountDepth).toBeCloseTo(1 - 9 / 17, 3);
  });

  it('nets revenue after channel fees', () => {
    const out = planBundle(baseBundle);
    expect(out.grossRevenue).toBe(9 * 120);
    expect(out.netRevenue).toBeCloseTo(1080 * 0.85, 1);
  });

  it('splits revenue by retail weight when perPattern', () => {
    const out = planBundle(baseBundle);
    // mine retail = 12/17 of net
    expect(out.myDesignerShare).toBeCloseTo(1080 * 0.85 * (12 / 17), 1);
  });

  it('splits equally across designers when equal mode', () => {
    const out = planBundle({ ...baseBundle, splitMode: 'equal', designerCount: 2 });
    expect(out.myDesignerShare).toBeCloseTo(1080 * 0.85 / 2, 1);
  });

  it('compares bundling against the solo baseline', () => {
    const out = planBundle(baseBundle);
    // solo baseline: (8×5 + 4×8) × 0.85 = 61.2
    expect(out.mySoloBaseline).toBeCloseTo(61.2, 1);
    // my share ≈ 768.7 → big upside vs solo
    expect(out.incrementalVsSolo).toBeGreaterThan(out.mySoloBaseline);
    expect(out.verdict).toBe('great');
  });

  it('returns skip when expected units are zero', () => {
    const out = planBundle({ ...baseBundle, expectedUnits: 0 });
    expect(out.verdict).toBe('skip');
    expect(out.netRevenue).toBe(0);
  });

  it('returns review/skip when bundling cannibalises solo sales', () => {
    const out = planBundle({
      ...baseBundle,
      bundlePrice: 6, // shallow discount
      expectedUnits: 8, // low volume
      patterns: baseBundle.patterns.map(p => ({
        ...p,
        soloWindowCopies: p.mine ? 15 : p.soloWindowCopies, // high solo baseline
      })),
    });
    // baseline ≈ (8×15+4×8)×0.85=129.2; share = 48×0.85×12/17 ≈ 28.8 → negative incremental
    expect(out.incrementalVsSolo).toBeLessThan(0);
    expect(out.verdict === 'review' || out.verdict === 'skip').toBe(true);
  });

  it('applies host platform fees on top of channel fees', () => {
    const a = planBundle(baseBundle);
    const b = planBundle({ ...baseBundle, hostFeeRate: 0.05 });
    expect(b.netRevenue).toBeLessThan(a.netRevenue);
    expect(b.netRevenue).toBeCloseTo(1080 * 0.85 * 0.95, 1);
  });
});

describe('generateBundlePitch', () => {
  it('names my patterns and the partner count', () => {
    const pitch = generateBundlePitch(baseBundle);
    expect(pitch).toMatch(/Calyx Pullover, Moorland Hat/);
    expect(pitch).toMatch(/1 designer/); // 1 partner
    expect(pitch).toMatch(/3 patterns/);
  });

  it('states the discount depth computed from real numbers', () => {
    const pitch = generateBundlePitch(baseBundle);
    expect(pitch).toMatch(/\$9/);
    expect(pitch).toMatch(/47%/);
  });
});

describe('coalition bundle (multi-designer, S030 path)', () => {
  const coalition = planBundle({
    patterns: [
      { name: 'My Cardi', mine: true, retailPrice: 10, soloWindowCopies: 20 },
      { name: "Anna's Shawl", mine: false, retailPrice: 8, soloWindowCopies: 25 },
      { name: "Priya's Beanie", mine: false, retailPrice: 6, soloWindowCopies: 30 },
    ],
    bundlePrice: 14,
    expectedUnits: 100,
    channelFeeRate: 0.15,
    splitMode: 'equal',
    designerCount: 3,
    hostFeeRate: 0,
  });

  it('splits the coalition net equally across 3 designers', () => {
    // net = 14 × 100 × 0.85 = 1190; /3 ≈ 396.67
    expect(coalition.myDesignerShare).toBeCloseTo(1190 / 3, 1);
    expect(coalition.units).toBe(100);
  });

  it('sums of parts across all three patterns including partners', () => {
    // 10+8+6 = 24; 14/24 ≈ 42% discount depth
    expect(coalition.sumOfParts).toBe(24);
    expect(coalition.discountDepth).toBeCloseTo(1 - 14 / 24, 3);
  });

  it('pitch text names all coalition designers', () => {
    const pitch = generateBundlePitch({
      patterns: [
        { name: 'My Cardi', mine: true, retailPrice: 10, soloWindowCopies: 20 },
        { name: "Anna's Shawl", mine: false, retailPrice: 8, soloWindowCopies: 25 },
        { name: "Priya's Beanie", mine: false, retailPrice: 6, soloWindowCopies: 30 },
      ],
      bundlePrice: 14,
      expectedUnits: 100,
      channelFeeRate: 0.15,
      splitMode: 'equal',
      designerCount: 3,
      hostFeeRate: 0,
    });
    // The pitch intentionally names only the HOST's patterns in the coalition;
    // partner pattern picks are collected when partners reply ("send me your
    // pattern picks"). Assert the coalition subject line instead.
    expect(pitch).toContain('Subject: Bundle collaboration — 2 designers, 3 patterns');
    expect(pitch).toContain('My patterns in: My Cardi.');
    expect(pitch).toContain('Send me your pattern picks');
  });
});
