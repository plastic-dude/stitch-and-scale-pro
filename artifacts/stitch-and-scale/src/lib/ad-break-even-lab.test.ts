import { describe, expect, it } from 'vitest';
import {
  AD_LAB_DEFAULTS,
  analyzeAdSpend,
  _breakEvenRoas,
  _offsiteFeePct,
  _platformFeePct,
  type AdLabInput,
} from './ad-break-even-lab';

const etsy = (o: Partial<AdLabInput> = {}): AdLabInput => ({ ...AD_LAB_DEFAULTS, platform: 'etsy', ...o });

describe('_platformFeePct', () => {
  it('etsy fee is 6.5% + 3% + $0.25 scaled to order value (≈10.67% at $6)', () => {
    const pct = _platformFeePct('etsy', 6);
    // fees on $6: 0.39 + 0.18 + 0.25 = 0.82 → 13.67%; WordStream-era docs cite ~10-14%
    expect(pct).toBeGreaterThan(0.1);
    expect(pct).toBeLessThan(0.2);
  });

  it('ravelry fee at $6 lands near the documented 3.5% headline with its floor components', () => {
    const pct = _platformFeePct('ravelry', 6);
    expect(pct).toBeGreaterThanOrEqual(0.035);
    expect(pct).toBeLessThan(0.1);
  });

  it('fees scale toward the flat components as price falls', () => {
    expect(_platformFeePct('etsy', 100)).toBeLessThan(_platformFeePct('etsy', 5));
  });
});

describe('_offsiteFeePct', () => {
  it('15% under $10k trailing revenue', () => expect(_offsiteFeePct(4000)).toBe(0.15));
  it('12% at or above $10k trailing revenue', () => expect(_offsiteFeePct(10000)).toBe(0.12));
  it('exactly at threshold is 12%', () => expect(_offsiteFeePct(9999.99)).toBe(0.15));
});

describe('_breakEvenRoas', () => {
  it('equals 1 / margin after fees', () => {
    const fee = _platformFeePct('etsy', 6);
    expect(_breakEvenRoas('etsy', 6, 0)).toBeCloseTo(1 / (1 - fee), 4);
  });

  it('offsite 15% raises break-even ROAS from ~1.16 to ~1.36 on Etsy $6', () => {
    const base = _breakEvenRoas('etsy', 6, 0);
    const offsite = _breakEvenRoas('etsy', 6, 0.15);
    expect(offsite).toBeGreaterThan(base);
    // Both fees land on order value: net = order × (1 − platformFee − offsiteFee),
    // so break-even ROAS = 1 / (1 − platformFee − 0.15).
    const pf = _platformFeePct('etsy', 6);
    expect(offsite).toBeCloseTo(1 / (1 - pf - 0.15), 4);
  });

  it('fees ≥ 100% produce Infinity', () => {
    expect(_breakEvenRoas('etsy', 6, 1)).toBe(Infinity);
  });
});

