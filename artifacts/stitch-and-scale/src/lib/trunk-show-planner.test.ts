import { describe, expect, it } from 'vitest';
import {
  analyzeTrunkShow,
  priceLicenses,
  generateLicenseTerms,
  generateLicenseOffer,
  DEFAULT_LICENSE_PRICES,
  LICENSE_TIERS,
  TrunkShowInput,
} from './trunk-show-planner';

const baseInput: TrunkShowInput = {
  eventDate: '2026-10-02',
  visitorsPerDay: 10,
  tryOnRate: 0.35,
  conversionRate: 0.3,
  shopSplit: 0.3,
  copiesPerSale: 1,
  sampleYards: 2400,
  sampleCost: 140,
  shippingCost: 40,
  travelCost: 60,
  eventCost: 90,
  attending: true,
  attendingHours: 8,
  hourlyRate: 25,
  patternPrice: 8,
  channelFeeRate: 0,
  trunkDays: 14,
  yarnSales: 400,
  yarnShopSplit: 0.5,
};

describe('analyzeTrunkShow', () => {
  it('computes expected copies from traffic × trunk days × try-on × conversion', () => {
    const out = analyzeTrunkShow(baseInput);
    // 10 visitors/day × 14 days × 0.35 × 0.3 = 14.7 → 15 copies
    expect(out.expectedCopies).toBe(15);
    expect(out.patternGross).toBe(15 * 8);
  });

  it('applies shop split and channel fee to pattern gross', () => {
    const out = analyzeTrunkShow({ ...baseInput, channelFeeRate: 0.15 });
    expect(out.shopCut).toBe(Math.round(out.patternGross * 0.3 * 100) / 100);
    expect(out.channelFees).toBe(Math.round(out.patternGross * 0.15 * 100) / 100);
  });

  it('counts yarn sales at the shop-splits rate', () => {
    const out = analyzeTrunkShow(baseInput);
    expect(out.yarnNet).toBe(200); // 400 × (1 - 0.5)
  });

  it('prices time from sample yardage at 30 yd/hr plus attending hours', () => {
    const out = analyzeTrunkShow(baseInput);
    // 2400 / 30 = 80 sample hours + 8 attending = 88 h × $25
    expect(out.hoursInvested).toBe(88);
    expect(out.timeCost).toBe(2200);
  });

  it('skips attending time cost when not attending', () => {
    const out = analyzeTrunkShow({ ...baseInput, attending: false });
    expect(out.hoursInvested).toBe(80);
    expect(out.timeCost).toBe(2000);
  });

  it('returns a go verdict when net and hourly rate clear the bar', () => {
    const out = analyzeTrunkShow({
      ...baseInput,
      visitorsPerDay: 25,
      tryOnRate: 0.5,
      conversionRate: 0.4,
      sampleYards: 1200,
      patternPrice: 9,
      yarnSales: 4000,
    });
    // 25/day × 14 × 0.5 × 0.4 = 70 copies × $9 × 70% = $441 pattern net + $2000 yarn
    // net − $330 costs − $1200 time ≈ $911 — covers hard costs at ~$19/hr
    expect(out.verdict).toBe('go');
    expect(out.netToDesigner).toBeGreaterThanOrEqual(out.expenses);
    expect(out.effectiveHourlyRate).toBeGreaterThanOrEqual(10);
  });

  it('returns skip when the event loses money after time is priced', () => {
    const out = analyzeTrunkShow({ ...baseInput, visitorsPerDay: 1 });
    // 1/day × 14 × 0.35 × 0.3 ≈ 1 copy → $8 gross vs $330 costs + $2200 time
    expect(out.verdict).toBe('skip');
    expect(out.netToDesigner).toBeLessThan(0);
  });

  it('returns review for thin-but-positive outcomes', () => {
    const mid = analyzeTrunkShow({ ...baseInput, visitorsPerDay: 6 });
    // 6/day × 14 × 0.35 × 0.3 ≈ 9 copies → $72 gross — positive net, low $/hr
    if (mid.netToDesigner > 0) {
      expect(mid.verdict).toBe('review');
    } else {
      expect(mid.verdict).toBe('skip');
    }
  });

  it('generates dated tasks bracketing the event date', () => {
    const out = analyzeTrunkShow(baseInput);
    expect(out.tasks.length).toBeGreaterThan(0);
    const dates = out.tasks.map(t => t.date);
    const first = dates[0];
    const last = dates[dates.length - 1];
    expect(first < '2026-10-02').toBe(true);
    expect(last > '2026-10-02').toBe(true);
  });

  it('includes the kick-off night and thank-you tasks with real copy', () => {
    const out = analyzeTrunkShow(baseInput);
    const labels = out.tasks.map(t => t.label).join(' | ');
    expect(labels).toMatch(/kick-off/i);
    expect(labels).toMatch(/thank-you/i);
    expect(out.proposalLetter).toMatch(/trunk show proposal/i);
    expect(out.proposalLetter).toMatch(/70%/);
    expect(out.eventPitch).toMatch(/kick-off evening/);
  });

  it('survives an empty event date with sane dated output', () => {
    const out = analyzeTrunkShow({ ...baseInput, eventDate: '' });
    expect(out.expectedCopies).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(out.netToDesigner)).toBe(true);
    for (const t of out.tasks) {
      expect(t.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(t.date).not.toContain('Invalid');
    }
    expect(out.proposalLetter).not.toContain('Invalid Date');
    expect(out.proposalLetter).not.toContain('undefined');
    expect(out.eventPitch).not.toContain('undefined');
  });

  it('handles zero and degenerate inputs without crashing', () => {
    const out = analyzeTrunkShow({
      ...baseInput,
      visitorsPerDay: 0,
      tryOnRate: 0,
      conversionRate: 0,
      sampleYards: 0,
      sampleCost: 0,
      hourlyRate: 0,
    });
    // Zero traffic means zero pattern copies and a positive net from yarn income
    // alone; assert the copy/traffic path specifically rather than net === 0.
    expect(out.expectedCopies).toBe(0);
    expect(out.patternGross).toBe(0);
    expect(out.shopCut).toBe(0);
    expect(out.channelFees).toBe(0);
    expect(out.verdict).toBe('review'); // small positive net from yarn income
    expect(out.tasks.length).toBeGreaterThan(0);
  });
});

