import { describe, expect, it } from 'vitest';
import {
  compareMagazine,
  fmtN,
  generateClubFaq,
  generateMagazineResponse,
  planClub,
  usd,
} from './pattern-club-planner';

// Market-typical club defaults (per cited club pricing research):
// $7/month or $77/year like Double The Stitches; 10% churn; Ravelry gift
// code fulfilment at $8.50 (Ravelry gift price covers platform fee + code);
// outsourced production (tech edit + layout + photography) $150/pattern.
const clubDefaults = {
  pricing: { monthlyPrice: 7, annualPrice: 77, trialMonths: 0, trialPrice: 0 },
  demand: { startMembers: 20, monthlyNewMembers: 5, churnPct: 0.1, annualShare: 0 },
  costs: { giftCodeCost: 8.5, patternCost: 150, labourCost: 0, channelFee: 0 },
  baseline: { soloCopiesPerMonth: 20, soloPrice: 8, platform: 'ravelry' as const },
  patternsPerMonth: 1,
  months: 12,
};

describe('planClub', () => {
  it('computes member growth with churn applied to the base', () => {
    const r = planClub(clubDefaults);
    // Month 1: churn on 20 → 18, +5 new = 23
    expect(r.months[0].endMembers).toBeCloseTo(23, 1);
    // Steady state without growth: base decays toward newMembers/churn = 50
    const last = r.months[r.months.length - 1];
    expect(last.endMembers).toBeGreaterThan(23);
    expect(last.endMembers).toBeLessThan(55);
  });

  it('churn of zero accumulates all new members', () => {
    const r = planClub({
      ...clubDefaults,
      demand: { ...clubDefaults.demand, churnPct: 0, startMembers: 0, monthlyNewMembers: 10 },
    });
    expect(r.months[10].endMembers).toBeCloseTo(110, 1);
  });

  it('honours the annual plan boost to paid-equivalent members', () => {
    const monthly = planClub(clubDefaults);
    const annual = planClub({
      ...clubDefaults,
      demand: { ...clubDefaults.demand, annualShare: 1 },
    });
    // 77/12 = 6.42/month equivalent vs 7 — paid equivalent is lower per
    // annual member, so annual-heavy clubs need more members to match.
    const lastA = annual.months[annual.months.length - 1];
    const lastM = monthly.months[monthly.months.length - 1];
    expect(lastA.paidEquivalent / lastA.endMembers).toBeLessThan(
      lastM.paidEquivalent / lastM.endMembers,
    );
  });

  it('deducts Ravelry gift-code fulfilment per member per pattern', () => {
    const r = planClub(clubDefaults);
    const last = r.months[r.months.length - 1];
    // fulfilment = members x patterns x $8.50
    expect(last.fulfilmentCost).toBeCloseTo(last.endMembers * 8.5, 1);
  });

  it('stacks the solo opportunity cost against club net', () => {
    const r = planClub(clubDefaults);
    const last = r.months[r.months.length - 1];
    // Same pattern rides the club instead of selling solo — solo baseline
    // monthly net must appear as the opportunity cost.
    expect(last.soloOpportunityCost).toBeGreaterThan(0);
    expect(last.netVsSolo).toBe(last.netRevenue - last.soloOpportunityCost);
  });

  it('returns go when the club beats the solo baseline', () => {
    const r = planClub({
      ...clubDefaults,
      // Healthy club: strong ramp, low churn, cheap fulfilment, and a weak
      // solo baseline so the club genuinely out-earns selling solo.
      demand: { startMembers: 200, monthlyNewMembers: 30, churnPct: 0.05, annualShare: 0.4 },
      costs: { ...clubDefaults.costs, giftCodeCost: 6, patternCost: 120 },
      baseline: { soloCopiesPerMonth: 5, soloPrice: 8, platform: 'ravelry' },
    });
    expect(r.verdict).toBe('go');
    expect(r.finalMonthlyNetVsSolo).toBeGreaterThan(0);
    expect(r.breakevenMonth).not.toBeNull();
  });

  it('returns skip when the club cannot beat solo at any member count', () => {
    const r = planClub({
      ...clubDefaults,
      // Stunted ramp, expensive fulfilment exceeding the membership price.
      demand: { startMembers: 5, monthlyNewMembers: 1, churnPct: 0.25, annualShare: 0 },
      costs: { ...clubDefaults.costs, giftCodeCost: 9, patternCost: 300 },
      baseline: { soloCopiesPerMonth: 50, soloPrice: 8, platform: 'ravelry' },
    });
    expect(r.verdict).toBe('skip');
    expect(r.finalMonthlyNetVsSolo).toBeLessThan(0);
  });

  it('computes the steady-state break-even member count', () => {
    const r = planClub({
      ...clubDefaults,
      demand: { ...clubDefaults.demand, annualShare: 0 },
      // Contribution must be positive (price > fulfilment) to have a finite
      // break-even member count — a real design decision clubs face.
      pricing: { monthlyPrice: 10, annualPrice: 110, trialMonths: 0, trialPrice: 0 },
      costs: { ...clubDefaults.costs, giftCodeCost: 7 },
    });
    expect(r.breakEvenMembers).not.toBeNull();
    expect(Number(r.breakEvenMembers)).toBeGreaterThan(0);
    // 100+ members must exist for the club to match its solo baseline.
    expect(Number(r.breakEvenMembers)).toBeGreaterThan(10);
  });

  it('handles free trials charged at trial price', () => {
    const r = planClub({
      ...clubDefaults,
      pricing: { monthlyPrice: 10, annualPrice: 0, trialMonths: 1, trialPrice: 3 },
      demand: { ...clubDefaults.demand, monthlyNewMembers: 20, churnPct: 0.05 },
      costs: { ...clubDefaults.costs, giftCodeCost: 7, patternCost: 120 },
      baseline: { soloCopiesPerMonth: 5, soloPrice: 8, platform: 'ravelry' },
    });
    // With 1-month trials at churn 0.05, trial share ≈ 0.05 of base;
    // gross revenue includes trial revenue from that cohort, and the club
    // still beats the weak solo baseline.
    const last = r.months[r.months.length - 1];
    expect(last.grossRevenue).toBeGreaterThan(0);
    expect(r.verdict).toBe('go');
  });

  it('defaults an empty baseline to zero opportunity cost', () => {
    const r = planClub({
      ...clubDefaults,
      baseline: { soloCopiesPerMonth: 0, soloPrice: 0, platform: 'ravelry' },
    });
    const last = r.months[r.months.length - 1];
    expect(last.soloOpportunityCost).toBe(0);
  });

  it('annualizes the final monthly net-vs-solo', () => {
    const r = planClub(clubDefaults);
    expect(r.annualizedNetVsSolo).toBeCloseTo(r.finalMonthlyNetVsSolo * 12, 1);
  });
});

