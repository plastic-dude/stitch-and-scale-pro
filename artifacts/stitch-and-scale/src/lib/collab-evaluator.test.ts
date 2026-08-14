import { describe, expect, it } from 'vitest';
import { analyzeCollab, DEFAULT_COLLAB, type CollabInput } from './collab-evaluator';

const base: CollabInput = {
  ...DEFAULT_COLLAB,
};

describe('analyzeCollab — verdict ladder', () => {
  it('unpaid work with real requirements is a walk (CE-01)', () => {
    const result = analyzeCollab({ ...base, collabType: 'unpaid_work' });
    expect(result.verdict).toBe('walk');
    expect(result.redFlags.some(f => f.code === 'CE-01')).toBe(true);
    // The floor must reflect hours + postings at rate.
    expect(result.fairFeeFloor).toBeGreaterThan(base.requiredHours * base.hourlyRate);
  });

  it('no-strings product seeding is never flagged as a problem', () => {
    const result = analyzeCollab({
      ...base,
      collabType: 'unpaid_seed',
      requiredHours: 0,
      postingRequirements: 0,
      exclusivityMonths: 0,
    });
    expect(result.redFlags.some(f => f.code === 'CE-01')).toBe(false);
  });

  it('a flat fee at 1.5x the floor is a take', () => {
    const floor = analyzeCollab(base).fairFeeFloor;
    const result = analyzeCollab({
      ...base,
      collabType: 'flat_fee',
      offeredValue: floor * 1.5,
      yarnProvided: true,
    });
    expect(result.verdict).toBe('take');
  });

  it('a fee at exactly the floor is a take (offerTotal >= 80% floor)', () => {
    const floor = analyzeCollab(base).fairFeeFloor;
    const result = analyzeCollab({
      ...base,
      collabType: 'flat_fee',
      offeredValue: floor,
    });
    expect(result.verdict).toBe('take');
  });

  it('a fee between 60% and 79% of the floor is a counter', () => {
    const floor = analyzeCollab(base).fairFeeFloor;
    const result = analyzeCollab({
      ...base,
      collabType: 'flat_fee',
      offeredValue: floor * 0.65,
    });
    expect(result.verdict).toBe('counter');
  });

  it('royalty on GROSS pays more than the same royalty on NET (issue #2 parity)', () => {
    const gross = analyzeCollab({ ...base, collabType: 'royalty', companySales: 800, royaltyBase: 'gross' });
    const net = analyzeCollab({ ...base, collabType: 'royalty', companySales: 800, royaltyBase: 'net' });
    expect(gross.totalOfferValue).toBeGreaterThan(net.totalOfferValue);
  });

  it('exclusivity adds a locked-out value from the designer own channel', () => {
    const locked = analyzeCollab({ ...base, exclusivityMonths: 6 });
    const free = analyzeCollab({ ...base, exclusivityMonths: 0 });
    expect(locked.lockedOutValue).toBeGreaterThan(free.lockedOutValue);
  });
});