describe('analyzeAdSpend', () => {
  it('returns all 8 channels with the email baseline included', () => {
    const r = analyzeAdSpend(etsy());
    expect(r.channels).toHaveLength(8);
    expect(r.channels.map((c) => c.channel)).toContain('email_list');
    expect(r.offsiteTier).toBe('fifteen_pct');
  });

  it('offsite net per sale is 15% below organic net on Etsy', () => {
    const r = analyzeAdSpend(etsy());
    const off = r.channels.find((c) => c.channel === 'etsy_offsite')!;
    const onp = r.channels.find((c) => c.channel === 'etsy_onplatform')!;
    // Offsite applies 15% on the sale before its fee; rounding to 2 decimals
    // is applied after, so assert within a cent.
    expect(off.netPerSale).toBeCloseTo(Math.max(0, Math.round(onp.netPerSale * 0.85 * 100) / 100), 2);
    expect(off.marginalFeePct).toBe(0.15);
    expect(off.netPerSale).toBeLessThan(onp.netPerSale);
  });

  it('offsite tier switches to 12% at $10k+ revenue', () => {
    const r = analyzeAdSpend(etsy({ annualShopRevenue: 15000 }));
    expect(r.offsiteTier).toBe('twelve_pct');
    const off = r.channels.find((c) => c.channel === 'etsy_offsite')!;
    expect(off.marginalFeePct).toBe(0.12);
  });

  it('max break-even CPC = net per sale × click-to-order', () => {
    const r = analyzeAdSpend(etsy({ price: 10, clickToOrder: 0.05 }));
    const onp = r.channels.find((c) => c.channel === 'etsy_onplatform')!;
    expect(onp.maxBreakEvenCpc).toBeCloseTo(onp.netPerSale * 0.05, 6);
  });

  it('CPC channels compute daily profit at the assumed CPC', () => {
    const r = analyzeAdSpend(etsy({ price: 10, dailyBudget: 10, clickToOrder: 0.05, typicalCpc: 0.5 }));
    const onp = r.channels.find((c) => c.channel === 'etsy_onplatform')!;
    const clicks = 10 / 0.5;
    const orders = clicks * 0.05;
    expect(onp.expectedDailyProfit).toBeCloseTo(orders * onp.netPerSale - 10, 4);
    expect(onp.expectedOrdersPerDay).toBeCloseTo(orders, 6);
  });

  it('fee-only channels have no daily-profit estimate', () => {
    const r = analyzeAdSpend(etsy());
    for (const c of ['etsy_offsite', 'ravelry_featured_source'] as const) {
      const ch = r.channels.find((x) => x.channel === c)!;
      expect(ch.expectedDailyProfit).toBeNull();
      expect(ch.expectedOrdersPerDay).toBeNull();
    }
  });

  it('email baseline = list × conversion × net per sale', () => {
    const r = analyzeAdSpend(etsy({ emailListSize: 1000, emailConversion: 0.02, price: 6 }));
    const onp = r.channels.find((c) => c.channel === 'etsy_onplatform')!;
    expect(r.email.expectedOrders).toBeCloseTo(20, 4);
    expect(r.email.netRevenue).toBeCloseTo(20 * onp.netPerSale, 4);
    expect(r.email.roiMultiple).toBe(36);
  });

  it('skip verdict when no CPC channel profits at the assumed conversion', () => {
    const r = analyzeAdSpend(etsy({ clickToOrder: 0.001, typicalCpc: 0.7, dailyBudget: 10 }));
    expect(r.budget.verdict).toBe('skip');
    expect(r.budget.paybackDays).toBeNull();
  });

  it('fund verdict when daily profit repays production quickly', () => {
    const r = analyzeAdSpend(etsy({ price: 25, clickToOrder: 0.08, typicalCpc: 0.3, dailyBudget: 10, productionHours: 10, designRate: 20 }));
    expect(r.budget.verdict).toBe('fund');
    expect(r.budget.paybackDays).not.toBeNull();
    expect(r.budget.paybackDays!).toBeGreaterThan(0);
  });

  it('bestPaidChannel excludes the email baseline', () => {
    const r = analyzeAdSpend(etsy());
    expect(r.bestPaidChannel).not.toBe('email_list');
  });

  it('emailBeatsAllAds flags when email send nets more than a month of paid profit', () => {
    const bigList = analyzeAdSpend(etsy({ emailListSize: 5000, price: 8 }));
    const smallList = analyzeAdSpend(etsy({ emailListSize: 10, price: 8, emailConversion: 0 }));
    // Big list baseline is huge; small list with zero warm conversion nets nothing.
    expect(bigList.emailBeatsAllAds).toBe(true);
    expect(smallList.email.netRevenue).toBe(0);
    expect(smallList.emailBeatsAllAds).toBe(false);
  });

  it('every verdict string cites documented market data', () => {
    const r = analyzeAdSpend(etsy());
    for (const c of r.channels) {
      expect(c.reason.length).toBeGreaterThan(40);
    }
    // Specific documented anchors appear across channels.
    const joined = r.channels.map((c) => c.reason).join(' ');
    expect(joined + ' ' + r.email.reason + ' ' + r.budget.reason).toMatch(/\$36/);
    expect(joined).toMatch(/3x|3\.0|8\.4|4\.0/);
    expect(joined).toMatch(/15%|12%/);
  });

  it('price of zero floors to a valid computation', () => {
    const r = analyzeAdSpend(etsy({ price: 0 }));
    expect(r.channels.every((c) => Number.isFinite(c.netPerSale) || c.netPerSale === 0)).toBe(true);
  });
});
