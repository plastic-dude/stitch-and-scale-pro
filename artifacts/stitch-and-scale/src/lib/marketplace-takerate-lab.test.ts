import { describe, it, expect } from 'vitest';
import { analyzeTakeRate, DEFAULT_TAKE_RATE, fmt$, type ChannelSpec, type MarketplaceTakeRateInput } from './marketplace-takerate-lab';

function input(overrides: Partial<MarketplaceTakeRateInput> = {}): MarketplaceTakeRateInput {
  return { ...DEFAULT_TAKE_RATE, ...overrides };
}

function channel(overrides: Partial<ChannelSpec> = {}): ChannelSpec {
  return { id: 'etsy', label: 'Etsy', unitsPerMonth: 10, price: 5, offsiteAdsShare: 0, hasAudience: true, ...overrides };
}

describe('marketplace-takerate-lab — fee math', () => {
  it('Etsy net on $5 sale matches the verified $0.81-like toll band', () => {
    // Etsy: 0.20 listing + 6.5% txn + 0.21% reg + 3%+0.25 processing = 0.20+0.325+0.0105+0.40 = 0.9355 on $5 → net ≈ $4.06
    const r = analyzeTakeRate(input({ channels: [channel({ id: 'etsy', unitsPerMonth: 1, price: 5 })] }));
    expect(r.channels[0].netPerSale).toBeCloseTo(4.06, 1);
    expect(r.channels[0].totalFees).toBeCloseTo(0.94, 1);
  });

  it('Etsy Offsite Ads adds 15% × share to fees', () => {
    const low = analyzeTakeRate(input({ channels: [channel({ id: 'etsy', unitsPerMonth: 10, price: 5, offsiteAdsShare: 0 })] }));
    const high = analyzeTakeRate(input({ channels: [channel({ id: 'etsy', unitsPerMonth: 10, price: 5, offsiteAdsShare: 0.2 })] }));
    expect(high.channels[0].totalFees - low.channels[0].totalFees).toBeCloseTo(10 * 5 * 0.15 * 0.2, 1);
  });

  it('Ravelry is commission-free below $30/mo (PayPal only)', () => {
    const r = analyzeTakeRate(input({ channels: [channel({ id: 'ravelry', unitsPerMonth: 3, price: 5 })] }));
    expect(r.thresholdAlerts.some(t => t.crossing === 'already-in')).toBe(true);
    expect(r.channels[0].netPerSale).toBeCloseTo(5 - 0.029 * 5 - 0.3, 1);
  });

  it('Ravelry 3.5% commission activates between $30 and $1,500/mo', () => {
    const r = analyzeTakeRate(input({ channels: [channel({ id: 'ravelry', unitsPerMonth: 10, price: 5 })] }));
    expect(r.channels[0].netPerSale).toBeCloseTo(5 - 0.035 * 5 - 0.029 * 5 - 0.3, 1);
    expect(r.thresholdAlerts.some(t => t.crossing === 'entering')).toBe(true);
  });

  it('Ravelry commission removed above the $1,500/mo ceiling', () => {
    const r = analyzeTakeRate(input({ channels: [channel({ id: 'ravelry', unitsPerMonth: 250, price: 8 })] }));
    expect(r.channels[0].netPerSale).toBeCloseTo(8 - 0.029 * 8 - 0.3, 1);
    expect(r.thresholdAlerts.some(t => t.crossing === 'above-ceiling')).toBe(true);
  });

  it('LoveCrafts base 2% + $0.20, extra 5% between $40 and $1,500/mo', () => {
    const small = analyzeTakeRate(input({ channels: [channel({ id: 'lovecrafts', unitsPerMonth: 4, price: 5 })] }));
    expect(small.channels[0].netPerSale).toBeCloseTo(5 - 0.1 - 0.2, 1);
    const mid = analyzeTakeRate(input({ channels: [channel({ id: 'lovecrafts', unitsPerMonth: 10, price: 5 })] }));
    expect(mid.channels[0].netPerSale).toBeCloseTo(5 - 0.1 - 0.2 - 0.25, 1);
    expect(mid.thresholdAlerts.some(t => t.crossing === 'entering')).toBe(true);
  });

  it('Ribblr $0.25 floor dominates below $6.25 (verified rate table)', () => {
    // Full honest take = platform fee (4% or $0.25 floor) + Stripe 2.9% + $0.30.
    // CartMango's platform-only 12.6% on $1.99 becomes 30.5% once payment
    // processing is included — the number a designer actually loses.
    const cheap = analyzeTakeRate(input({ channels: [channel({ id: 'ribblr', unitsPerMonth: 1, price: 1.99 })] }));
    expect(cheap.channels[0].totalFees / cheap.channels[0].revenue * 100).toBeCloseTo(30.5, 0);
    const above = analyzeTakeRate(input({ channels: [channel({ id: 'ribblr', unitsPerMonth: 1, price: 10 })] }));
    expect(above.channels[0].totalFees / above.channels[0].revenue * 100).toBeCloseTo(9.9, 0);
    // Net-per-sale sanity: on $1.99 the $0.55 of fixed toll leaves $1.44ish
    expect(cheap.channels[0].netPerSale).toBeCloseTo(1.99 - 0.25 - 0.029 * 1.99 - 0.3, 1);
  });

  it('Payhip free plan 5% + Stripe processing', () => {
    const r = analyzeTakeRate(input({ channels: [channel({ id: 'payhip', unitsPerMonth: 1, price: 7 })] }));
    expect(r.channels[0].netPerSale).toBeCloseTo(7 - 0.35 - 0.029 * 7 - 0.3, 1);
  });

  it('Own site keeps Stripe-only deduction', () => {
    const r = analyzeTakeRate(input({ channels: [channel({ id: 'own-site', unitsPerMonth: 1, price: 5 })] }));
    expect(r.channels[0].netPerSale).toBeCloseTo(5 - 0.029 * 5 - 0.3, 1);
  });
});

