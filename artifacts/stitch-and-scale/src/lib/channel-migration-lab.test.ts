import { describe, expect, it } from 'vitest';
import {
  CHANNELS,
  DEFAULT_MIGRATION,
  analyzeChannelMigration,
  fmt$,
  type ChannelMigrationInput,
} from './channel-migration-lab';

function base(overrides: Partial<ChannelMigrationInput> = {}): ChannelMigrationInput {
  return { ...DEFAULT_MIGRATION, ...overrides };
}

describe('net per sale math', () => {
  it('Etsy nets roughly $5.95-6.10 on a $7 pattern with the full stack', () => {
    const r = analyzeChannelMigration(base());
    const etsy = r.nets.find(n => n.channel.key === 'etsy')!;
    // 7 - 0.20/4mo amortization - 6.65% platform+regulatory - (3% + $0.25) processing ≈ $6.02
    expect(etsy.netPerSale).toBeGreaterThan(5.95);
    expect(etsy.netPerSale).toBeLessThan(6.10);
  });

  it('Etsy fee share on a $7 pattern is around 12-15% with renewal amortization', () => {
    const r = analyzeChannelMigration(base());
    const etsy = r.nets.find(n => n.channel.key === 'etsy')!;
    expect(etsy.feeShare).toBeGreaterThan(0.12);
    expect(etsy.feeShare).toBeLessThan(0.15);
  });

  it('Ravelry nets more than Etsy on the same price (above $30/mo band)', () => {
    const r = analyzeChannelMigration(base({ fromChannel: 'etsy' }));
    const etsy = r.nets.find(n => n.channel.key === 'etsy')!;
    const ravelry = r.nets.find(n => n.channel.key === 'ravelry')!;
    expect(ravelry.netPerSale).toBeGreaterThan(etsy.netPerSale);
  });

  it('LoveCrafts keeps the most per sale on a $7 pattern (2% + $0.20 beats every fixed-rate stack)', () => {
    const r = analyzeChannelMigration(base());
    const lc = r.nets.find(n => n.channel.key === 'lovecrafts')!;
    const others = r.nets.filter(n => n.channel.key !== 'lovecrafts');
    // 7 - 2% - $0.20 = $6.66 > own site $6.497 > Ravelry $6.25 > Pattern $6.09 > Etsy $6.02
    expect(others.every(o => lc.netPerSale > o.netPerSale)).toBe(true);
    expect(lc.netPerSale).toBeCloseTo(7 - 7 * 0.02 - 0.20, 4);
  });

  it('Own site still beats Ravelry and Etsy on net per sale', () => {
    const r = analyzeChannelMigration(base());
    const own = r.nets.find(n => n.channel.key === 'ownsite')!;
    const rav = r.nets.find(n => n.channel.key === 'ravelry')!;
    const etsy = r.nets.find(n => n.channel.key === 'etsy')!;
    expect(own.netPerSale).toBeGreaterThan(rav.netPerSale);
    expect(own.netPerSale).toBeGreaterThan(etsy.netPerSale);
    expect(own.netPerSale).toBeCloseTo(7 - (7 * 0.029 + 0.30), 4);
  });

  it('LoveCrafts <$40/mo band nets price minus $0.20 processing', () => {
    const r = analyzeChannelMigration(base());
    const lc = r.nets.find(n => n.channel.key === 'lovecrafts')!;
    expect(lc.netPerSale).toBeCloseTo(7 - 0.2 - 7 * 0.02, 5);
  });

  it('per-sale spread is best-target net minus source net (target = best alternative)', () => {
    const r = analyzeChannelMigration(base({ fromChannel: 'ravelry', addedSalesPerMonth: 3 }));
    // From Ravelry the best alternative is LoveCrafts ($6.66) — the spread is +$0.408.
    const ravelry = r.nets.find(n => n.channel.key === 'ravelry')!;
    const lc = r.nets.find(n => n.channel.key === 'lovecrafts')!;
    expect(r.perSaleSpread).toBeCloseTo(lc.netPerSale - ravelry.netPerSale, 5);
    expect(r.perSaleSpread).toBeGreaterThan(0);
  });

  it('net per sale scales linearly with price', () => {
    const a = analyzeChannelMigration(base({ price: 7 }));
    const b = analyzeChannelMigration(base({ price: 14 }));
    const aEtsy = a.nets.find(n => n.channel.key === 'etsy')!.netPerSale;
    const bEtsy = b.nets.find(n => n.channel.key === 'etsy')!.netPerSale;
    expect(bEtsy).toBeGreaterThan(2 * aEtsy);
  });

  it('zero-price guard: fee share returns 0 rather than NaN', () => {
    const r = analyzeChannelMigration(base({ price: 0, fromChannel: 'etsy' }));
    expect(r.nets.every(n => n.netPerSale === 0 && n.feeShare === 0)).toBe(true);
  });
});