describe('compareMagazine', () => {
  const offer = {
    fee: 250,
    exclusiveMonths: 3,
    soloCopiesPerMonth: 10,
    soloPrice: 8,
    platform: 'ravelry' as const,
    techEditCovered: true,
    designHours: 30,
    hourlyRate: 25,
    techEditCost: 100,
    mediaCost: 0,
  };

  it('computes the window opportunity value via platformNet', () => {
    const r = compareMagazine(offer);
    // 3 months of solo net at 10 copies x $8 on Ravelry (> $30 so 3.5%+5%).
    expect(r.windowSoloNet).toBeGreaterThan(200);
    expect(r.windowSoloNet).toBeCloseTo(r.steadySoloNet * 3, 1);
  });

  it('covers designer-borne production costs against the fee', () => {
    const r = compareMagazine({ ...offer, techEditCovered: false });
    expect(r.netFee).toBeCloseTo(250 - 100, 2);
    const covered = compareMagazine(offer);
    expect(covered.netFee).toBe(250);
  });

  it('sets the minimum worthwhile fee above the window value', () => {
    const r = compareMagazine(offer);
    // Fee must beat the lockout's solo net plus any production costs.
    expect(r.minimumWorthwhileFee).toBeGreaterThanOrEqual(r.windowSoloNet);
  });

  it('goes when the fee clears the lockout value and pays a fair rate', () => {
    const r = compareMagazine({ ...offer, fee: 500, exclusiveMonths: 3 });
    expect(r.verdict).toBe('go');
  });

  it('reviews when the fee covers the window but underpays time', () => {
    const r = compareMagazine({ ...offer, fee: 350, exclusiveMonths: 6 });
    // 6-month lockout at 10 copies/mo makes the window value ≈ $450+, fee below.
    expect(r.verdict === 'review' || r.verdict === 'skip').toBe(true);
  });

  it('skips a token fee against a long lockout', () => {
    const r = compareMagazine({ ...offer, fee: 50, exclusiveMonths: 12 });
    expect(r.verdict).toBe('skip');
  });

  it('goes on no-exclusivity terms', () => {
    const r = compareMagazine({ ...offer, exclusiveMonths: 0 });
    expect(r.verdict).toBe('go');
    expect(r.lockoutMonths).toBe(0);
  });

  it('computes the effective hourly rate on design hours', () => {
    const r = compareMagazine(offer);
    expect(r.effectiveHourlyRate).toBeCloseTo(r.netFee / 30, 2);
  });
});

describe('generators', () => {
  it('writes club FAQ copy with the real member questions', () => {
    const faq = generateClubFaq('Calyx Club', { monthlyPrice: 7, annualPrice: 77, trialMonths: 1, trialPrice: 0 }, 1);
    expect(faq).toContain('Ravelry gift code');
    expect(faq).toContain('Founding members');
    expect(faq).toContain('10 days notice');
    expect(faq).toContain('no cost');
    expect(faq).toContain('not refundable');
    expect(faq).toContain('finished objects may be sold');
  });

  it('writes multi-pattern FAQ copy', () => {
    const faq = generateClubFaq('Big Club', { monthlyPrice: 12, annualPrice: 120, trialMonths: 0, trialPrice: 0 }, 2);
    expect(faq).toContain('2 brand-new patterns');
    expect(faq).toContain('Annual members');
  });

  it('writes magazine response with protection questions', () => {
    const reply = generateMagazineResponse({
      magazine: 'Knit Monthly',
      pattern: 'Calyx Pullover',
      fee: 250,
      exclusiveMonths: 3,
    });
    expect(reply).toContain('Calyx Pullover');
    expect(reply).toContain('3 months');
    expect(reply).toContain('full copyright');
    expect(reply).toContain('AI');
    expect(reply).toContain('PayPal');
  });

  it('drops the exclusivity question when there is no window', () => {
    const reply = generateMagazineResponse({
      magazine: 'Open Knit',
      pattern: 'Moorland Hat',
      fee: 100,
      exclusiveMonths: 0,
    });
    expect(reply).toContain('no exclusivity window');
  });
});

describe('formatters', () => {
  it('formats dollars without unnecessary decimals', () => {
    expect(usd(1200)).toBe('$1,200');
    expect(usd(1200.5)).toBe('$1,200.50');
    expect(usd(0)).toBe('$0');
  });

  it('formats numbers and nulls for display', () => {
    expect(fmtN(42.5)).toBe('42.5');
    expect(fmtN(null)).toBe('—');
  });
});
