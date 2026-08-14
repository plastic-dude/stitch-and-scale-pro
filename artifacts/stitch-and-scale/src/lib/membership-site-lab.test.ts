import { describe, expect, it } from 'vitest';
import {
  analyzeMembershipSite,
  DEFAULT_CLUB,
  FEE_STACKS,
  type MembershipSiteInput,
} from './membership-site-lab';

function club(overrides: Partial<MembershipSiteInput> = {}): MembershipSiteInput {
  return { ...DEFAULT_CLUB, ...overrides };
}

describe('Membership Site Lab — defaults', () => {
  it('produces three conversion scenarios', () => {
    const r = analyzeMembershipSite(club());
    expect(r.scenarios).toHaveLength(3);
    expect(r.scenarios[0].label).toBe('worst');
    expect(r.scenarios[2].label).toBe('best');
  });

  it('orders scenarios worst < realistic < best in member count', () => {
    const r = analyzeMembershipSite(club());
    expect(r.scenarios[0].members).toBeLessThan(r.scenarios[1].members);
    expect(r.scenarios[1].members).toBeLessThan(r.scenarios[2].members);
  });

  it('computes expected members from audience × conversion', () => {
    const r = analyzeMembershipSite(club({ audienceSize: 2000, conversionRealistic: 0.03 }));
    expect(r.scenarios[1].members).toBe(60);
  });

  it('blends monthly and annual pricing', () => {
    // 70% at $7/mo, 30% at $72/yr → $6.10/mo blended
    const r = analyzeMembershipSite(club({ annualShare: 0.3 }));
    const blended = 7 * 0.7 + 6 * 0.3;
    const expected = 1500 * 0.03 * blended;
    expect(r.scenarios[1].grossRevenue).toBeCloseTo(expected, 5);
  });

  it('LTV at 5% churn is price ÷ churn', () => {
    const r = analyzeMembershipSite(club());
    const blended = 7 * 0.7 + 6 * 0.3;
    expect(r.scenarios[1].ltvPerMember).toBeCloseTo(blended / 0.05, 2);
  });
});

describe('Membership Site Lab — fees', () => {
  it('applies the selected fee stack', () => {
    const r = analyzeMembershipSite(club({ feeStackKey: 'wixStripe' }));
    // Wix: 2.9% + $0.30 per member, no platform cut
    expect(r.scenarios[1].fees).toBeCloseTo(r.scenarios[1].grossRevenue * 0.029 + 45 * 0.3, 1);
  });

  it('adds the fixed platform monthly fee', () => {
    const r = analyzeMembershipSite(club({ feeStackKey: 'payhipPlus' }));
    const fees = r.scenarios[1].fees;
    // Payhip Plus: 2% + 2.59% + $0.49 per member + $29 fixed
    const expected = r.scenarios[1].grossRevenue * 0.0459 + 45 * 0.49 + 29;
    expect(fees).toBeCloseTo(expected, 1);
  });

  it('net revenue is positive and below gross', () => {
    const r = analyzeMembershipSite(club());
    expect(r.scenarios[1].netRevenue).toBeGreaterThan(0);
    expect(r.scenarios[1].netRevenue).toBeLessThan(r.scenarios[1].grossRevenue);
  });
});

describe('Membership Site Lab — flags', () => {
  it('fires MS-01 when audience is too small', () => {
    const r = analyzeMembershipSite(club({ audienceSize: 300 }));
    expect(r.flags.some(f => f.code === 'MS-01')).toBe(true);
  });

  it('does not fire MS-01 at healthy audience', () => {
    const r = analyzeMembershipSite(club({ audienceSize: 5000 }));
    expect(r.flags.some(f => f.code === 'MS-01')).toBe(false);
  });

  it('fires MS-02 when conversion is optimistic', () => {
    const r = analyzeMembershipSite(club({ conversionRealistic: 0.09 }));
    expect(r.flags.some(f => f.code === 'MS-02')).toBe(true);
  });

  it('fires MS-03 when churn is high', () => {
    const r = analyzeMembershipSite(club({ monthlyChurn: 0.12 }));
    expect(r.flags.some(f => f.code === 'MS-03')).toBe(true);
  });

  it('fires MS-04 when fees exceed 10%', () => {
    // Small audience → per-member fixed fees dominate
    const r = analyzeMembershipSite(club({ audienceSize: 800, conversionRealistic: 0.03 }));
    expect(r.flags.some(f => f.code === 'MS-04')).toBe(true);
  });

  it('fires MS-05 when the treadmill underpays', () => {
    const r = analyzeMembershipSite(club({ contentHours: 30, audienceSize: 500, hourlyRate: 30 }));
    expect(r.flags.some(f => f.code === 'MS-05')).toBe(true);
  });

  it('fires MS-06 when annual share and deep discount combine', () => {
    const r = analyzeMembershipSite(club({ annualShare: 0.6, annualPrice: 60 }));
    expect(r.flags.some(f => f.code === 'MS-06')).toBe(true);
  });

  it('fires MS-07 when members exist but no support hours', () => {
    const r = analyzeMembershipSite(club({ supportHours: 0, audienceSize: 3000 }));
    expect(r.flags.some(f => f.code === 'MS-07')).toBe(true);
  });
});

describe('Membership Site Lab — verdict ladder', () => {
  it('verdicts not-ready below 200 audience', () => {
    const r = analyzeMembershipSite(club({ audienceSize: 150 }));
    expect(r.verdict).toMatch(/^Not ready/);
  });

  it('verdicts treadmill when net is below content cost', () => {
    const r = analyzeMembershipSite(club({ audienceSize: 400, contentHours: 30, hourlyRate: 30 }));
    expect(r.verdict).toMatch(/pays less|treadmill|underpays|for love/i);
  });

  it('verdicts borderline for small-but-positive clubs', () => {
    const r = analyzeMembershipSite(club({ audienceSize: 900, contentHours: 5, supportHours: 0 }));
    // 27 realistic members — under the 30 threshold, net positive vs small hours cost
    expect(r.verdict).toMatch(/^Borderline/);
  });

  it('verdicts fund at healthy audience and thin-but-positive margin', () => {
    const r = analyzeMembershipSite(club({ audienceSize: 5000, contentHours: 8 }));
    expect(r.verdict).toMatch(/^Fund the club/);
    expect(r.treadmillRatio).toBeGreaterThan(1.5);
  });

  it('fund clubs show positive treadmill gap', () => {
    const r = analyzeMembershipSite(club({ audienceSize: 4000, contentHours: 12, hourlyRate: 25 }));
    expect(r.treadmillGap).toBeGreaterThan(0);
    expect(r.breakEvenAudience).toBeGreaterThan(0);
  });
});