describe('listing renewal drag', () => {
  it('Etsy annual listing drag is $0.60/yr for a 4-month listing', () => {
    const r = analyzeChannelMigration(base());
    const etsy = r.nets.find(n => n.channel.key === 'etsy')!;
    expect(etsy.annualListingDrag).toBeCloseTo(0.6, 6);
  });

  it('perpetual listings (Ravelry, own site) have zero listing drag', () => {
    const r = analyzeChannelMigration(base());
    for (const key of ['ravelry', 'ownsite', 'lovecrafts']) {
      expect(r.nets.find(n => n.channel.key === key)!.annualListingDrag).toBe(0);
    }
  });
});

describe('migration cost & payback', () => {
  it('migration cost equals hours × rate', () => {
    const r = analyzeChannelMigration(base({ migrationHours: 4, hourlyRate: 25 }));
    expect(r.migrationCost).toBeCloseTo(100, 6);
  });

  it('pure migration (0 added sales) has no payback', () => {
    const r = analyzeChannelMigration(base({ addedSalesPerMonth: 0, newChannelMonthlyFee: 0 }));
    expect(r.paybackMonths).toBe(Infinity);
    expect(r.deltaNetPerMonth).toBe(0);
  });

  it('payback shrinks with more added sales', () => {
    const a = analyzeChannelMigration(base({ addedSalesPerMonth: 1 }));
    const b = analyzeChannelMigration(base({ addedSalesPerMonth: 5 }));
    expect(b.paybackMonths).toBeLessThan(a.paybackMonths);
  });

  it('year-one delta equals 12 × monthly delta minus migration cost', () => {
    const r = analyzeChannelMigration(base());
    expect(r.yearOneDelta).toBeCloseTo(r.deltaNetPerMonth * 12 - r.migrationCost, 4);
  });

  it('monthly fixed fee can flip delta net negative', () => {
    const r = analyzeChannelMigration(base({ addedSalesPerMonth: 0.2, newChannelMonthlyFee: 10 }));
    expect(r.deltaNetPerMonth).toBeLessThan(0);
  });
});

