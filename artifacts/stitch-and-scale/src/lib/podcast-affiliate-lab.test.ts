import { describe, expect, it } from 'vitest';
import { analyzePodcastAffiliate, DEFAULT_PODCAST, fmt$, type PodcastInput } from './podcast-affiliate-lab';

function base(overrides: Partial<PodcastInput> = {}): PodcastInput {
  return { ...DEFAULT_PODCAST, ...overrides };
}

describe('analyzePodcastAffiliate', () => {
  it('returns the CPM lane net for DEFAULT_PODCAST', () => {
    // 3200 dpe × 1 slot × 4 eps/mo × 0.8 fill = 10.24 effective slots-month of CPM units
    const cpmGross = (3200 / 1000) * 1 * 4 * 0.8 * 30; // 307.2
    expect(cpmGross).toBeCloseTo(307.2);
    const res = analyzePodcastAffiliate(DEFAULT_PODCAST);
    const cpm = res.lanes.find((l) => l.label === 'CPM sponsorship')!;
    expect(cpm.grossMonthly).toBeCloseTo(307.2);
    expect(cpm.netMonthly).toBeCloseTo(307.2 * 0.8 - 20 - 250 / 12);
  });

  it('returns the flat-fee lane net', () => {
    const res = analyzePodcastAffiliate(DEFAULT_PODCAST);
    const flat = res.lanes.find((l) => l.label === 'Flat-fee reads')!;
    expect(flat.grossMonthly).toBeCloseTo(150 * 4);
  });

  it('computes affiliate gross from clicks × conversion × AOV × commission', () => {
    const res = analyzePodcastAffiliate(DEFAULT_PODCAST);
    const aff = res.lanes.find((l) => l.label === 'Affiliate programs')!;
    const lcGross = 60 * 4 * 0.02 * 48 * 0.15;
    const kpGross = 40 * 4 * 0.02 * 55 * 0.1;
    expect(aff.grossMonthly).toBeCloseTo(lcGross + kpGross);
  });

  it('clamps conversion rate to [0,1]', () => {
    const input = base({
      programs: [{ name: 'X', commission: 0.1, clicksPerEpisode: 50, conversionRate: 5, aov: 40, platformCut: 0 }],
    });
    const aff = analyzePodcastAffiliate(input).lanes.find((l) => l.label === 'Affiliate programs')!;
    expect(aff.grossMonthly).toBeCloseTo(50 * 4 * 1 * 40 * 0.1);
  });

  it('returns early guidance when downloads are zero', () => {
    const res = analyzePodcastAffiliate(base({ downloadsPerEpisode: 0 }));
    expect(res.lanes).toHaveLength(0);
    expect(res.verdict).toContain('audience numbers');
    expect(res.flags).toHaveLength(0);
  });

  it('returns early guidance when episodes per month is zero', () => {
    const res = analyzePodcastAffiliate(base({ episodesPerMonth: 0 }));
    expect(res.lanes).toHaveLength(0);
    expect(res.verdict).toContain('audience numbers');
  });

  it('flags CPM-only small audiences (PA-01)', () => {
    const res = analyzePodcastAffiliate(base({ downloadsPerEpisode: 150 }));
    const codes = res.flags.map((f) => f.code);
    expect(codes).toContain('PA-01');
  });

  it('does not flag PA-01 at strong audience size', () => {
    const res = analyzePodcastAffiliate(base({ downloadsPerEpisode: 6000 }));
    expect(res.flags.map((f) => f.code)).not.toContain('PA-01');
  });

  it('flags below-band CPM rates (PA-02)', () => {
    const res = analyzePodcastAffiliate(base({ cpmRate: 15 }));
    expect(res.flags.map((f) => f.code)).toContain('PA-02');
  });

  it('does not flag CPM at market rate', () => {
    const res = analyzePodcastAffiliate(base({ cpmRate: 30 }));
    expect(res.flags.map((f) => f.code)).not.toContain('PA-02');
  });

  it('flags underpriced flat fees (PA-03)', () => {
    const res = analyzePodcastAffiliate(base({ downloadsPerEpisode: 5000, flatFeePerRead: 20 }));
    expect(res.flags.map((f) => f.code)).toContain('PA-03');
  });

  it('flatFeeEquivalent matches audience-value math', () => {
    const res = analyzePodcastAffiliate(base({ downloadsPerEpisode: 5000, cpmRate: 20, adSlotsPerEpisode: 1 }));
    // max(20, 25) × 5 = 125
    expect(res.flatFeeEquivalent).toBeCloseTo(125);
  });

  it('flags zero affiliate clicks when programs are listed (PA-04)', () => {
    const res = analyzePodcastAffiliate(
      base({ programs: [{ name: 'X', commission: 0.1, clicksPerEpisode: 0, conversionRate: 0.02, aov: 50, platformCut: 0 }] }),
    );
    expect(res.flags.map((f) => f.code)).toContain('PA-04');
  });

  it('flags below-benchmark affiliate conversion (PA-04)', () => {
    const res = analyzePodcastAffiliate(
      base({ programs: [{ name: 'X', commission: 0.1, clicksPerEpisode: 40, conversionRate: 0.005, aov: 50, platformCut: 0 }] }),
    );
    expect(res.flags.map((f) => f.code)).toContain('PA-04');
  });

  it('flags low commissions vs top programs (PA-05)', () => {
    const res = analyzePodcastAffiliate(
      base({ programs: [{ name: 'X', commission: 0.05, clicksPerEpisode: 40, conversionRate: 0.02, aov: 50, platformCut: 0 }] }),
    );
    expect(res.flags.map((f) => f.code)).toContain('PA-05');
  });

  it('does not flag PA-05 with a top-tier commission present', () => {
    const res = analyzePodcastAffiliate(
      base({ programs: [{ name: 'X', commission: 0.15, clicksPerEpisode: 40, conversionRate: 0.02, aov: 50, platformCut: 0 }] }),
    );
    expect(res.flags.map((f) => f.code)).not.toContain('PA-05');
  });

  it('flags excessive network cuts (PA-06)', () => {
    const res = analyzePodcastAffiliate(base({ networkCut: 0.5 }));
    expect(res.flags.map((f) => f.code)).toContain('PA-06');
  });

  it('flags underpaid show hours when best lane is weak (PA-07)', () => {
    const res = analyzePodcastAffiliate(
      base({
        downloadsPerEpisode: 300,
        cpmRate: 10,
        flatFeePerRead: 10,
        productionHoursPerEpisode: 6,
        hourlyRate: 90,
      }),
    );
    expect(res.flags.map((f) => f.code)).toContain('PA-07');
  });

  it('flags when no monetization is modeled (PA-08)', () => {
    const res = analyzePodcastAffiliate(base({ flatFeePerRead: 0, readsPerMonth: 0, adSlotsPerEpisode: 0, programs: [] }));
    expect(res.flags.map((f) => f.code)).toContain('PA-08');
  });

  it('flags ad-load above the 10% norm (PA-09)', () => {
    const res = analyzePodcastAffiliate(base({ readsPerMonth: 16 })); // 4 reads per episode
    expect(res.flags.map((f) => f.code)).toContain('PA-09');
  });

  it('cpmBreakEvenDownloads scales with opportunity rate', () => {
    const a = analyzePodcastAffiliate(base({ hourlyRate: 40 }));
    const b = analyzePodcastAffiliate(base({ hourlyRate: 80 }));
    expect(b.cpmBreakEvenDownloads).toBeCloseTo(2 * a.cpmBreakEvenDownloads);
  });

  it('cpmBreakEvenDownloads halves when production hours halve', () => {
    const a = analyzePodcastAffiliate(base({ productionHoursPerEpisode: 4 }));
    const b = analyzePodcastAffiliate(base({ productionHoursPerEpisode: 2 }));
    expect(b.cpmBreakEvenDownloads).toBeCloseTo(a.cpmBreakEvenDownloads / 2);
  });

  it('platform cuts reduce the affiliate lane', () => {
    const a = analyzePodcastAffiliate(
      base({
        programs: [{ name: 'X', commission: 0.1, clicksPerEpisode: 40, conversionRate: 0.02, aov: 50, platformCut: 0 }],
      }),
    );
    const b = analyzePodcastAffiliate(
      base({
        programs: [{ name: 'X', commission: 0.1, clicksPerEpisode: 40, conversionRate: 0.02, aov: 50, platformCut: 0.3 }],
      }),
    );
    const aAff = a.lanes.find((l) => l.label === 'Affiliate programs')!.netMonthly;
    const bAff = b.lanes.find((l) => l.label === 'Affiliate programs')!.netMonthly;
    expect(bAff).toBeLessThan(aAff);
  });

  it('netMonthly subtracts recurring costs and 12-month amortized setup', () => {
    const input = base({ flatFeePerRead: 0, readsPerMonth: 0, adSlotsPerEpisode: 0, programs: [], monthlyCosts: 30, setupCosts: 120 });
    const res = analyzePodcastAffiliate(input);
    expect(res.verdict).toContain('costs you money');
    // totalNet across lanes should include -30 - 10 costs distributed; lanes each deduct
    for (const lane of res.lanes) {
      expect(lane.netMonthly).toBeCloseTo(-30 - 120 / 12);
    }
  });

  it('verdict ladder moves up as audience grows', () => {
    const small = analyzePodcastAffiliate(base({ downloadsPerEpisode: 800, cpmRate: 15, flatFeePerRead: 30 }));
    const big = analyzePodcastAffiliate(base({ downloadsPerEpisode: 8000, cpmRate: 30, flatFeePerRead: 300, readsPerMonth: 2 }));
    expect(small.verdict.length).toBeGreaterThan(0);
    expect(big.verdict.length).toBeGreaterThan(0);
    // At large size the CPM lane should dominate and beat the small-show best lane
    const bigCpm = big.lanes.find((l) => l.label === 'CPM sponsorship')!;
    const smallBest = small.lanes.reduce((a, b) => (a.netMonthly > b.netMonthly ? a : b), small.lanes[0]);
    expect(bigCpm.netMonthly).toBeGreaterThan(smallBest.netMonthly);
  });

  it('lanes track hours correctly', () => {
    const res = analyzePodcastAffiliate(DEFAULT_PODCAST);
    const cpm = res.lanes.find((l) => l.label === 'CPM sponsorship')!;
    // show hours + 0.8 filled slots × 0.25 hr
    expect(cpm.hoursPerMonth).toBeCloseTo(4 * 4 + 4 * 0.8 * 0.25);
  });

  it('fmt$ renders negative values with minus sign', () => {
    expect(fmt$(-42)).toContain('−');
    expect(fmt$(0)).toBe('$0');
  });

  it('handles fill rate of zero (no slots sell)', () => {
    const res = analyzePodcastAffiliate(base({ fillRate: 0 }));
    const cpm = res.lanes.find((l) => l.label === 'CPM sponsorship')!;
    expect(cpm.grossMonthly).toBeCloseTo(0);
    expect(cpm.effectiveHourly).toBeLessThan(0); // still carrying show costs
  });

  it('handles multiple CPM slots per episode', () => {
    const a = analyzePodcastAffiliate(base({ adSlotsPerEpisode: 1 }));
    const b = analyzePodcastAffiliate(base({ adSlotsPerEpisode: 2 }));
    const aCpm = a.lanes.find((l) => l.label === 'CPM sponsorship')!;
    const bCpm = b.lanes.find((l) => l.label === 'CPM sponsorship')!;
    expect(bCpm.grossMonthly).toBeCloseTo(2 * aCpm.grossMonthly);
  });
});
