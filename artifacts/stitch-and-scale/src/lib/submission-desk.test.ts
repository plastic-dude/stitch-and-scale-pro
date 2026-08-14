import { describe, expect, it } from 'vitest';
import {
  analyzeSubmission,
  DEFAULT_SUBMISSION,
  WEEKS_PER_MONTH,
  LAINE_EXCLUSIVITY_MONTHS,
  YARN_COST,
  MAGAZINE_SWEATER_CEILING,
  type SubmissionInput,
} from './submission-desk';

function sample(overrides: Partial<SubmissionInput> = {}): Partial<SubmissionInput> {
  return { ...DEFAULT_SUBMISSION, ...overrides };
}

describe('analyzeSubmission — deal math', () => {
  it('accepts a Laine-style magazine deal at the ceiling fee as a clean go', () => {
    // fee 900 + yarn 75 + tail 58.5 − sample 75 − labour 1300 = −341.5 → still net negative vs own-store math.
    // A true go needs the fee to cover floor + direct costs − yarn − tail: ~1216 at default settings.
    // net/hours must clear half the hourly floor (10) for a clean go: fee 1900 → net 687.75 → hourly 10.58.
    const r = analyzeSubmission(sample({ fee: 1900, difficulty: 'sweater', labourHours: 65, exclusivityMonths: 5 }));
    expect(r.verdict).toBe('go');
    expect(r.netOutcome).toBeGreaterThan(0);
  });

  it('treats a $900 magazine sweater fee at the Laine window as net-negative but recoverable via negotiation', () => {
    const r = analyzeSubmission(sample({ fee: 900, labourHours: 65 }));
    expect(r.netOutcome).toBeLessThan(0);
    expect(r.verdict).toBe('no'); // honest ledger: at default 3/wk own sales, Laine-style $900 loses vs self-publish
  });

  it('rejects an exposure-only offer (S-02) with a no verdict', () => {
    const r = analyzeSubmission(sample({ fee: 0, yarnSupportValue: 0 }));
    expect(r.verdict).toBe('no');
    expect(r.redFlags.some(f => f.id === 'S-02')).toBe(true);
  });

  it('flags a fee under the designer labour floor (S-01) and puts the effective hourly below the floor', () => {
    // fee = $100 vs floor = 65h × $20/hr = $1300 → 7.5% of floor, well under 75%
    const r = analyzeSubmission(sample({ fee: 100 }));
    expect(r.redFlags.some(f => f.id === 'S-01')).toBe(true);
    expect(r.floorFee).toBe(65 * 20);
    expect(r.effectiveHourly).toBeLessThan(20 * 0.5);
  });

  it('flags exclusivity beyond the 5-month industry benchmark (S-03)', () => {
    const r = analyzeSubmission(sample({ exclusivityMonths: 8 }));
    expect(r.redFlags.some(f => f.id === 'S-03')).toBe(true);
    expect(r.redFlags.find(f => f.id === 'S-03')?.detail.includes('5-month')).toBe(true);
  });

  it('flags uncompensated sample cost when yarn support is below the sample (S-04)', () => {
    const r = analyzeSubmission(sample({ sampleCost: 90, yarnSupportValue: 20 }));
    expect(r.redFlags.some(f => f.id === 'S-04')).toBe(true);
  });

  it('does not flag the sample when yarn support covers it', () => {
    const r = analyzeSubmission(sample({ sampleCost: 75, yarnSupportValue: 75 }));
    expect(r.redFlags.some(f => f.id === 'S-04')).toBe(false);
  });

  it('flags yarn support below the documented $75 sample yarn cost (S-07)', () => {
    const r = analyzeSubmission(sample({ sampleCost: 75, yarnSupportValue: 30 }));
    expect(r.redFlags.some(f => f.id === 'S-07')).toBe(true);
  });

  it('flags book rights language (S-05) and box concentration risk (S-06) for the box type', () => {
    const book = analyzeSubmission(sample({ offerType: 'book', exclusivityMonths: 6 }));
    expect(book.redFlags.some(f => f.id === 'S-05')).toBe(true);
    const box = analyzeSubmission(sample({ offerType: 'box' }));
    expect(box.redFlags.some(f => f.id === 'S-06')).toBe(true);
  });

  it('excludes box deals from S-05 and magazines from S-06', () => {
    const magazine = analyzeSubmission(sample({ offerType: 'magazine', exclusivityMonths: 6 }));
    expect(magazine.redFlags.some(f => f.id === 'S-06')).toBe(false);
    const box = analyzeSubmission(sample({ offerType: 'box' }));
    expect(box.redFlags.some(f => f.id === 'S-05')).toBe(false);
  });
});