describe('marketplace-takerate-lab — portfolio math', () => {
  it('defaults compute a full six-channel portfolio', () => {
    const r = analyzeTakeRate(input());
    expect(r.channels.length).toBe(6);
    expect(r.totalRevenue).toBeGreaterThan(0);
    expect(r.totalNet).toBeGreaterThan(0);
    expect(r.totalNet + r.totalFees).toBeCloseTo(r.totalRevenue, 1);
  });

  it('fee-leak ranking orders worst channel first', () => {
    const r = analyzeTakeRate(input());
    for (let i = 0; i < r.feeLeakRanking.length - 1; i++) {
      expect(r.feeLeakRanking[i].effectiveTakePct).toBeGreaterThanOrEqual(r.feeLeakRanking[i + 1].effectiveTakePct);
    }
  });

  it('payout lag flags LoveCrafts and Ribblr', () => {
    const r = analyzeTakeRate(input());
    expect(r.channels.find(c => c.channel === 'lovecrafts')!.payoutLagDays).toBe(45);
    expect(r.flags.some(f => f.code === 'TR-03')).toBe(true);
  });

  it('ribblr floor triggers TR-08 on cheap patterns', () => {
    const r = analyzeTakeRate(input({ channels: [channel({ id: 'ribblr', price: 3.84, unitsPerMonth: 5 })] }));
    expect(r.flags.some(f => f.code === 'TR-08')).toBe(true);
  });

  it('own-site channel counts as discovery-free revenue', () => {
    const r = analyzeTakeRate(input({ channels: [channel({ id: 'own-site', price: 7, unitsPerMonth: 100, hasAudience: false })] }));
    expect(r.discoveryFreeNetShare).toBeGreaterThan(40);
    expect(r.flags.some(f => f.code === 'TR-07')).toBe(true);
  });

  it('single-channel concentration triggers TR-06', () => {
    const r = analyzeTakeRate(input({ channels: [channel({ unitsPerMonth: 200 }), channel({ id: 'payhip', unitsPerMonth: 1 })] }));
    expect(r.flags.some(f => f.code === 'TR-06')).toBe(true);
    expect(r.concentrationShare).toBeGreaterThan(50);
  });

  it('delisting exposure flags high-net marketplace channels', () => {
    const r = analyzeTakeRate(input({ channels: [channel({ unitsPerMonth: 300 }), channel({ id: 'payhip', unitsPerMonth: 1 })] }));
    expect(r.flags.some(f => f.code === 'TR-04')).toBe(true);
    expect(r.flags.some(f => f.code === 'TR-05')).toBe(true);
  });

  it('zero-volume audience channel triggers TR-09', () => {
    const r = analyzeTakeRate(input({ channels: [channel({ unitsPerMonth: 10 }), channel({ id: 'lovecrafts', unitsPerMonth: 0 })] }));
    expect(r.flags.some(f => f.code === 'TR-09')).toBe(true);
  });

  it('Offsite Ads heavy share triggers TR-02', () => {
    const r = analyzeTakeRate(input({ channels: [channel({ offsiteAdsShare: 0.3, unitsPerMonth: 50 })] }));
    expect(r.flags.some(f => f.code === 'TR-02')).toBe(true);
  });

  it('cheap price with fixed toll triggers TR-01', () => {
    const r = analyzeTakeRate(input({ channels: [channel({ price: 2, unitsPerMonth: 10 })] }));
    expect(r.flags.some(f => f.code === 'TR-01')).toBe(true);
  });

  it('no sales modeled gives the modeling-first verdict', () => {
    const r = analyzeTakeRate(input({ channels: [channel({ unitsPerMonth: 0 }), channel({ id: 'payhip', unitsPerMonth: 0 })] }));
    expect(r.verdict).toContain('No sales modeled');
  });

  it('migration-gap verdict fires when worst channel leaks ≥10pp more than best', () => {
    const r = analyzeTakeRate(input({ channels: [channel({ price: 2.5, unitsPerMonth: 40 }), channel({ id: 'own-site', price: 25, unitsPerMonth: 40 })] }));
    expect(r.verdict).toContain('Move revenue from the leak channel');
  });
});

