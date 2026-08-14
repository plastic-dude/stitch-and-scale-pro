/**
 * CHK-030 — Platform Mix Planner
 *
 * Where to list patterns beyond the home store, and what each stream
 * actually nets. Session-31 research: Ravelry Jan-2019 census (72.3% of
 * 10,059 sellers earned <$50; $1,000 revenue → $35 Ravelry + $130 PayPal
 * before production costs), LoveCrafts ($40–1,300/mo band carries an extra
 * selling fee), KnitPicks IDP (85% of list), Etsy 15% offsite-ads fee,
 * Makerist lucrative for FR/DE-language patterns, Ribblr auto-translation
 * + VAT handling, Payhip free tier with VAT remittance.
 *
 * The flaw we're fixing: designers list on platforms on gut feel and never
 * model per-platform net against their volume, tax handling, and the
 * maintenance hours each listing costs.
 */
import { platformNet, PLATFORM_LABELS, type PlatformId } from './pattern-income-calculator';

export type Verdict = 'go' | 'maybe' | 'no';

export interface MixPlatform {
  platform: PlatformId;
  /** Share of monthly sales routed to this platform (0-100, decimals allowed). */
  salesSharePct: number;
  /** Enabled for the mix (false = considering, currently not listed). */
  enabled: boolean;
}

export interface PlatformMixInput {
  platforms: MixPlatform[];
  /** Total monthly pattern sales across all platforms. */
  monthlySales: number;
  /** Average pattern price in USD. */
  avgPrice: number;
  /** Designer's hourly design rate, $/hr — opportunity cost of listing maintenance. */
  designRate: number;
  /** Hours per month available for platform marketing/maintenance. */
  marketingHoursAvailable: number;
  /** Share of sales going to EU/UK/AU customers (VAT/GST relevance). */
  internationalSalesPct: number;
  /** True if a platform's 15% offsite-ads fee applies to the shop (Etsy). */
  subjectToOffsiteAds: boolean;
}

export interface MixResult {
  perPlatform: {
    platform: PlatformId;
    sales: number;
    gross: number;
    fees: number;
    netRevenue: number;
    netPerSale: number;
    effectiveFeePct: number;
    maintenanceHours: number;
    maintenanceCost: number;
    netAfterMaintenance: number;
    internationalSales: number;
    vatValueNote: string;
    offsiteAdsCost: number;
    enabled: boolean;
  }[];
  totalGross: number;
  totalFees: number;
  totalNet: number;
  totalMaintenanceCost: number;
  totalNetAfterMaintenance: number;
  singlePlatformRisk: boolean;
  vatBurden: boolean;
  marketingCapacityWarning: boolean;
  watchOut: { flag: string; items: string[] };
  recommendation: string;
  /** Total monthly sales routed across enabled platforms. */
  totalSalesRouted: number;
}

export const MIX_PLATFORM_LABELS: Record<PlatformId, string> = {
  ravelry: 'Ravelry',
  etsy: 'Etsy',
  ribblr: 'Ribblr',
  payhip: 'Payhip',
};

export const DEFAULT_PLATFORMS: MixPlatform[] = [
  { platform: 'ravelry', salesSharePct: 70, enabled: true },
  { platform: 'etsy', salesSharePct: 15, enabled: true },
  { platform: 'ribblr', salesSharePct: 5, enabled: true },
  { platform: 'payhip', salesSharePct: 10, enabled: false },
];

export const DEFAULT_MIX: PlatformMixInput = {
  platforms: DEFAULT_PLATFORMS.map((p) => ({ ...p })),
  monthlySales: 40,
  avgPrice: 8,
  designRate: 25,
  marketingHoursAvailable: 10,
  internationalSalesPct: 20,
  subjectToOffsiteAds: true,
};

// Maintenance hours per month per active listing (re-listing, SEO, questions,
// promos). Etsy is heavier (SEO churn, messages, offsite ads management).
const MAINTENANCE_HOURS: Record<PlatformId, number> = {
  ravelry: 1.0,
  etsy: 2.5,
  ribblr: 1.0,
  payhip: 1.5,
};

// Platforms that handle VAT/GST collection & remittance themselves (Craft
// Industry Alliance): LoveCrafts, KnitPicks, Makerist, Payhip, Ribblr, Etsy.
// Ravelry sellers in the EU remit their own VAT above thresholds.
const HANDLES_VAT: Record<PlatformId, boolean> = {
  ravelry: false,
  etsy: true,
  ribblr: true,
  payhip: true,
};

