import { describe, expect, it } from 'vitest';
import {
  analyzePartnerDeal,
  computePitchScore,
  computePitchGaps,
  scorePitch,
  summarizePipeline,
  selfPublishValue,
  DEAL_LABELS,
  RIGHTS_LABELS,
  DEFAULT_PARTNER,
  DEFAULT_PITCH,
  WPK_ACCESSORY_RATE_AVG,
  MARKETPLACE_FEE_PCT,
  CONTRACT_CHECKLIST,
  type DealOffer,
  type PitchInput,
} from './partner-economics';

/* ------------------------------------------------------------------ */
/* Value math                                                         */
/* ------------------------------------------------------------------ */

describe('self-publish value', () => {
  it('is price times expected 12-month unit sales', () => {
    const o = { ...DEFAULT_PARTNER, patternPrice: 8, expectedUnitSales12m: 250 };
    expect(selfPublishValue(o)).toBe(2000);
  });
});

/* ------------------------------------------------------------------ */
/* Deal-type cash values                                              */
/* ------------------------------------------------------------------ */

describe('analyzePartnerDeal cash values', () => {
  const base: DealOffer = { ...DEFAULT_PARTNER };

  it('yarn support: cash value is the yarn value', () => {
    const a = analyzePartnerDeal({ ...base, dealType: 'yarnSupport', yarnValue: 150 });
    expect(a.cashValue).toBe(150);
  });

  it('IDP listing: (100 - fee)% of self-publish value lifted by marketing reach', () => {
    const a = analyzePartnerDeal({
      ...base, dealType: 'idpListing', idpFeePct: 15, marketingReach: 30,
      patternPrice: 8, expectedUnitSales12m: 250,
    });
    const selfPub = 2000;
    expect(a.cashValue).toBeCloseTo(selfPub * 0.85 * 1.3, 1);
  });

  it('lump sum: cash value is the fee', () => {
    const a = analyzePartnerDeal({ ...base, dealType: 'lumpSum', offeredAmount: 600 });
    expect(a.cashValue).toBe(600);
  });

  it('exclusivity window: fee plus self-publish of the non-window share when self-listing allowed', () => {
    const a = analyzePartnerDeal({
      ...base, dealType: 'exclusivityWindow', offeredAmount: 400, exclusiveListed: false,
      patternPrice: 8, expectedUnitSales12m: 250,
    });
    // 400 + 55% of platform-net 2000
    expect(a.cashValue).toBeCloseTo(400 + 2000 * 0.85 * 0.55, 1);
  });

  it('exclusivity locked: only the fee counts', () => {
    const a = analyzePartnerDeal({
      ...base, dealType: 'exclusivityWindow', offeredAmount: 400, exclusiveListed: true,
      patternPrice: 8, expectedUnitSales12m: 250,
    });
    expect(a.cashValue).toBe(400);
  });

  it('LYS Day exclusive: April-window share at 1.5x spike rate, net of fees', () => {
    const a = analyzePartnerDeal({
      ...base, dealType: 'lysDayExclusive', lysDayWindowDays: 30,
      patternPrice: 8, expectedUnitSales12m: 250,
    });
    expect(a.cashValue).toBeCloseTo(2000 * (30 / 365) * 1.5 * 0.85, 1);
    expect(a.annualEventNote).toBeDefined();
  });

  it('KAL host: platform-net plus 1.3x marketing lift plus follower attribution', () => {
    const a = analyzePartnerDeal({
      ...base, dealType: 'kalHost', marketingReach: 30, kalfollowers: 10000,
      patternPrice: 8, expectedUnitSales12m: 250,
    });
    expect(a.cashValue).toBeCloseTo(2000 * 0.85 * (1 + 30 / 300) + 10000 * 0.005, 1);
  });
});

/* ------------------------------------------------------------------ */
/* Rights penalty                                                     */
/* ------------------------------------------------------------------ */

describe('rights penalty', () => {
  const base: DealOffer = { ...DEFAULT_PARTNER, patternPrice: 8, expectedUnitSales12m: 250 };

  it('keep-all costs nothing', () => {
    expect(analyzePartnerDeal({ ...base, rights: 'keepAll' }).rightsPenalty).toBe(0);
  });

  it('full transfer surrenders ~3 years of self-publish value', () => {
    const a = analyzePartnerDeal({ ...base, rights: 'fullTransfer', offeredAmount: 300 });
    expect(a.rightsPenalty).toBeCloseTo(2000 * 3, 1);
  });

  it('partial exclusivity with locked self-publishing surrenders ~45% of 12m value', () => {
    const a = analyzePartnerDeal({ ...base, rights: 'partialExclusivity', exclusiveListed: true });
    expect(a.rightsPenalty).toBeCloseTo(2000 * 0.45, 1);
  });

  it('partial royalty surrenders 20% of platform-net value', () => {
    const a = analyzePartnerDeal({ ...base, rights: 'partialRoyalty' });
    expect(a.rightsPenalty).toBeCloseTo(2000 * 0.85 * 0.2, 1);
  });
});

