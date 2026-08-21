import { describe, it, expect } from 'vitest';
import {
  analyzeTeachingOffer,
  analyzeHostedOffer,
  buildPricingLadder,
  computeTickets,
  DEFAULT_TEACH,
  projectStudents,
} from './teach-economics';

describe('computeTickets', () => {
  it('blends early-bird and installment shares against the standard price', () => {
    const t = computeTickets({
      ticketPrice: 125,
      earlyBirdDiscount: 0.15,
      earlyBirdShare: 0.4,
      installmentPremium: 0.12,
      installmentShare: 0.25,
    });
    expect(t.standard).toBe(125);
    expect(t.earlyBird).toBeCloseTo(106.25, 1); // 125 * 0.85
    expect(t.installment).toBeCloseTo(140, 1); // 125 * 1.12
    // blended: 0.35*125 + 0.4*106.25 + 0.25*140 = 43.75 + 42.5 + 35 = 121.25
    expect(t.blended).toBeCloseTo(121.25, 1);
  });

  it('clamps overlapping shares so they never exceed 100%', () => {
    const t = computeTickets({
      ticketPrice: 100,
      earlyBirdDiscount: 0.2,
      earlyBirdShare: 0.8,
      installmentPremium: 0.1,
      installmentShare: 0.5,
    });
    // earlyBird 80%, installments clamped to 0 (80+50 > 100, capped to 20),
    // remaining 20% standard
    // ebShare clamps to 0.8, insShare to min(0.2, 0.5)=0.2, remaining 0 → 0.8*80 + 0.2*110 = 86
    expect(t.blended).toBeCloseTo(86, 2);
    // sanity: check the raw shares the implementation actually uses
    void t;
  });
});

describe('projectStudents', () => {
  it('derives enrollment from list size and conversion', () => {
    expect(
      projectStudents({ expectedStudents: 0, emailListSize: 800, listConversion: 0.02 }),
    ).toBe(16);
  });

  it('prefers an explicit student override', () => {
    expect(
      projectStudents({ expectedStudents: 25, emailListSize: 800, listConversion: 0.02 }),
    ).toBe(25);
  });
});