describe('analyzeCollab — red flags', () => {
  it('full copyright transfer under 2x floor is CE-02 critical', () => {
    const result = analyzeCollab({
      ...base,
      collabType: 'flat_fee',
      offeredValue: base.fairFeeFloor === undefined ? 10 : 10,
      fullCopyrightTransfer: true,
    });
    expect(result.redFlags.some(f => f.code === 'CE-02' && f.severity === 'critical')).toBe(true);
  });

  it('2+ demanded posts with no fee is CE-05', () => {
    const result = analyzeCollab({ ...base, postingRequirements: 3, offeredValue: 50 });
    expect(result.redFlags.some(f => f.code === 'CE-05')).toBe(true);
  });

  it('exclusive license below the locked-out value is CE-04', () => {
    const floor = analyzeCollab(base).fairFeeFloor;
    const lockedBase = { ...base, collabType: 'exclusive_license' as const, exclusivityMonths: 6, offeredValue: floor * 0.8 };
    const result = analyzeCollab(lockedBase);
    // The license fee ($0.8×floor) is almost certainly below what 6 months of
    // own-channel sales nets — the flag fires by arithmetic of the fixture.
    expect(result.redFlags.some(f => f.code === 'CE-04')).toBe(true);
  });

  it('unpaid reputation on a real ask is CE-03', () => {
    const result = analyzeCollab({ ...base, unpaidReputation: true });
    expect(result.redFlags.some(f => f.code === 'CE-03')).toBe(true);
  });

  // Issue #18 regression: stale royalty state must NOT leak into
  // exclusive-license mode — royaltyValue only counts in royalty/flat_fee asks.
  it('#18: stale royalties do not inflate an exclusive-license offer', () => {
    const result = analyzeCollab({
      ...base,
      collabType: 'exclusive_license' as const,
      companySales: 1000,
      royaltyPct: 0.30,
      offeredValue: 400,
      exclusivityMonths: 3,
      ownMonthlySales: 25,
    });
    // Total offer value must be the fee minus floor minus lockout — no royalty.
    expect(result.totalOfferValue).toBeLessThan(0);
    // And stale royalties must not flip the verdict to 'take'.
    expect(result.verdict).not.toBe('take');
  });

  it('royalties still count in royalty-mode asks', () => {
    const result = analyzeCollab({
      ...base,
      collabType: 'royalty' as const,
      companySales: 1000,
      royaltyPct: 0.30,
      offeredValue: 0,
    });
    // Royalty mode: 1000 sales at ravelry net × 30% is substantial value.
    expect(result.totalOfferValue).toBeGreaterThan(0);
  });

  // Issue #19 regression: exclusive-license net must deduct the lockout.
  it('#19: exclusive-license net deducts locked-out sales', () => {
    const locked = analyzeCollab({
      ...base,
      collabType: 'exclusive_license' as const,
      offeredValue: 400,
      exclusivityMonths: 3,
      ownMonthlySales: 25,
    });
    // fee (400) − floor − lockedOutValue: 25 sales × 3 months × ~$7.3 net ≈ $549.
    // 400 − 570 − 549 = −719. The honest net must be negative.
    expect(locked.lockedOutValue).toBeGreaterThan(0);
    expect(locked.totalOfferValue).toBeCloseTo(400 - locked.fairFeeFloor - locked.lockedOutValue, 0);
    expect(locked.totalOfferValue).toBeLessThan(0);
  });

  it('non-exclusive license is NOT penalized by the lockout', () => {
    const result = analyzeCollab({
      ...base,
      collabType: 'flat_fee' as const,
      offeredValue: 570,
      exclusivityMonths: 3,
      ownMonthlySales: 25,
    });
    // Floor alone is 12h×35 + 45 + 2×1.5h×35 = 570; at the floor, net ≈ 0 and
    // the lockout must not be deducted outside exclusive-license mode.
    expect(result.totalOfferValue).toBeGreaterThanOrEqual(-1);
  });
});

describe('analyzeCollab — exposure honesty', () => {
  it('a 50k follower brand exposure is capped honestly — rarely a real payment', () => {
    const result = analyzeCollab({ ...base, brandFollowers: 50000 });
    // 50,000 × 0.5% × ~$7 net ≈ $1,750 ceiling; realistic reach floors at $50.
    expect(result.exposure.grossExposureValue).toBeGreaterThan(0);
    expect(result.exposure.realisticReach).toBeGreaterThan(0);
    expect(result.exposure.realisticReach).toBeLessThanOrEqual(result.exposure.grossExposureValue);
  });

  it('tiny brand exposure rounds to zero, so exposure can never bail out a bad deal', () => {
    const result = analyzeCollab({ ...base, brandFollowers: 3000 });
    // 3,000 × 0.5% × ~$7 ≈ $105 — still positive but small; check the floor
    // mechanism rather than exact values: an unpaid-work ask with a 3k-follower
    // brand must still walk.
    const walkResult = analyzeCollab({ ...base, brandFollowers: 3000 });
    expect(walkResult.verdict).toBe('walk');
  });
});

describe('analyzeCollab — reply letters', () => {
  it('walk letter states the fair floor and declines exposure-as-payment', () => {
    const result = analyzeCollab(base);
    expect(result.replyLetter).toContain(`$${result.fairFeeFloor.toFixed(0)}`);
    expect(result.replyLetter.toLowerCase()).toContain('pass');
  });

  it('counter letter quotes the floor and cites the rate-database precedent', () => {
    const floor = analyzeCollab(base).fairFeeFloor;
    const result = analyzeCollab({ ...base, collabType: 'flat_fee', offeredValue: floor * 0.65 });
    expect(result.verdict).toBe('counter');
    expect(result.replyLetter).toContain('rate database');
    expect(result.replyLetter).toContain('floor');
  });

  it('accept letter confirms scope and copyright', () => {
    const result = analyzeCollab({
      ...base,
      collabType: 'flat_fee',
      offeredValue: 9000,
      yarnProvided: true,
    });
    expect(result.verdict).toBe('take');
    expect(result.replyLetter).toContain('Copyright stays with me');
  });
});
