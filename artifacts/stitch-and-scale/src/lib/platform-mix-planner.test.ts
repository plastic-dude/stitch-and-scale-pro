import { describe, expect, it } from 'vitest';
import {
  analyzePlatformMix,
  DEFAULT_MIX,
  DEFAULT_PLATFORMS,
  type PlatformMixInput,
} from './platform-mix-planner';

function mix(patch: Partial<PlatformMixInput> = {}): ReturnType<typeof analyzePlatformMix> {
  return analyzePlatformMix({ ...DEFAULT_MIX, ...patch });
}

describe('analyzePlatformMix', () => {
  it('defaults produce positive net on the primary platforms', () => {
    const r = mix();
    const rav = r.perPlatform.find((p) => p.platform === 'ravelry')!;
    const etsy = r.perPlatform.find((p) => p.platform === 'etsy')!;
    expect(rav.enabled).toBe(true);
    expect(rav.netAfterMaintenance).toBeGreaterThan(0);
    // Ravelry routes 70/90 of enabled share of 40 sales = 31.1 units at $8
    expect(rav.sales).toBe(31.1);
    expect(rav.gross).toBe(248.8);
    // At 40 total monthly sales, small secondary platforms can't cover
    // their maintenance hours — that's exactly what the watch-outs flag.
    expect(etsy.netAfterMaintenance).toBeLessThan(0);
  });

  it('totals reconcile: gross = fees + net (before maintenance)', () => {
    const r = mix();
    expect(r.totalGross).toBe(320);
    // gross − totalFees (= platform fees + Etsy offsite ads) = net revenue.
    expect(Math.abs(r.totalGross - r.totalFees - r.totalNet)).toBeLessThan(0.02);
    expect(r.totalNetAfterMaintenance).toBe(r.totalNet - r.totalMaintenanceCost);
  });

  it('dormant platforms carry no maintenance cost and no routed sales', () => {
    const r = mix();
    const payhip = r.perPlatform.find((p) => p.platform === 'payhip')!;
    expect(payhip.enabled).toBe(false);
    expect(payhip.sales).toBe(0);
    expect(payhip.maintenanceCost).toBe(0);
    expect(payhip.netAfterMaintenance).toBe(0);
  });

  it('disabled shares get redistributed proportionally among enabled platforms', () => {
    // Only ravelry enabled (70 share); its share normalizes to 100% of sales
    const r = mix({
      platforms: [
        { platform: 'ravelry', salesSharePct: 70, enabled: true },
        { platform: 'etsy', salesSharePct: 15, enabled: false },
        { platform: 'ribblr', salesSharePct: 5, enabled: false },
        { platform: 'payhip', salesSharePct: 10, enabled: false },
      ],
    });
    const rav = r.perPlatform.find((p) => p.platform === 'ravelry')!;
    expect(rav.sales).toBe(40);
    expect(r.totalSalesRouted).toBe(40);
  });

  it('singlePlatformRisk fires when only one platform is enabled', () => {
    const r = mix({
      platforms: [
        { platform: 'ravelry', salesSharePct: 100, enabled: true },
        ...DEFAULT_PLATFORMS.slice(1).map((p) => ({ ...p, enabled: false })),
      ],
    });
    expect(r.singlePlatformRisk).toBe(true);
    expect(r.watchOut.items.some((i) => i.includes('one basket'))).toBe(true);
  });

  it('no singlePlatformRisk with two or more enabled platforms', () => {
    const r = mix();
    expect(r.singlePlatformRisk).toBe(false);
  });

  it('vatBurden fires when ravelry carries international volume', () => {
    const r = mix({ internationalSalesPct: 25 });
    expect(r.vatBurden).toBe(true);
    expect(r.watchOut.items.some((i) => i.includes('VAT/GST'))).toBe(true);
  });

  it('no vatBurden when VAT is handled or intl share is tiny', () => {
    // Keep defaults (intl 20%) but move all ravelry volume off: ravelry dormant
    const r = mix({
      internationalSalesPct: 25,
      platforms: [
        { platform: 'ravelry', salesSharePct: 0, enabled: false },
        { platform: 'etsy', salesSharePct: 55, enabled: true },
        { platform: 'ribblr', salesSharePct: 20, enabled: true },
        { platform: 'payhip', salesSharePct: 25, enabled: true },
      ],
    });
    expect(r.vatBurden).toBe(false);
  });

  it('offsite-ads 15% applies only to Etsy and only when subject', () => {
    const rOn = mix({ subjectToOffsiteAds: true });
    const rOff = mix({ subjectToOffsiteAds: false });
    const etsyOn = rOn.perPlatform.find((p) => p.platform === 'etsy')!;
    const etsyOff = rOff.perPlatform.find((p) => p.platform === 'etsy')!;
    // Etsy routes 15/90 of enabled share of 40 = 6.7 sales at $8 →
    // gross $53.6 → 15% = $8.04
    expect(etsyOn.offsiteAdsCost).toBe(8.04);
    expect(etsyOff.offsiteAdsCost).toBe(0);
  });

  it('marketingCapacityWarning fires when maintenance hours exceed capacity', () => {
    const r = mix({ marketingHoursAvailable: 2 });
    expect(r.marketingCapacityWarning).toBe(true);
    expect(r.watchOut.items.some((i) => i.includes('marketing capacity'))).toBe(true);
  });

  it('negative streams get flagged in watch-outs', () => {
    // Tiny volume on Etsy: 2% share of 10 sales at $6 → 0.2 sales/mo; 2.5h × $40 = $100 maintenance
    const r = mix({
      monthlySales: 10,
      avgPrice: 6,
      designRate: 40,
      marketingHoursAvailable: 20,
      subjectToOffsiteAds: false,
      platforms: [
        { platform: 'ravelry', salesSharePct: 10, enabled: true },
        { platform: 'etsy', salesSharePct: 2, enabled: true },
        { platform: 'ribblr', salesSharePct: 1, enabled: true },
        { platform: 'payhip', salesSharePct: 1, enabled: true },
      ],
    });
    const etsy = r.perPlatform.find((p) => p.platform === 'etsy')!;
    expect(etsy.netAfterMaintenance).toBeLessThan(0);
    expect(r.watchOut.items.some((i) => i.includes('negative after maintenance'))).toBe(true);
  });

  it('recommendation names the dormant platform when it adds money', () => {
    const r = mix({ marketingHoursAvailable: 20, subjectToOffsiteAds: false });
    expect(r.recommendation.includes('Payhip')).toBe(true);
  });

  it('recommendation warns to skip dormant platform when it loses money', () => {
    const r = mix({
      monthlySales: 10,
      designRate: 40,
      marketingHoursAvailable: 20,
      subjectToOffsiteAds: false,
      // Give the dormant platform an explicit intended share so it would
      // route sales if enabled.
      platforms: [
        { platform: 'ravelry', salesSharePct: 80, enabled: true },
        { platform: 'etsy', salesSharePct: 10, enabled: true },
        { platform: 'ribblr', salesSharePct: 0, enabled: true },
        { platform: 'payhip', salesSharePct: 10, enabled: false },
      ],
    });
    const payhip = r.perPlatform.find((p) => p.platform === 'payhip')!;
    expect(payhip.sales).toBe(0);
    expect(payhip.netAfterMaintenance).toBe(0);
    // Enabled at its 10% share: 1 sale at $6 → ~$5.0 net − $37.50 maint < 0
    expect(r.recommendation.toLowerCase().includes('skip')).toBe(true);
  });

  it('effectiveFeePct reflects fixed fees improving with volume', () => {
    const low = mix({ monthlySales: 100, avgPrice: 8, subjectToOffsiteAds: false, marketingHoursAvailable: 20 });
    const high = mix({ monthlySales: 1000, avgPrice: 8, subjectToOffsiteAds: false, marketingHoursAvailable: 20 });
    const lowFees = low.totalFees / low.totalGross;
    const highFees = high.totalFees / high.totalGross;
    expect(highFees).toBeLessThan(lowFees);
  });

  it('enabling all platforms redistributes sales across all four', () => {
    const r = mix({
      marketingHoursAvailable: 20,
      platforms: DEFAULT_PLATFORMS.map((p) => ({ ...p, enabled: true })),
    });
    const allEnabled = r.perPlatform.every((p) => p.enabled);
    expect(allEnabled).toBe(true);
    // Each platform gets at least some routed sales (shares 70/15/5/10
    // sum to 100, so each keeps its exact share)
    r.perPlatform.forEach((p) => expect(p.sales).toBeGreaterThan(0));
    expect(r.totalSalesRouted).toBe(40);
    expect(r.perPlatform.find((p) => p.platform === 'ravelry')!.sales).toBe(28);
    expect(r.perPlatform.find((p) => p.platform === 'payhip')!.sales).toBe(4);
  });

  it('zero monthly sales does not crash and nets to zero', () => {
    const r = mix({ monthlySales: 0 });
    expect(r.totalGross).toBe(0);
    expect(r.totalNet).toBe(0);
    // Maintenance still costs real money even at zero sales, so a store
    // that isn't selling anything is actively bleeding.
    expect(r.totalNetAfterMaintenance).toBeLessThan(0);
    expect(r.totalMaintenanceCost).toBeGreaterThan(0);
    expect(r.watchOut.items.some((i) => i.includes('negative after maintenance'))).toBe(true);
  });
});