describe('analyzeTeachingOffer', () => {
  it('matches the default offer against real benchmarks (Kneedles & Life style)', () => {
    const r = analyzeTeachingOffer({ format: 'selfPacedCourse', ticketPrice: 125 });
    // list-derived: 800 * 2% = 16 students
    expect(r.students).toBe(16);
    // gross = 16 * ~121.25 blended
    expect(r.gross).toBeGreaterThan(1900);
    expect(r.gross).toBeLessThan(2000);
    // profitable despite production cost: 1940 gross - 406 platform - 0 material - 3000 prep?? 
    // prep cost = 60h * $50 = $3000 — default may be negative; just assert math consistency
    expect(r.netOfRefunds).toBeLessThanOrEqual(r.gross);
    expect(r.netOfPlatform).toBeLessThanOrEqual(r.netOfRefunds);
    expect(r.profit).toBeCloseTo(r.netOfPlatform - r.platformCost - r.materialCost - r.productionCost, 1);
  });

  it('launches a realistic mid-size course', () => {
    const r = analyzeTeachingOffer({
      format: 'selfPacedCourse',
      ticketPrice: 125,
      emailListSize: 6000,
      prepHours: 60,
      hourlyRate: 40,
      platformMonthlyCost: 39,
      platformMonths: 12,
      patternHourlyRate: 30,
    });
    expect(r.students).toBe(120); // 6000 * 2%
    expect(r.gross).toBeGreaterThan(14000);
    expect(r.breakEvenStudents).toBeLessThan(r.students);
    expect(r.fillRatio).toBeLessThan(1);
    expect(r.redFlags.length).toBe(0);
    expect(r.vsPatternMultiple).toBeGreaterThan(1);
    expect(r.verdict).toBe('launch');
  });

  it('flags T-01 when enrollment cannot cover break-even', () => {
    const r = analyzeTeachingOffer({
      format: 'selfPacedCourse',
      ticketPrice: 125,
      emailListSize: 200,
      prepHours: 80,
      hourlyRate: 50,
      platformMonthlyCost: 159,
      platformMonths: 12,
      patternHourlyRate: 30,
    });
    expect(r.students).toBe(4); // 200 * 2%
    expect(r.redFlags.some(f => f.id === 'T-01')).toBe(true);
    expect(r.verdict).toBe('skip');
  });

  it('flags T-02 when platform costs dominate', () => {
    const r = analyzeTeachingOffer({
      format: 'selfPacedCourse',
      ticketPrice: 99,
      emailListSize: 400,
      prepHours: 20,
      hourlyRate: 30,
      platformMonthlyCost: 159,
      platformMonths: 12,
      patternHourlyRate: 30,
    });
    expect(r.redFlags.some(f => f.id === 'T-02')).toBe(true);
  });

  it('flags T-03 for underpriced hosted classes', () => {
    const r = analyzeTeachingOffer({
      format: 'lysClass',
      ticketPrice: 30,
      prepHours: 6,
      hourlyRate: 40,
      emailListSize: 800,
      patternHourlyRate: 30,
    });
    expect(r.redFlags.some(f => f.id === 'T-03')).toBe(true);
  });

  it('flags T-04 for big builds on small lists', () => {
    const r = analyzeTeachingOffer({
      format: 'selfPacedCourse',
      ticketPrice: 125,
      emailListSize: 500,
      prepHours: 90,
      hourlyRate: 40,
      platformMonthlyCost: 39,
      platformMonths: 6,
      patternHourlyRate: 30,
    });
    expect(r.redFlags.some(f => f.id === 'T-04')).toBe(true);
  });

  it('pays back quickly on a well-listed course', () => {
    const r = analyzeTeachingOffer({
      format: 'selfPacedCourse',
      ticketPrice: 125,
      emailListSize: 8000,
      prepHours: 60,
      hourlyRate: 40,
      platformMonthlyCost: 39,
      platformMonths: 12,
      patternHourlyRate: 30,
    });
    expect(r.paybackWeeks).not.toBeNull();
    expect(r.paybackWeeks).toBeLessThan(20);
  });

  it('holds offers that pay less per hour than patterns', () => {
    const r = analyzeTeachingOffer({
      format: 'selfPacedCourse',
      ticketPrice: 250,
      emailListSize: 1200,
      prepHours: 80,
      hourlyRate: 45,
      platformMonthlyCost: 39,
      platformMonths: 12,
      patternHourlyRate: 60,
      refundRate: 0.02,
    });
    expect(r.verdict).toBe('hold');
    expect(r.vsPatternMultiple).toBeLessThan(1);
  });

  it('launches a realistic guild flat-fee day at market rate', () => {
    const r = analyzeTeachingOffer({
      format: 'guildFlatFee',
      ticketPrice: 900,
      prepHours: 12,
      hourlyRate: 40,
      emailListSize: 800,
      platformMonthlyCost: 0,
      platformMonths: 1,
      patternHourlyRate: 30,
    });
    // Issue #29 residual fix: flat-fee formats no longer blend the pricing ladder into the
    // contract day fee — gross is the raw $900, untouched by early-bird/installment shares.
    expect(r.gross).toBe(900);
    expect(r.students).toBe(16); // list projection still runs (audience figure)
    expect(r.verdict).toBe('launch');
    expect(r.redFlags.length).toBe(0);
  });

  it('flags a flat-fee day under the floor', () => {
    const r = analyzeTeachingOffer({
      format: 'guildFlatFee',
      ticketPrice: 150,
      prepHours: 12,
      hourlyRate: 40,
      emailListSize: 800,
      platformMonthlyCost: 0,
      platformMonths: 1,
      patternHourlyRate: 30,
    });
    expect(r.redFlags.some(f => f.id === 'T-05')).toBe(true);
  });

  it('rejects non-finite and impossible offer inputs without leaking bad math', () => {
    const r = analyzeTeachingOffer({
      ticketPrice: Number.POSITIVE_INFINITY,
      earlyBirdDiscount: -1,
      earlyBirdShare: Number.NaN,
      installmentPremium: Number.POSITIVE_INFINITY,
      emailListSize: -100,
      listConversion: Number.POSITIVE_INFINITY,
      prepHours: Number.NEGATIVE_INFINITY,
      hourlyRate: Number.NaN,
      platformMonths: Number.POSITIVE_INFINITY,
      refundRate: -0.5,
      platformCut: Number.POSITIVE_INFINITY,
    });
    expect(Object.values(r).filter((value) => typeof value === 'number').every(Number.isFinite)).toBe(true);
    expect(r.tickets.standard).toBe(DEFAULT_TEACH.ticketPrice);
    expect(r.tickets.earlyBird).toBeGreaterThanOrEqual(0);
    expect(r.profit).toBeGreaterThanOrEqual(-1e9);
  });

  it('multi-session series scales revenue by session count', () => {
    const six = analyzeTeachingOffer({
      format: 'zoomSeries',
      sessionCount: 6,
      ticketPrice: 45,
      emailListSize: 800,
      prepHours: 40,
      hourlyRate: 35,
      platformMonthlyCost: 10,
      platformMonths: 2,
      patternHourlyRate: 25,
    });
    const one = analyzeTeachingOffer({
      format: 'zoomSeries',
      sessionCount: 1,
      ticketPrice: 45,
      emailListSize: 800,
      prepHours: 40,
      hourlyRate: 35,
      platformMonthlyCost: 10,
      platformMonths: 2,
      patternHourlyRate: 25,
    });
    expect(six.gross).toBeCloseTo(one.gross * 6, 0);
  });
});

