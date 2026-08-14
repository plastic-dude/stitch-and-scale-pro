import { describe, expect, it } from 'vitest';
import {
  analyzeDistribution,
  DEFAULT_DISTRIBUTION,
  SESSION_46_MARKET,
  CHANNEL_LABELS,
} from './subscription-distribution-lab';

// Fixture: $6.50 pattern, 40 units/mo, default allocation (Ravelry 60 / Etsy 30 / LoveCrafts 10).
const FIX = () => analyzeDistribution();

describe('analyzeDistribution — defaults', () => {
  it('produces three channels with sensible nets on the default allocation', () => {
    const r = FIX();
    expect(r.channels).toHaveLength(3);
    const byChannel = Object.fromEntries(r.channels.map((c) => [c.channel, c]));
    // Ravelry 24 units/mo: gross 156 > $30 threshold → 3.5% + 5% processing.
    const rav = byChannel.ravelry;
    expect(rav.units).toBeCloseTo(24);
    expect(rav.gross).toBeCloseTo(156);
    const expectedRavelryFees = 156 * 0.035 + 156 * 0.05;
    expect(rav.net).toBeCloseTo(156 - expectedRavelryFees, 2);
    // Etsy 12 units: $0.20 listing + 6.5% transaction + 3% + $0.25.
    const etsy = byChannel.etsy;
    expect(etsy.units).toBeCloseTo(12);
    const etsyFees = 12 * 0.2 + 78 * 0.065 + 78 * 0.03 + 12 * 0.25;
    expect(etsy.net).toBeCloseTo(78 - etsyFees, 2);
    // LoveCrafts 4 units → $26/mo gross, below $40 → no extra selling fee.
    const lc = byChannel.lovecrafts;
    expect(lc.units).toBeCloseTo(4);
    expect(lc.net).toBeCloseTo(26 - (26 * 0.02 + 4 * 0.2), 2);
    expect(lc.note).not.toContain('selling fee');
  });

  it('computes totals that reconcile gross − fees = net', () => {
    const r = FIX();
    expect(r.totalGross - r.totalNet).toBeCloseTo(r.totalFees, 2);
    expect(r.totalGross).toBeCloseTo(156 + 78 + 26, 2);
  });

  it('computes HHI for the default split (0.6² + 0.3² + 0.1² = 0.46)', () => {
    expect(FIX().hhi).toBeCloseTo(0.46, 2);
  });

  it('lifetime and recovery derive from monthly net', () => {
    const r = FIX();
    expect(r.lifetimeNet).toBeCloseTo(r.totalNet * 24, 2);
    // monthsToRecover is rounded to 0.1-month resolution — assert against the
    // rounded value, not the raw ratio.
    expect(r.monthsToRecover).toBeCloseTo(Math.round((156 / r.totalNet) * 10) / 10, 2);
  });
});