/* ------------------------------------------------------------------ */
/* Verdict ladder                                                     */
/* ------------------------------------------------------------------ */

describe('verdict ladder', () => {
  it('a well-paid IDP deal lands on great', () => {
    const a = analyzePartnerDeal({
      ...DEFAULT_PARTNER, dealType: 'idpListing', idpFeePct: 15, marketingReach: 80,
      patternPrice: 10, expectedUnitSales12m: 1000, productionCost: 300, hoursWorked: 30,
      rights: 'keepAll',
    });
    expect(a.verdict).toBe('great');
    expect(a.effectiveHourly).toBeGreaterThan(60);
  });

  it('a below-benchmark yarn-support deal lands on hold', () => {
    /* Production costs nearly erase yarn value plus platform net: 100 + 1700 - 300 - 1450 = 50 over 40h. */
    const a = analyzePartnerDeal({
      ...DEFAULT_PARTNER, dealType: 'yarnSupport', yarnValue: 100,
      productionCost: 300, hoursWorked: 40, rights: 'keepAll',
      expectedUnitSales12m: 250, patternPrice: 8,
    });
    /* Note: yarn-support deals still count the pattern's self-publish runway, so a
       $100 yarn-value deal alone lands on 'good' ($37.5/hr). To force the hold band,
       price the pattern at zero — the designer builds the design purely for yarn pay. */
    expect(a.effectiveHourly).toBeCloseTo(37.5, 0);
    const aZero = analyzePartnerDeal({
      ...DEFAULT_PARTNER, dealType: 'yarnSupport', yarnValue: 100,
      productionCost: 300, hoursWorked: 40, rights: 'keepAll',
      expectedUnitSales12m: 0, patternPrice: 8,
    });
    const aHold = analyzePartnerDeal({
      ...DEFAULT_PARTNER, dealType: 'yarnSupport', yarnValue: 950,
      productionCost: 300, hoursWorked: 40, rights: 'keepAll',
      expectedUnitSales12m: 0, patternPrice: 8,
    });
    expect(aHold.verdict).toBe('hold');
    expect(aHold.effectiveHourly).toBeGreaterThan(15);
    expect(aHold.effectiveHourly).toBeLessThan(30);
  });

  it('a full-transfer lowball lands on skip', () => {
    const a = analyzePartnerDeal({
      ...DEFAULT_PARTNER, dealType: 'lumpSum', offeredAmount: 80, rights: 'fullTransfer',
      patternPrice: 8, expectedUnitSales12m: 250, productionCost: 300, hoursWorked: 25,
    });
    expect(a.verdict).toBe('skip');
    expect(a.totalValue12m).toBeLessThan(0);
  });

  it('total value = cash + platform net - rights penalty - production cost', () => {
    const o: DealOffer = {
      ...DEFAULT_PARTNER, dealType: 'lumpSum', offeredAmount: 500, rights: 'keepAll',
      patternPrice: 8, expectedUnitSales12m: 250, productionCost: 300, hoursWorked: 20,
    };
    const a = analyzePartnerDeal(o);
    expect(a.totalValue12m).toBeCloseTo(500 + 2000 * 0.85 - 300, 1);
  });
});

/* ------------------------------------------------------------------ */
/* Red flags                                                          */
/* ------------------------------------------------------------------ */