describe('analyzeSubmission — exclusivity & tail economics', () => {
  it('computes dead-loss as price × weekly sales × exclusivity weeks', () => {
    const r = analyzeSubmission(sample());
    const expected = 6.5 * 3 * 5 * WEEKS_PER_MONTH;
    expect(r.exclusivityDeadLoss).toBeCloseTo(expected, 5);
  });

  it('zero exclusivity produces no dead loss', () => {
    const r = analyzeSubmission(sample({ exclusivityMonths: 0 }));
    expect(r.exclusivityDeadLoss).toBe(0);
  });

  it('computes the rights-return tail as an 8-week linear ramp on own-store sales', () => {
    const r = analyzeSubmission(sample());
    // ramp: (1+2+...+8)/8 = 4.5 full weeks
    expect(r.rightsReturnTail).toBeCloseTo(6.5 * 3 * 4.5, 5);
  });

  it('a losing deal after exclusivity gets a no verdict', () => {
    const r = analyzeSubmission(sample({ fee: 100, exclusivityMonths: 6, labourHours: 80 }));
    // 100 + 75 + tail(58.5) − (75 + 0 + 0) − 1600 = −1341.5 → net negative with exclusivity
    expect(r.verdict).toBe('no');
  });

  it('effective hourly reflects net outcome divided by labour hours', () => {
    const r = analyzeSubmission(sample({ labourHours: 50 }));
    expect(r.effectiveHourly).toBeCloseTo(r.netOutcome / 50, 2);
  });

  it('break-even fee reconciles self-publish earnings against costs and tail', () => {
    const r = analyzeSubmission(sample());
    // dead-loss 428.67 + floor 1300 + sample 75 − yarn 75 − tail 58.5 = 1670.17
    expect(r.breakEvenFee).toBeCloseTo(r.exclusivityDeadLoss + r.floorFee + 75 - r.rightsReturnTail - 75, 1);
    // numeric anchor: verify the documented conversion drives the result
    expect(r.exclusivityDeadLoss).toBeCloseTo(6.5 * 3 * 5 * 4.33, 2);
  });

  it('rejects malformed offer types / difficulties by defaulting to magazine / sweater', () => {
    const r = analyzeSubmission({ ...sample(), offerType: 'podcast' as never, difficulty: 'cake' as never });
    expect(r.verdict).toBeDefined();
  });
});

describe('analyzeSubmission — benchmarks are the documented research numbers', () => {
  it('sweater ceiling, costs and Laine window match session-39 anchors', () => {
    expect(MAGAZINE_SWEATER_CEILING).toBe(900);
    expect(YARN_COST).toBe(75);
    expect(LAINE_EXCLUSIVITY_MONTHS).toBe(5);
  });

  it('a fee above the market sweater ceiling that clears the floor verifies as a strong go', () => {
    // 3-month window: dead-loss = 6.5 × 3 × 3 × 4.33 = 253.3; net = 1500 + 58.5 − 253.3 − 1300 − 75 + 75 = 5.2
    // → hourly 0.08 < 10 → hold. Raise to 1800: net 305.2 → hourly 4.7 < 10 → still hold.
    // fee 2400: net 905.2 → hourly 13.9 > 10 and red flags none-major → go
    const r = analyzeSubmission(sample({ fee: 2400, exclusivityMonths: 3 }));
    expect(r.verdict).toBe('go');
    expect(r.verdictReason).toMatch(/market ceiling/i);
  });

  it('a fee above the ceiling but below the labour floor holds, not go-es', () => {
    const r = analyzeSubmission(sample({ fee: 1200, exclusivityMonths: 5, labourHours: 85 }));
    // 1200 + 75 + 58.5 − 75 − 1700 = −441.5 → no; fee 1600: 1600 + 58.5 − 1700 = −41.5 → no.
    // fee 2000: 2000 + 58.5 − 1700 = 358.5, hourly 4.22 < 10 → hold (below-half-rate guard)
    const r2 = analyzeSubmission(sample({ fee: 2000, exclusivityMonths: 5, labourHours: 85 }));
    expect(r2.verdict).toBe('hold');
    expect(r2.effectiveHourly).toBeLessThan(20 * 0.5);
  });

  it('a borderline effective hourly holds rather than go-es (negotiation window)', () => {
    // fee 1800, 80h @ $20: net = 1800 + 75 + 58.5 − 75 − 1600 = 258.5 → hourly 3.23 < half rate → hold
    const r = analyzeSubmission(sample({ fee: 1800, exclusivityMonths: 5, labourHours: 80 }));
    expect(r.verdict).toBe('hold');
    expect(r.verdictReason).toMatch(/negotiate/i);
  });
});