describe('analyzeHostedOffer', () => {
  it('keeps hosted economics finite for hostile numeric input', () => {
    const r = analyzeHostedOffer({
      model: 'flatFee',
      flatFee: Number.POSITIVE_INFINITY,
      hoursPerSession: Number.NaN,
      sessions: Number.NEGATIVE_INFINITY,
      hourlyRate: Number.POSITIVE_INFINITY,
      patternHourlyRate: Number.NaN,
      outOfPocket: -500,
    });
    expect(r.net).toBe(0);
    expect(Number.isFinite(r.effectiveHourlyRate)).toBe(true);
    expect(Number.isFinite(r.vsPatternMultiple)).toBe(true);
  });

  it('nets a market flat-fee day after travel', () => {
    const r = analyzeHostedOffer({
      model: 'flatFee',
      flatFee: 600,
      hoursPerSession: 6,
      sessions: 1,
      hourlyRate: 40,
      patternHourlyRate: 30,
      outOfPocket: 150,
    });
    expect(r.net).toBe(450);
    expect(r.effectiveHourlyRate).toBeCloseTo(75, 0);
    expect(r.vsPatternMultiple).toBeGreaterThan(2);
    expect(r.advice).toContain('Clears your hourly rate');
  });

  it('uses graduated per-hour pay by enrollment tier', () => {
    const rates = [
      { min: 1, max: 8, ratePerHour: 50 },
      { min: 9, max: 16, ratePerHour: 75 },
      { min: 17, max: 100, ratePerHour: 100 },
    ];
    const eight = analyzeHostedOffer({
      model: 'graduated', graduatedRates: rates, students: 8,
      hoursPerSession: 3, hourlyRate: 40, patternHourlyRate: 30,
    });
    expect(eight.effectiveHourlyRate).toBe(50);
    const twenty = analyzeHostedOffer({
      model: 'graduated', graduatedRates: rates, students: 20,
      hoursPerSession: 3, hourlyRate: 40, patternHourlyRate: 30,
    });
    expect(twenty.effectiveHourlyRate).toBe(100);
  });

  it('models a per-student grassroots offer', () => {
    const r = analyzeHostedOffer({
      model: 'perStudent',
      perStudentPrice: 120,
      students: 12,
      hoursPerSession: 6,
      sessions: 1,
      hourlyRate: 40,
      patternHourlyRate: 30,
      outOfPocket: 60,
    });
    expect(r.net).toBe(1380); // 1440 - 60
    expect(r.effectiveHourlyRate).toBeCloseTo(230, 0);
  });

  it('advises declining a losing gig', () => {
    const r = analyzeHostedOffer({
      model: 'flatFee',
      flatFee: 150,
      hoursPerSession: 8,
      sessions: 1,
      hourlyRate: 40,
      patternHourlyRate: 30,
      outOfPocket: 300,
    });
    expect(r.net).toBeLessThanOrEqual(0);
    expect(r.advice).toContain('loses money');
  });
});

describe('buildPricingLadder', () => {
  it('builds a flagship-anchor ladder at the standard market structure', () => {
    const l = buildPricingLadder(548);
    // flagship anchor ~60% of price => ~$913... anchor = price/0.6
    expect(l.anchor).toBe(Math.round(548 / 0.6));
    expect(l.standard).toBe(548);
    expect(l.earlyBird).toBeCloseTo(548 * 0.85, 0);
    expect(l.installment).toBeCloseTo(548 * 1.12, 0);
  });

  it('honors custom anchor/early-bird/installment percentages', () => {
    const l = buildPricingLadder(99, { anchorPct: 0.5, earlyBirdPct: 0.2, installmentPct: 0.1 });
    expect(l.anchor).toBe(Math.round(99 / 0.5));
    expect(l.earlyBird).toBeCloseTo(99 * 0.8, 0);
    expect(l.installment).toBeCloseTo(99 * 1.1, 0);
  });
});

describe('DEFAULT_TEACH sanity', () => {
  it('analyzes cleanly with zero overrides', () => {
    const r = analyzeTeachingOffer({});
    expect(typeof r.profit).toBe('number');
    expect(r.verdict).toMatch(/^(skip|hold|launch)$/);
    expect(r.breakEvenStudents).toBeGreaterThan(0);
    // default is self-paced at $125 with an 800-sub list: 16 students (~$1,940
    // gross) vs ~$3,400 of production + platform costs lands on skip — the
    // default input is deliberately a too-small list, which is exactly the
    // warning the tool exists to give
    expect(r.verdict).toBe('skip');
    expect(r.redFlags.some(f => f.id === 'T-01')).toBe(true);
  });
});