const VAT_COMPLIANCE_VALUE_MONTHLY = 25;

function makeZeroEntry(platform: PlatformId, internationalSalesPct: number) {
  return {
    platform,
    sales: 0,
    gross: 0,
    fees: 0,
    netRevenue: 0,
    netPerSale: 0,
    effectiveFeePct: 0,
    maintenanceHours: MAINTENANCE_HOURS[platform] ?? 1.5,
    maintenanceCost: 0,
    netAfterMaintenance: 0,
    internationalSales: 0,
    vatValueNote: HANDLES_VAT[platform]
      ? `Handles VAT/GST for you — worth ~${VAT_COMPLIANCE_VALUE_MONTHLY}/mo of admin.`
      : 'VAT/GST remittance is your responsibility for international sales.',
    offsiteAdsCost: 0,
    enabled: false,
  };
}

export function analyzePlatformMix(input: PlatformMixInput): MixResult {

  const enabledPlatforms = input.platforms.filter((p) => p.enabled);
  const enabled = enabledPlatforms.length;

  const totalMarketingHours = enabledPlatforms.reduce(
    (s, p) => s + (MAINTENANCE_HOURS[p.platform] ?? 1.5), 0);
  const capacityExceeded = totalMarketingHours > input.marketingHoursAvailable;

  const enabledWithShare = enabledPlatforms.reduce((s, p) => s + p.salesSharePct, 0);
  // Sales are routed by share among enabled platforms; if shares don't sum to
  // 100, normalize against enabled share.

  let totalSalesRouted = 0;
  const perPlatform = input.platforms.map((p) => {
    // Disabled platforms route nothing — their intended share redistributes
    // across enabled platforms by share ratio, and any leftover (shares that
    // belonged to disabled platforms or sums over/under 100) spreads evenly.
    if (!p.enabled) {
      return makeZeroEntry(p.platform, input.internationalSalesPct);
    }
    const sales = Math.round(
      (p.salesSharePct / enabledWithShare) * input.monthlySales * 10) / 10;
    const net = platformNet(p.platform, input.avgPrice, Math.max(sales, 0));
    const gross = Math.round(input.avgPrice * sales * 100) / 100;
    const maintenanceHours = MAINTENANCE_HOURS[p.platform] ?? 1.5;
    const maintenanceCost = p.enabled
      ? Math.round(maintenanceHours * input.designRate * 100) / 100
      : 0;
    const internationalSales = Math.round(
      sales * (input.internationalSalesPct / 100) * 100) / 100;
    const offsiteAdsCost =
      p.platform === 'etsy' && input.subjectToOffsiteAds && p.enabled
        ? Math.round(gross * 0.15 * 100) / 100
        : 0;
    const netRevenue = Math.round((net.netRevenue - offsiteAdsCost) * 100) / 100;
    const netPerSale = sales > 0
      ? Math.round((netRevenue / sales) * 100) / 100
      : 0;
    const netAfterMaintenance = Math.round(
      (netRevenue - maintenanceCost) * 100) / 100;
    const vatValueNote = HANDLES_VAT[p.platform]
      ? `Handles VAT/GST for you — worth ~${VAT_COMPLIANCE_VALUE_MONTHLY}/mo of admin.`
      : 'VAT/GST remittance is your responsibility for international sales.';
    return {
      platform: p.platform,
      sales,
      gross,
      fees: net.totalFees,
      netRevenue,
      netPerSale,
      effectiveFeePct: net.effectiveFeePct,
      maintenanceHours,
      maintenanceCost,
      netAfterMaintenance,
      internationalSales,
      vatValueNote,
      offsiteAdsCost,
      enabled: p.enabled,
    };
  });

  const enabledResults = perPlatform.filter((r) => r.enabled);
  const totalGross = Math.round(
    enabledResults.reduce((s, r) => s + r.gross, 0) * 100) / 100;
  const totalFees = Math.round(
    enabledResults.reduce((s, r) => s + r.fees + r.offsiteAdsCost, 0) * 100) / 100;
  const totalNet = Math.round(
    enabledResults.reduce((s, r) => s + r.netRevenue, 0) * 100) / 100;
  const totalMaintenanceCost = Math.round(
    enabledResults.reduce((s, r) => s + r.maintenanceCost, 0) * 100) / 100;
  const totalNetAfterMaintenance = totalNet - totalMaintenanceCost;
  totalSalesRouted = Math.round(
    enabledResults.reduce((s, r) => s + r.sales, 0) * 10) / 10;

  // --- Watch-outs
  const items: string[] = [];
  const singlePlatformRisk = enabled <= 1;
  const vatBurden = enabledResults.some((r) => !HANDLES_VAT[r.platform] &&
    r.internationalSales > 0 && input.internationalSalesPct > 10);
  if (singlePlatformRisk) {
    items.push(`All eggs in one basket: ${enabled} active platform. Ravelry removed sellers' stores for TOS disputes; platforms change algorithms and fees (Etsy added a 15% offsite-ads fee). ${enabledPlatforms.length > 1 ? 'Spread at least some volume to a second store.' : 'Enable a second platform.'}`);
  }
  if (vatBurden) {
    const selfServe = enabledResults.filter((r) => !HANDLES_VAT[r.platform]);
    items.push(`${selfServe.map((r) => PLATFORM_LABELS[r.platform]).join(' and ')} leave${selfServe.length === 1 ? 's' : ''} VAT/GST remittance on you for EU/UK/AU buyers — that's quarterly admin work and late-filing risk. Routing international volume through VAT-handling platforms buys back ~${VAT_COMPLIANCE_VALUE_MONTHLY}/mo of admin value.`);
  }
  if (input.subjectToOffsiteAds) {
    const etsyEntry = enabledResults.find((r) => r.platform === 'etsy');
    if (etsyEntry && etsyEntry.offsiteAdsCost > 0) {
      items.push(`Etsy offsite ads are a 15% haircut on Etsy revenue once sales cross $10k/yr (mandatory) — your Etsy stream nets ${
        Math.round((etsyEntry.offsiteAdsCost / Math.max(etsyEntry.gross, 1)) * 1000) / 10}% less than the fee table suggests.`);
    }
  }
  if (capacityExceeded) {
    items.push(`${totalMarketingHours} maintenance hours/month exceeds your ${input.marketingHoursAvailable}h marketing capacity — every listing you can't market is a listing that underperforms. The top designers' real edge is marketing, not design.`);
  }
  const weakStreams = enabledResults.filter((r) => r.netAfterMaintenance < 0);
  if (weakStreams.length > 0) {
    items.push(`${weakStreams.map((r) => PLATFORM_LABELS[r.platform]).join(' and ')} ${weakStreams.length === 1 ? 'is' : 'are'} negative after maintenance at this volume — keep listing only if discovery value matters, or grow sales to make it pay.`);
  }

  // --- Recommendation: best enabled mix + strongest dormant platform.
  // A dormant platform's potential is evaluated at its intended sales share
  // (what it would take if enabled and given its slice of the pie).
  const bestEnabled = [...enabledResults].sort((a, b) =>
    b.netAfterMaintenance - a.netAfterMaintenance)[0];
  const dormant = perPlatform
    .filter((r) => !r.enabled)
    .map((r) => {
      const full = analyzePlatformMix({
        ...input,
        platforms: input.platforms.map((p) =>
          p.platform === r.platform ? { ...p, enabled: true } : p),
      });
      // Its entry in the enabled mix: the platform itself, plus its new
      // share slice (its routed sales at the enabled mix).
      const entry = { ...full.perPlatform.find((pp) => pp.platform === r.platform)! };
      return entry;
    });
  const bestDormant = [...dormant].sort((a, b) => b.netAfterMaintenance - a.netAfterMaintenance)[0];
  let recommendation = `At this volume, ${bestEnabled
    ? `${PLATFORM_LABELS[bestEnabled.platform]} is your workhorse at ${fmt$(bestEnabled.netAfterMaintenance)}/mo after fees and maintenance`
    : 'enable a platform first — a store with no presence earns nothing'}.`;
  if (bestDormant && bestDormant.netAfterMaintenance > 0) {
    recommendation += ` Enabling ${PLATFORM_LABELS[bestDormant.platform]} adds ~${fmt$(bestDormant.netAfterMaintenance)}/mo — ${bestDormant.vatValueNote}`;
  } else if (bestDormant && bestDormant.sales > 0) {
    recommendation += ` ${PLATFORM_LABELS[bestDormant.platform]} would cost ~${fmt$(
      -bestDormant.netAfterMaintenance)}/mo to maintain at your current rate — skip until sales grow.`;
  }

  return {
    perPlatform,
    totalGross,
    totalFees,
    totalNet,
    totalMaintenanceCost,
    totalNetAfterMaintenance,
    singlePlatformRisk,
    vatBurden,
    marketingCapacityWarning: capacityExceeded,
    watchOut: { flag: 'platform-mix', items },
    recommendation,
    totalSalesRouted,
  };
}

function fmt$(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