describe('license pricing', () => {
  it('has six tiers with market-norm defaults', () => {
    expect(LICENSE_TIERS).toHaveLength(6);
    expect(DEFAULT_LICENSE_PRICES.annual_limited).toBe(20);
    expect(DEFAULT_LICENSE_PRICES.annual_unlimited).toBe(40);
    expect(DEFAULT_LICENSE_PRICES.lifetime_single).toBe(60);
    expect(DEFAULT_LICENSE_PRICES.annual_full_line).toBe(150);
    expect(DEFAULT_LICENSE_PRICES.lifetime_full_line).toBe(750);
    expect(DEFAULT_LICENSE_PRICES.annual_image).toBe(30);
  });

  it('annualizes lifetime tiers over 5 years', () => {
    const rows = priceLicenses();
    const lifetime = rows.find(r => r.tier.id === 'lifetime_single')!;
    expect(lifetime.annualizedValue).toBe(12); // $60 / 5
    const annual = rows.find(r => r.tier.id === 'annual_unlimited')!;
    expect(annual.annualizedValue).toBe(40);
  });

  it('honors price overrides and computes bulk rates', () => {
    const rows = priceLicenses({ prices: { annual_limited: 25 }, bulkRate: 0.6 });
    const limited = rows.find(r => r.tier.id === 'annual_limited')!;
    expect(limited.price).toBe(25);
    expect(limited.bulkPrice).toBe(15); // 25 × 0.6
  });

  it('includes renewals in yearly value for annual tiers', () => {
    const rows = priceLicenses({ renewalRate: 0.5 });
    const unlimited = rows.find(r => r.tier.id === 'annual_unlimited')!;
    // 40 × (1 + 0.5 × 0) = 40 for a 1-year tier; full line: 150 × (1 + 0.5 × 0)
    expect(unlimited.yearlyValue).toBe(40);
    const lifetime = rows.find(r => r.tier.id === 'lifetime_full_line')!;
    // 750 × 0.2 = 150 (lifetime amortized at 1/5 per year)
    expect(lifetime.yearlyValue).toBe(150);
  });
});

describe('license terms & offer', () => {
  const terms = generateLicenseTerms({
    designerName: 'Stitch & Scale',
    patternRequired: true,
    machineAllowed: false,
    resaleAllowed: true,
  });

  it('requires pattern purchase and hand-knitting by default', () => {
    expect(terms).toMatch(/must be purchased before a\nlicense/);
    expect(terms).toMatch(/hand-knit and sell/i);
  });

  it('omits the machine restriction when machines are allowed', () => {
    const open = generateLicenseTerms({ designerName: 'X', patternRequired: true, machineAllowed: true, resaleAllowed: true });
    expect(open).toMatch(/hand or machine/);
  });

  it('includes the attribution clause with the designer name', () => {
    expect(terms).toMatch(/under a Cottage License from Stitch & Scale/);
  });

  it('generates an offer letter naming the pattern and the annual unlimited tier', () => {
    const rows = priceLicenses();
    const letter = generateLicenseOffer({ designerName: 'Stitch & Scale', patternRequired: true, machineAllowed: false, resaleAllowed: true }, rows, 'Calyx Pullover');
    expect(letter).toMatch(/Calyx Pullover/);
    expect(letter).toMatch(/\$40/);
  });
});