describe('flags', () => {
  it('CM-01 fires on pure migration with zero added sales', () => {
    const r = analyzeChannelMigration(base({ addedSalesPerMonth: 0 }));
    expect(r.flags.map(f => f.code)).toContain('CM-01');
  });

  it('CM-02 fires when moving from Etsy', () => {
    const r = analyzeChannelMigration(base({ fromChannel: 'etsy', addedSalesPerMonth: 3 }));
    expect(r.flags.map(f => f.code)).toContain('CM-02');
  });

  it('CM-02 does not fire when moving from Ravelry', () => {
    const r = analyzeChannelMigration(base({ fromChannel: 'ravelry', addedSalesPerMonth: 3 }));
    expect(r.flags.map(f => f.code)).not.toContain('CM-02');
  });

  it('CM-03 fires when payback exceeds a year', () => {
    const r = analyzeChannelMigration(base({ addedSalesPerMonth: 1, migrationHours: 6 }));
    expect(r.flags.map(f => f.code)).toContain('CM-03');
  });

  it('CM-04 fires when copying to a channel with zero reviews', () => {
    const r = analyzeChannelMigration(base({ salesPerMonth: 8, reviewsOnTarget: 0, addedSalesPerMonth: 3 }));
    expect(r.flags.map(f => f.code)).toContain('CM-04');
  });

  it('CM-05 fires when the spread exceeds $1 on a copy', () => {
    // Default from-channel is Etsy; copy gains need target net - Etsy net > $1.
    // At $7 Etsy→LoveCrafts/LoveCrafts-style spread is small, so push price up.
    const r = analyzeChannelMigration(base({ price: 15, addedSalesPerMonth: 3 }));
    expect(r.flags.map(f => f.code)).toContain('CM-05');
  });

  it('CM-06 fires at high ads share', () => {
    const r = analyzeChannelMigration(base({ adsShare: 0.4 }));
    expect(r.flags.map(f => f.code)).toContain('CM-06');
  });

  it('CM-07 fires when not already on own site', () => {
    const r = analyzeChannelMigration(base({ fromChannel: 'etsy', addedSalesPerMonth: 3, price: 7 }));
    expect(r.flags.map(f => f.code)).toContain('CM-07');
    expect(r.flags.find(f => f.code === 'CM-07')!.detail.includes('95-97%')).toBe(true);
  });

  it('CM-08 fires when migration hours are 6+', () => {
    const r = analyzeChannelMigration(base({ migrationHours: 6 }));
    expect(r.flags.map(f => f.code)).toContain('CM-08');
  });

  it('flags carry unique codes and non-empty details', () => {
    const r = analyzeChannelMigration(base({ addedSalesPerMonth: 3, migrationHours: 7, adsShare: 0.4 }));
    const codes = r.flags.map(f => f.code);
    expect(new Set(codes).size).toBe(codes.length);
    r.flags.forEach(f => {
      expect(f.title.length).toBeGreaterThan(0);
      expect(f.detail.length).toBeGreaterThan(40);
    });
  });
});

describe('verdict ladder', () => {
  it('stays put when nothing is added and spread is small', () => {
    // The ladder stays put when the best alternative nets less than $0.50 more per sale.
    // From LoveCrafts ($6.66 at $7) the best alternative is Ravelry ($6.25) — a −$0.41
    // spread — so with 0 added sales no move is worth the hours or the social-proof reset.
    const r = analyzeChannelMigration(base({ addedSalesPerMonth: 0, fromChannel: 'lovecrafts' }));
    expect(r.verdict).toContain('Stay put');
  });

  it('recommends copying when added sales are healthy and payback is short', () => {
    const r = analyzeChannelMigration(base({ addedSalesPerMonth: 6 }));
    expect(r.verdict.toLowerCase()).toContain('copy');
    expect(r.paybackMonths).toBeLessThan(3);
    expect(r.verdictNote).toContain('$');
  });

  it('defers to batching when payback exceeds a year', () => {
    const r = analyzeChannelMigration(base({ addedSalesPerMonth: 1, migrationHours: 8 }));
    expect(r.verdict.toLowerCase()).toContain('batch');
  });

  it('verdictNote is always non-empty', () => {
    for (const added of [0, 1, 3, 6]) {
      const r = analyzeChannelMigration(base({ addedSalesPerMonth: added }));
      expect(r.verdictNote.length).toBeGreaterThan(50);
    }
  });
});

describe('fmt$', () => {
  it('formats USD with two decimals', () => {
    expect(fmt$(5.15)).toBe('$5.15');
    expect(fmt$(1200)).toBe('$1,200.00');
  });
});

describe('channel table completeness', () => {
  it('covers 5 channels: Etsy, Ravelry, LoveCrafts, own site, Pattern by Etsy', () => {
    expect(Object.keys(CHANNELS)).toHaveLength(5);
    expect(CHANNELS.etsy.listingLifetimeMo).toBe(4);
    expect(CHANNELS.ravelry.listingFee).toBe(0);
  });
});