describe('analyzeDistribution — flags', () => {
  it('D-01 error: empty portfolio', () => {
    const r = analyzeDistribution({ allocations: [] });
    expect(r.verdict).toBe('blocked');
    expect(r.flags.some((f) => f.code === 'D-01' && f.severity === 'error')).toBe(true);
  });

  it('D-01 warning: single-channel split (HHI 1.0)', () => {
    const r = analyzeDistribution({
      allocations: [{ channel: 'etsy', share: 1 }],
    });
    expect(r.hhi).toBe(1);
    expect(r.flags.some((f) => f.code === 'D-01' && f.severity === 'warning')).toBe(true);
  });

  it('D-01 warning: dominant >0.5 HHI', () => {
    const r = analyzeDistribution({
      allocations: [
        { channel: 'ravelry', share: 0.8 },
        { channel: 'payhip', share: 0.2 },
      ],
    });
    expect(r.hhi).toBeCloseTo(0.68, 2);
    expect(r.flags.some((f) => f.code === 'D-01' && f.severity === 'warning')).toBe(true);
  });

  it('D-01 info: between thresholds', () => {
    const r = analyzeDistribution({
      allocations: [
        { channel: 'ravelry', share: 0.6 },
        { channel: 'payhip', share: 0.25 },
        { channel: 'ribblr', share: 0.15 },
      ],
    });
    // 0.6² + 0.25² + 0.15² = 0.445 → rounded to 0.45 at 0.01 resolution.
    expect(r.hhi).toBeCloseTo(0.45, 2);
    expect(r.flags.some((f) => f.code === 'D-01' && f.severity === 'info')).toBe(true);
  });

  it('D-02: brutal per-sale cut flagged when fees exceed 40% of gross', () => {
    // Fixed per-sale charges dominate at tiny gross: LoveCrafts at $0.25/mo
    // (price $0.25, 1 unit) pays $0.21375 in fees — 85.5% of gross.
    const r = analyzeDistribution({
      price: 0.25,
      monthlyUnits: 1,
      allocations: [{ channel: 'lovecrafts', share: 1 }],
    });
    const lc = r.channels.find((c) => c.channel === 'lovecrafts')!;
    expect(lc.effectiveFeePct).toBeGreaterThan(40);
    expect(r.flags.some((f) => f.code === 'D-02')).toBe(true);
  });

  it('D-03: Etsy slow-tail info below 5 units/mo', () => {
    const r = analyzeDistribution({
      monthlyUnits: 4,
      allocations: [{ channel: 'etsy', share: 1 }],
    });
    expect(r.channels.find((c) => c.channel === 'etsy')!.units).toBeLessThan(5);
    expect(r.flags.some((f) => f.code === 'D-03')).toBe(true);
  });
});

describe('analyzeDistribution — subscription comparison', () => {
  it('club wins when club net exceeds library royalties on the same traffic', () => {
    const r = analyzeDistribution({
      clubMembers: 100,
      clubDownloadsPerMember: 0.3,
      clubRate: 5,
      libraryRoyaltyPerDownload: 0.1,
    });
    expect(r.subscription.clubMonthlyNet).toBeCloseTo(100 * 0.3 * 5, 2);
    expect(r.subscription.libraryAnnualNetAtUnits).toBeCloseTo(0.1 * 40 * 12, 2);
    expect(r.subscription.verdict).toBe('club_wins');
    expect(r.flags.some((f) => f.code === 'D-04')).toBe(true);
  });

  it('library wins when royalty × traffic beats the club', () => {
    const r = analyzeDistribution({
      clubMembers: 10,
      clubDownloadsPerMember: 0.1,
      clubRate: 3,
      libraryRoyaltyPerDownload: 0.4,
    });
    // club: 10*0.1*3 = $3/mo; library: 0.4*40 = $16/mo
    expect(r.subscription.verdict).toBe('library_wins');
  });

  it('neither_active when no club members', () => {
    const r = analyzeDistribution({ clubMembers: 0 });
    expect(r.subscription.verdict).toBe('neither_active');
  });

  it('club channel appears in channels when members > 0', () => {
    const r = analyzeDistribution({
      clubMembers: 50,
      allocations: [{ channel: 'club', share: 1 }],
    });
    expect(r.channels.some((c) => c.channel === 'club' && c.royaltyMode)).toBe(true);
    // units reports the derived member-download rate, not the sales volume.
    expect(r.channels.find((c) => c.channel === 'club')!.units).toBeCloseTo(50 * 0.3, 2);
    expect(r.channels.find((c) => c.channel === 'club')!.net).toBeCloseTo(50 * 0.3 * 5, 2);
  });
});