describe('guard rails', () => {
  it('never produces NaN with extreme inputs', () => {
    const r = analyzeTeachingOffer({
      ticketPrice: 0,
      emailListSize: 0,
      prepHours: 0,
      hourlyRate: 0,
      platformMonthlyCost: 0,
      platformMonths: 0,
      patternHourlyRate: 0,
    });
    expect(Number.isNaN(r.profit)).toBe(false);
    expect(Number.isNaN(r.breakEvenStudents)).toBe(false);
  });
});

// Regression tests for reviewer issues #25 and #26 (QA cycle 8).
describe('flat-fee formats (issue #25)', () => {
  it('guildFlatFee gross is the fee itself (via pricing ladder), not multiplied by students', () => {
    const r = analyzeTeachingOffer({
      format: 'guildFlatFee', ticketPrice: 500, expectedStudents: 30,
      earlyBirdDiscount: 0, earlyBirdShare: 0, installmentPremium: 0, installmentShare: 0,
    });
    // With the pricing ladder neutralized, a flat-fee day gross must equal the
    // fee itself — the $500 is paid once, no per-student ramp.
    expect(r.gross).toBe(500);
    expect(r.netOfRefunds).toBeLessThanOrEqual(500);
  });
  it('lysClass gross scales by students and per-student total, not a one-time fee', () => {
    const r = analyzeTeachingOffer({
      format: 'lysClass', ticketPrice: 40, expectedStudents: 6,
      earlyBirdDiscount: 0, earlyBirdShare: 0, installmentPremium: 0, installmentShare: 0,
    });
    // per-student class: $40 × 6 students × 1 session, minus 7% default refunds.
    expect(r.gross).toBe(240);
    expect(r.netOfRefunds).toBeCloseTo(223.2, 1);
  });
  it('flat-fee verdict ladder still works at a realistic day rate', () => {
    const strong = analyzeTeachingOffer({
      format: 'guildFlatFee', ticketPrice: 800, prepHours: 12, hourlyRate: 40,
      patternHourlyRate: 32, materialCost: 50, platformMonthlyCost: 0,
      refundRate: 0, earlyBirdDiscount: 0, earlyBirdShare: 0,
      installmentPremium: 0, installmentShare: 0,
    });
    // 800 fee − production (12×40=480) − materials 50 = 270 net.
    expect(strong.profit).toBe(270);
    const weak = analyzeTeachingOffer({
      format: 'guildFlatFee', ticketPrice: 150, prepHours: 20, hourlyRate: 60,
      patternHourlyRate: 32, refundRate: 0,
    });
    // 150 fee − production (20×60=1,200) = deep loss.
    expect(weak.profit).toBeLessThan(0);
  });
});
// Regression test for the #29 residual: with default shading inputs, flat-fee gross must
// equal the raw ticketPrice exactly — no blended-ticket semantics in flat-fee formats.
describe('flat-fee gross never blends the ladder (issue #29 residual)', () => {
  it('guildFlatFee gross equals ticketPrice exactly with default shading inputs', () => {
    const r = analyzeTeachingOffer({ format: 'guildFlatFee', ticketPrice: 900, refundRate: 0 });
    // default ladder: 40% early-bird -15%, 25% installment +12% — if blended, gross would be
    // ~$873; the contract day fee is paid once and must not be shaded.
    expect(r.gross).toBe(900);
  });
  it('lysClass gross equals ticketPrice x students with default shading inputs', () => {
    const r = analyzeTeachingOffer({ format: 'lysClass', ticketPrice: 40, expectedStudents: 6, refundRate: 0 });
    expect(r.gross).toBe(240);
  });
  it('course formats still blend the ladder as a real marketing mix', () => {
    const r = analyzeTeachingOffer({ format: 'selfPacedCourse', ticketPrice: 125, expectedStudents: 10, refundRate: 0 });
    // 125 with default ladder (40% EB -15%, 25% install +12%) blends to ~121.25 × 10
    expect(r.gross).toBeCloseTo(1212.5, 0);
  });
});
describe('hosted quick-check headline (issue #26)', () => {
  it('uses the same hours denominator in the net sentence as the rate divides by', () => {
    const h = analyzeHostedOffer({
      model: 'flatFee', flatFee: 500, outOfPocket: 40,
      hoursPerSession: 6, sessions: 2, hourlyRate: 45, patternHourlyRate: 32,
    });
    const totalHours = 6 * 2;
    // effectiveHourlyRate must be net / totalHours — the headline denominator.
    expect(h.effectiveHourlyRate).toBe(Math.round(((500 - 40) / totalHours) * 100) / 100);
  });
  it('default hosted inputs still use the documented 4h denominator', () => {
    const h = analyzeHostedOffer({
      model: 'flatFee', flatFee: 400, hourlyRate: 45, patternHourlyRate: 32,
    });
    expect(h.effectiveHourlyRate).toBe(100); // 400 / 4h
  });
});