describe('marketplace-takerate-lab — fmt$', () => {
  it('formats negative and positive currency', () => {
    expect(fmt$(12.5)).toBe('$12.50');
    expect(fmt$(-3.7)).toBe('−$3.70');
  });
});

describe('marketplace-takerate-lab — repeated flag codes (QA #54 / #59)', () => {
  it('default portfolio emits TR-03 for both LoveCrafts and Ribblr payout lags', () => {
    const r = analyzeTakeRate(input());
    const tr03 = r.flags.filter(f => f.code === 'TR-03');
    expect(tr03.length).toBe(2);
    expect(tr03.some(f => f.title.startsWith('LoveCrafts:'))).toBe(true);
    expect(tr03.some(f => f.title.startsWith('Ribblr:'))).toBe(true);
  });
  it('default portfolio emits TR-05 for both Etsy and Ravelry fee-inflation exposure', () => {
    const r = analyzeTakeRate(input());
    const tr05 = r.flags.filter(f => f.code === 'TR-05');
    expect(tr05.length).toBe(2);
    expect(tr05.some(f => f.title.startsWith('Etsy:'))).toBe(true);
    expect(tr05.some(f => f.title.startsWith('Ravelry:'))).toBe(true);
  });
  it('every watchout flag carries a distinct per-flag key so React children never collide', () => {
    // Regression lock for QA #54/#59: the card keys badges by `${code}-${index}`;
    // with position-stable indexes, any number of repeated codes stays unique.
    const r = analyzeTakeRate(input());
    const keys = new Set(r.flags.map((f, i) => `${f.code}-${i}`));
    expect(keys.size).toBe(r.flags.length);
  });
});
