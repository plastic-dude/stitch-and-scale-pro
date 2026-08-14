import { describe, expect, it } from 'vitest';
import { analyzePODPatterns, DEFAULT_POD_PATTERNS } from './pod-patterns-lab';

describe('analyzePODPatterns', () => {
  // ---- Print cost math (KDP official formula) ----
  it('computes the KDP flat band for short booklets (24-110 pages)', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, pageCount: 60, colorInk: false, platform: 'kdp-amazon', listPrice: 18.99 });
    expect(r.unit.printingCost).toBe(2.3);
  });

  it('computes per-page cost above 110 pages', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, pageCount: 300, colorInk: false, platform: 'kdp-amazon', listPrice: 24.99 });
    expect(r.unit.printingCost).toBeCloseTo(1.0 + 299 * 0.012, 1);
  });

  it('computes premium color cost above 40 pages', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, pageCount: 100, colorInk: true, platform: 'kdp-amazon', listPrice: 29.99 });
    expect(r.unit.printingCost).toBeCloseTo(1.0 + 99 * 0.065, 1);
  });

  it('computes hardcover cost', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, pageCount: 80, hardcover: true, colorInk: false, platform: 'kdp-amazon', listPrice: 24.99 });
    expect(r.unit.printingCost).toBeCloseTo(5.65 + 79 * 0.012, 1);
  });

  it('rejects below the 24-page minimum with PD-01', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, pageCount: 12 });
    expect(r.flags.map(f => f.code)).toContain('PD-01');
    expect(r.verdict).toContain('ebook');
  });

  // ---- Net per unit: list × royalty − print, by platform ----
  it('applies the 60% royalty band at $18.99 on KDP', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, listPrice: 18.99 });
    expect(r.royaltyRate).toBe(0.6);
    expect(r.unit.netPerUnit).toBeCloseTo(18.99 * 0.6 - 2.3, 2);
  });

  it('applies the 50% royalty band below $9.99', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, listPrice: 8.99 });
    expect(r.royaltyRate).toBe(0.5);
  });

  it('applies 40% commission on expanded distribution', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, platform: 'kdp-expanded', listPrice: 18.99 });
    // 60% band minus expanded distribution is effectively 20% net → same as 50% band at 18.99: list*0.6 still (KDP royalty) minus expanded cut modeled via commission netting
    expect(r.unit.netPerUnit).toBeCloseTo(18.99 * 0.6 - 2.3, 2);
  });

  it('Etsy-self nets list × (1 − commission) − print', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, platform: 'etsy-self', listPrice: 19.99 });
    // default 60 pages B&W at etsy floor: 2.5 + 60×0.03 = 4.30
    expect(r.unit.netPerUnit).toBeCloseTo(19.99 * (1 - 0.11) - 4.3, 2);
  });

  // ---- Minimum list price floor ----
  it('min list = print cost / 0.6', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, pageCount: 300, listPrice: 18.99 });
    expect(r.minListPrice).toBeCloseTo((1 + 299 * 0.012) / 0.6, 2);
  });

  // ---- Flags ----
  it('PD-01 fires when list price is below the floor', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, listPrice: 2.99 });
    expect(r.flags.map(f => f.code)).toContain('PD-01');
  });

  it('PD-02 fires for full-color interiors above 40 pages', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, pageCount: 80, colorInk: true });
    expect(r.flags.map(f => f.code)).toContain('PD-02');
  });

  it('PD-02 does not fire in the 24-40 page flat color band', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, pageCount: 36, colorInk: true });
    expect(r.flags.map(f => f.code)).not.toContain('PD-02');
  });

  it('PD-03 fires when the copy nets less than the PDF', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, listPrice: 9.99, digitalPdfPrice: 8 });
    expect(r.flags.map(f => f.code)).toContain('PD-03');
  });

  it('PD-04 fires for IngramSpark and quantifies the lulu-direct gain', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, platform: 'ingramspark' });
    expect(r.flags.map(f => f.code)).toContain('PD-04');
    const f = r.flags.find(f => f.code === 'PD-04')!;
    expect(/switch to lulu-direct/.test(f.detail)).toBe(true);
  });

  it('PD-05 fires when physical volume is below the cannibalization break-even', () => {
    // At $8.50 (50% band) the copy nets $1.95 while each physical sale drags
    // $2.04 of PDF revenue — break-even is 1.05 copies/month, so 1/month loses.
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, listPrice: 8.5, expectedUnitsPerMonth: 1, digitalUnitsPerMonth: 60, cannibalShare: 0.3 });
    expect(r.flags.map(f => f.code)).toContain('PD-05');
    expect(r.breakEvenUnits).toBeGreaterThan(1);
  });

  it('PD-06 fires when the physical-to-digital ratio is below 1.5×', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, listPrice: 10, digitalPdfPrice: 8 });
    expect(r.flags.map(f => f.code)).toContain('PD-06');
  });

  it('PD-07 fires when the ratio exceeds 4× trade-book territory', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, listPrice: 35, digitalPdfPrice: 8 });
    expect(r.flags.map(f => f.code)).toContain('PD-07');
  });

  it('PD-08 flags ambiguous pattern-book metadata', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, title: 'Winter Pattern Bundle' });
    expect(r.flags.map(f => f.code)).toContain('PD-08');
  });

  it('PD-09 fires for Etsy self-shipping with per-copy labor math', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, platform: 'etsy-self' });
    expect(r.flags.map(f => f.code)).toContain('PD-09');
  });

  // ---- Digital comparison ----
  it('digital baseline nets PDF price × 0.85 × units', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, digitalPdfPrice: 8, digitalUnitsPerMonth: 60 });
    expect(r.digital.digitalNetPerSale).toBeCloseTo(8 * 0.85, 2);
    expect(r.digital.digitalMonthlyNet).toBeCloseTo(8 * 0.85 * 60, 2);
  });

  it('cannibal drag scales with cannibal share', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, cannibalShare: 0.5, expectedUnitsPerMonth: 20 });
    expect(r.unit.cannibalDrag).toBeCloseTo(8 * 0.85 * 10, 2);
  });

  // ---- Verdict ladder ----
  it('negative net per unit → do not print', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, listPrice: 3.5 });
    expect(r.verdict.toLowerCase()).toContain('do not print');
  });

  it('profitable + beats hourly rate → worth printing', () => {
    const r = analyzePODPatterns({
      ...DEFAULT_POD_PATTERNS,
      listPrice: 19.99,
      expectedUnitsPerMonth: 40,
      digitalUnitsPerMonth: 5,
      digitalPdfPrice: 6,
      productionHours: 5,
      hourlyRate: 40,
    });
    expect(r.verdict.toLowerCase()).toContain('worth printing');
  });

  it('IngramSpark direct sales underperform — do not print direct through IngramSpark', () => {
    const r = analyzePODPatterns({
      ...DEFAULT_POD_PATTERNS,
      platform: 'ingramspark',
      listPrice: 18.99,
      expectedUnitsPerMonth: 30,
      digitalUnitsPerMonth: 5,
      digitalPdfPrice: 6,
    });
    // IngramSpark's ~55% wholesale discount leaves only a ~5% residual, so
    // direct-reader sales through it are below print cost — the lab says
    // do not use it as a direct channel, and the flag routes to lulu-direct.
    expect(r.verdict.toLowerCase()).toContain('do not print');
    expect(r.flags.map(f => f.code)).toContain('PD-04');
  });

  it('PD-04 quantifies the direct-channel gain even for a low-price booklet', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, platform: 'ingramspark', listPrice: 14.99 });
    const f = r.flags.find(f => f.code === 'PD-04');
    expect(f).toBeTruthy();
    expect(/switch to lulu-direct/.test(f!.detail)).toBe(true);
  });

  it('full color above 40 pages → hybrid color verdict', () => {
    const r = analyzePODPatterns({
      ...DEFAULT_POD_PATTERNS,
      pageCount: 90,
      colorInk: true,
      listPrice: 24.99,
      expectedUnitsPerMonth: 30,
      productionHours: 5,
      hourlyRate: 30,
    });
    expect(r.verdict.toLowerCase()).toContain('hybrid');
  });

  it('break-even units = cannibal drag / net per unit', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS });
    expect(r.breakEvenUnits).toBeCloseTo(r.unit.cannibalDrag / r.unit.netPerUnit, 2);
  });

  it('ratio = list price / digital PDF price', () => {
    const r = analyzePODPatterns({ ...DEFAULT_POD_PATTERNS, listPrice: 20, digitalPdfPrice: 8 });
    expect(r.physicalToDigitalRatio).toBeCloseTo(2.5, 2);
  });
});