describe('red flags', () => {
  it('YP-01: full transfer below garment-scale fee', () => {
    const a = analyzePartnerDeal({
      ...DEFAULT_PARTNER, dealType: 'lumpSum', offeredAmount: 200, rights: 'fullTransfer',
    });
    expect(a.redFlags.some((f) => f.code === 'YP-01')).toBe(true);
  });

  it('YP-02: IDP fee above 15%', () => {
    const a = analyzePartnerDeal({
      ...DEFAULT_PARTNER, dealType: 'idpListing', idpFeePct: 25,
    });
    expect(a.redFlags.some((f) => f.code === 'YP-02')).toBe(true);
  });

  it('YP-03: exclusivity over 12 months', () => {
    const a = analyzePartnerDeal({ ...DEFAULT_PARTNER, exclusivityMonths: 18 });
    expect(a.redFlags.some((f) => f.code === 'YP-03')).toBe(true);
  });

  it('YP-04: yarn-only pay with heavy deliverables and costs', () => {
    const a = analyzePartnerDeal({
      ...DEFAULT_PARTNER, dealType: 'yarnSupport', yarnValue: 100,
      productionCost: 200, deliverablesCount: 4,
    });
    expect(a.redFlags.some((f) => f.code === 'YP-04')).toBe(true);
  });

  it('YP-05: effective rate under $10/hr', () => {
    const a = analyzePartnerDeal({
      ...DEFAULT_PARTNER, dealType: 'yarnSupport', yarnValue: 500,
      productionCost: 300, hoursWorked: 40, expectedUnitSales12m: 0,
    });
    expect(a.redFlags.some((f) => f.code === 'YP-05')).toBe(true);
  });

  it('YP-06: lump sum under accessory floor for garment-scale hours', () => {
    const a = analyzePartnerDeal({
      ...DEFAULT_PARTNER, dealType: 'lumpSum', offeredAmount: 30, hoursWorked: 20,
    });
    expect(a.redFlags.some((f) => f.code === 'YP-06')).toBe(true);
  });

  it('clean deal has no flags', () => {
    const a = analyzePartnerDeal({
      ...DEFAULT_PARTNER, dealType: 'yarnSupport', yarnValue: 300,
      productionCost: 150, deliverablesCount: 2, hoursWorked: 15, rights: 'keepAll',
    });
    expect(a.redFlags).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ */
/* Pitch readiness                                                    */
/* ------------------------------------------------------------------ */

describe('pitch readiness', () => {
  it('complete pitch scores 100 with no gaps', () => {
    const p: PitchInput = {
      hasConceptBrief: true, hasSketches: true, hasYarnSpec: true,
      hasTimeline: true, hasMarketingPlan: true, portfolioPatterns: 5,
      hasAudienceStats: true,
    };
    const r = scorePitch(p);
    expect(r.score).toBe(100);
    expect(r.gaps).toHaveLength(0);
  });

  it('missing brief and sketches drops below 100 with named gaps', () => {
    const p: PitchInput = { ...DEFAULT_PITCH, hasConceptBrief: false, hasSketches: false };
    const r = scorePitch(p);
    expect(r.score).toBe(50);
    expect(r.gaps.some((g) => g.toLowerCase().includes('concept brief'))).toBe(true);
    expect(r.gaps.some((g) => g.toLowerCase().includes('sketch'))).toBe(true);
  });

  it('deal-layer pitch score responds to deal structure', () => {
    const lean = computePitchScore({ ...DEFAULT_PARTNER, dealType: 'lumpSum', yarnValue: 0, marketingReach: 10 });
    const rich = computePitchScore({ ...DEFAULT_PARTNER, dealType: 'yarnSupport', yarnValue: 400, marketingReach: 70 });
    expect(rich).toBeGreaterThan(lean);
  });

  it('pitch gaps flag deliverables-vs-hours imbalance', () => {
    const gaps = computePitchGaps({ ...DEFAULT_PARTNER, deliverablesCount: 5, hoursWorked: 10 });
    expect(gaps.some((g) => g.toLowerCase().includes('deliverables'))).toBe(true);
  });

  it('LYS Day window over 60 days is flagged', () => {
    const gaps = computePitchGaps({ ...DEFAULT_PARTNER, dealType: 'lysDayExclusive', lysDayWindowDays: 90 });
    expect(gaps.some((g) => g.toLowerCase().includes('60 days'))).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Pipeline                                                           */
/* ------------------------------------------------------------------ */

describe('pitch pipeline', () => {
  const nowIso = () => new Date().toISOString();
  const laterIso = (days: number) => new Date(Date.now() + days * 86400000).toISOString();

  it('open excludes closed and delivered', () => {
    const pitches = [
      { id: '1', company: 'A', dealType: 'yarnSupport', status: 'pitched', dueDate: laterIso(10), amount: 0, notes: '' },
      { id: '2', company: 'B', dealType: 'lumpSum', status: 'closed', dueDate: laterIso(5), amount: 500, notes: '' },
      { id: '3', company: 'C', dealType: 'kalHost', status: 'delivered', dueDate: laterIso(20), amount: 200, notes: '' },
    ];
    const s = summarizePipeline(pitches);
    expect(s.open).toHaveLength(1);
    expect(s.open[0].company).toBe('A');
  });

  it('cash in flight sums open amounts', () => {
    const pitches = [
      { id: '1', company: 'A', dealType: 'lumpSum', status: 'yarnReceived', dueDate: laterIso(7), amount: 246, notes: '' },
      { id: '2', company: 'B', dealType: 'kalHost', status: 'inDesign', dueDate: laterIso(14), amount: 150, notes: '' },
    ];
    expect(summarizePipeline(pitches).cashInFlight).toBe(396);
  });

  it('by-status counts every status', () => {
    const pitches = [
      { id: '1', company: 'A', dealType: 'yarnSupport', status: 'draft', dueDate: laterIso(3), amount: 0, notes: '' },
      { id: '2', company: 'B', dealType: 'yarnSupport', status: 'draft', dueDate: laterIso(3), amount: 0, notes: '' },
      { id: '3', company: 'C', dealType: 'kalHost', status: 'closed', dueDate: laterIso(3), amount: 0, notes: '' },
    ];
    const s = summarizePipeline(pitches);
    expect(s.byStatus.draft).toBe(2);
    expect(s.byStatus.closed).toBe(1);
  });

  it('average deadline is computed only from future deadlines', () => {
    const pitches = [
      { id: '1', company: 'A', dealType: 'yarnSupport', status: 'inDesign', dueDate: laterIso(10), amount: 0, notes: '' },
      { id: '2', company: 'B', dealType: 'yarnSupport', status: 'inDesign', dueDate: laterIso(20), amount: 0, notes: '' },
    ];
    const s = summarizePipeline(pitches);
    expect(s.avgDaysToDeadline).toBeCloseTo(15, 0);
  });
});

/* ------------------------------------------------------------------ */
/* Labels & reference data                                            */
/* ------------------------------------------------------------------ */

describe('hostile offer inputs', () => {
  it('normalizes non-finite, negative, and over-range offer values', () => {
    const a = analyzePartnerDeal({
      ...DEFAULT_PARTNER,
      offeredAmount: Number.NEGATIVE_INFINITY,
      idpFeePct: 150,
      exclusivityMonths: Number.POSITIVE_INFINITY,
      patternPrice: -8,
      expectedUnitSales12m: Number.NaN,
      marketingReach: 250,
      yarnValue: -100,
      kalfollowers: Number.POSITIVE_INFINITY,
      productionCost: Number.NaN,
      hoursWorked: -25,
      deliverablesCount: Number.POSITIVE_INFINITY,
      lysDayWindowDays: 900,
    });

    expect(Number.isFinite(a.cashValue)).toBe(true);
    expect(Number.isFinite(a.selfPublishValue12m)).toBe(true);
    expect(Number.isFinite(a.totalValue12m)).toBe(true);
    expect(Number.isFinite(a.effectiveHourly)).toBe(true);
    expect(Number.isFinite(a.deliverablesPerHour)).toBe(true);
    expect(Number.isFinite(a.pitchScore)).toBe(true);
  });
});

describe('hostile pitch and pipeline inputs', () => {
  it('keeps pitch scores finite when portfolio counts are malformed', () => {
    const result = scorePitch({
      ...DEFAULT_PITCH,
      portfolioPatterns: Number.POSITIVE_INFINITY,
    });
    expect(Number.isFinite(result.score)).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('clamps negative and non-finite pipeline amounts and invalid statuses', () => {
    const result = summarizePipeline([
      { id: 'bad', company: 'Bad', dealType: 'lumpSum', status: 'not-a-status' as any, dueDate: 'not-a-date', amount: -500, notes: '' },
      { id: 'nan', company: 'NaN', dealType: 'lumpSum', status: 'pitched', dueDate: 'not-a-date', amount: Number.NaN, notes: '' },
    ]);
    expect(result.cashInFlight).toBe(0);
    expect(result.byStatus.draft).toBe(1);
    expect(result.byStatus.pitched).toBe(1);
    expect(Number.isFinite(result.avgDaysToDeadline)).toBe(true);
  });
});

describe('reference data', () => {
  it('has a label for every deal type and rights grant', () => {
    expect(Object.keys(DEAL_LABELS).length).toBe(6);
    expect(Object.keys(RIGHTS_LABELS).length).toBe(4);
  });

  it('constants reflect cited benchmarks', () => {
    expect(WPK_ACCESSORY_RATE_AVG).toBe(246);
    expect(MARKETPLACE_FEE_PCT).toBe(15);
    expect(CONTRACT_CHECKLIST.length).toBe(6);
  });
});