describe('analyzeDistribution — LoveCrafts thresholds and payment lag', () => {
  it('applies the extra selling fee only between $40 and $1,500 monthly gross', () => {
    // 20 units × $6.50 = $130/mo → inside the band.
    const r = analyzeDistribution({
      monthlyUnits: 20,
      allocations: [{ channel: 'lovecrafts', share: 1 }],
    });
    const lc = r.channels[0];
    const expectedFees = 130 * 0.02 + 20 * 0.2 + 130 * 0.035;
    expect(lc.net).toBeCloseTo(130 - expectedFees, 2);
    expect(lc.note).toContain('selling fee');
    // Above $1,500 → no extra fee (100 units ≈ $650... use high price? No:
    // use 300 units × $6.50 = $1,950).
    const r2 = analyzeDistribution({
      monthlyUnits: 300,
      allocations: [{ channel: 'lovecrafts', share: 1 }],
    });
    const lc2 = r2.channels[0];
    expect(lc2.note).not.toContain('selling fee');
  });

  it('no extra fee below $40 monthly gross', () => {
    const r = analyzeDistribution({
      monthlyUnits: 5,
      allocations: [{ channel: 'lovecrafts', share: 1 }],
    });
    const lc = r.channels[0];
    expect(lc.note).not.toContain('selling fee');
    expect(lc.net).toBeCloseTo(32.5 - (32.5 * 0.02 + 5 * 0.2), 2);
  });

  it('documents the payment-lag warning constant', () => {
    expect(SESSION_46_MARKET.lovecraftsPaymentLagDays).toBe(30);
  });
});

describe('analyzeDistribution — own-store model', () => {
  it('Stripe-only processing yields the best per-sale net', () => {
    const r = analyzeDistribution({
      monthlyUnits: 40,
      allocations: [
        { channel: 'ownstore', share: 0.5 },
        { channel: 'ravelry', share: 0.5 },
      ],
    });
    const own = r.channels.find((c) => c.channel === 'ownstore')!;
    const rav = r.channels.find((c) => c.channel === 'ravelry')!;
    expect(own.netPerSale).toBeGreaterThan(rav.netPerSale);
    expect(own.netPerSale).toBeCloseTo(6.5 - (6.5 * 0.029 + 0.3), 2);
  });
});

describe('analyzeDistribution — defensive inputs', () => {
  it('rejects non-finite price and falls back to the default price', () => {
    const r = analyzeDistribution({
      price: NaN,
      monthlyUnits: 1,
      allocations: [{ channel: 'payhip', share: 1 }],
    });
    // 1 unit × default $6.50 price, Payhip fees apply.
    expect(r.channels[0].gross).toBeCloseTo(DEFAULT_DISTRIBUTION.price, 2);
  });

  it('caps negative library royalty at zero', () => {
    const r = analyzeDistribution({
      libraryRoyaltyPerDownload: -1,
      allocations: [{ channel: 'library', share: 1 }],
    });
    expect(r.channels.find((c) => c.channel === 'library')?.net).toBe(0);
  });

  it('ignores allocations with unknown channels', () => {
    const r = analyzeDistribution({
      allocations: [{ channel: 'unknown' as never, share: 1 }],
    });
    expect(r.channels).toHaveLength(0);
    expect(r.verdict).toBe('blocked');
  });
});

describe('analyzeDistribution — verdict ladder', () => {
  it('ready verdict on the default allocation', () => {
    expect(FIX().verdict).toBe('ready');
  });

  it('revise verdict on the single-channel warning', () => {
    expect(analyzeDistribution({ allocations: [{ channel: 'etsy', share: 1 }] }).verdict).toBe('revise');
  });

  it('blocked verdict when the portfolio is empty', () => {
    expect(analyzeDistribution({ allocations: [] }).verdict).toBe('blocked');
  });
});

describe('SESSION_46_MARKET — spot-checks against session-46 research', () => {
  it('LoveCrafts thresholds match the designer handbook ($40/$1,500)', () => {
    expect(SESSION_46_MARKET.lovecraftsExtraLowThreshold).toBe(40);
    expect(SESSION_46_MARKET.lovecraftsExtraHighThreshold).toBe(1500);
  });

  it('library royalty band matches the documented anecdotal range', () => {
    expect(SESSION_46_MARKET.libraryRoyaltyLow).toBe(0.01);
    expect(SESSION_46_MARKET.libraryRoyaltyHigh).toBe(0.45);
  });

  it('channel labels cover all eight channels', () => {
    expect(Object.keys(CHANNEL_LABELS)).toHaveLength(8);
    expect(CHANNEL_LABELS.ravelry).toBe('Ravelry');
  });
});
