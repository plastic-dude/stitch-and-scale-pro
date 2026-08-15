/**
 * Fee Registry — single source of truth for marketplace take rates (CHK-088).
 *
 * Defect class being retired: fee figures were copy-pasted into every lab
 * comment and constant, drifting apart (e.g. "15% (Ravelry/Etsy)" vs the
 * audited 3.5% Ravelry in the Take-Rate War Lab, "Ravelry nets ~95%" vs the
 * real 96.5-97.1% depending on price and PayPal processing). S250.
 *
 * Rules:
 *   1. Any lab that talks about platform fees imports from here. Hard-coded
 *      fee numbers in other modules are defects — cite this registry.
 *   2. Every figure is sourced from the audited Marketplace Take-Rate Lab
 *      engine (marketplace-takerate-lab.ts, verified Aug 2026).
 *   3. Rates change with price and volume thresholds — consumers must pick
 *      the variant that matches their scenario (see takeRateFor).
 */

export type FeeChannel = 'etsy' | 'ravelry' | 'lovecrafts' | 'ribblr' | 'payhip' | 'own-site';

export const FEE_REGISTRY_LABELS: Record<FeeChannel, string> = {
  etsy: 'Etsy',
  ravelry: 'Ravelry',
  lovecrafts: 'LoveCrafts',
  ribblr: 'Ribblr',
  payhip: 'Payhip (free)',
  'own-site': 'Own site (Stripe)',
};

/** Verified Aug 2026, from the Take-Rate War Lab (marketplace-takerate-lab.ts). */
export interface FeeSchedule {
  /** Platform percentage component (0 when none). */
  platformPct: number;
  /** Platform fixed component ($ per sale, 0 when none). */
  platformFixed: number;
  /** Payment-processing percentage (PayPal or Stripe, pass-through). */
  processingPct: number;
  /** Payment-processing fixed ($ per sale). */
  processingFixed: number;
  /** Volume threshold where the platform percentage activates ($/mo). */
  commissionFloor: number;
  /** Volume threshold where the platform percentage is removed ($/mo).
   *  Use Infinity when there is no ceiling (Etsy, Ribblr, Payhip, own site). */
  commissionCeiling: number;

  /** Human summary of the schedule for display. */
  summary: string;
  /** Effective platform-only take % at the given price (commission active). */
  effectivePlatformPctAtPrice: (price: number) => number;
}

export const FEE_SCHEDULES: Record<FeeChannel, FeeSchedule> = {
  etsy: {
    // 6.5% transaction + 0.21% regulatory + 3% + $0.25 processing; $0.20
    // listing auto-renew per sale. No threshold; Offsite Ads (15%, 12%
    // above $10k/yr) applies only to a share of sales and is modeled by the
    // Take-Rate War Lab, not folded into the base schedule.
    platformPct: 0.065 + 0.0021,
    platformFixed: 0.2,
    processingPct: 0.03,
    processingFixed: 0.25,
    commissionFloor: 0,
    commissionCeiling: Infinity,
    summary: '6.71% + $0.45/sale (listing + transaction + regulatory + processing)',
    effectivePlatformPctAtPrice: (price: number) =>
      ((price * (0.065 + 0.0021) + 0.2) / Math.max(0.01, price)) * 100,
  },
  ravelry: {
    // 3.5% commission only between $30 and $1,500/mo of sales; PayPal-only
    // processing pass-through 2.9% + $0.30. Below $30/mo or above $1,500/mo
    // the commission is $0 — cents-only.
    platformPct: 0.035,
    platformFixed: 0,
    processingPct: 0.029,
    processingFixed: 0.3,
    commissionFloor: 30,
    commissionCeiling: 1500,
    summary: '3.5% between $30–$1,500/mo (else $0) + 2.9% + $0.30 PayPal',
    effectivePlatformPctAtPrice: (price: number) =>
      ((price * 0.035) / Math.max(0.01, price)) * 100,
  },
  lovecrafts: {
    // 2% + $0.20 base; extra 5% of month total when $40 ≤ revenue < $1,500.
    platformPct: 0.02,
    platformFixed: 0.2,
    processingPct: 0,
    processingFixed: 0,
    commissionFloor: 40,
    commissionCeiling: 1500,
    summary: '2% + $0.20 (+5% of monthly revenue when $40–$1,500/mo)',
    effectivePlatformPctAtPrice: (price: number) =>
      ((price * 0.02 + 0.2) / Math.max(0.01, price)) * 100,
  },
  ribblr: {
    // 4% or $0.25 minimum — the floor is the silent killer on cheap patterns
    // ($3.84 median ≈ 6.5% real rate; $1.99 ≈ 12.6%). Plus Stripe 2.9%+$0.30.
    platformPct: 0.04,
    platformFixed: 0.25,
    processingPct: 0.029,
    processingFixed: 0.3,
    commissionFloor: 0,
    commissionCeiling: Infinity,
    summary: '4% or $0.25 minimum/sale + 2.9% + $0.30 Stripe',
    effectivePlatformPctAtPrice: (price: number) =>
      (Math.max(price * 0.04, 0.25) / Math.max(0.01, price)) * 100,
  },
  payhip: {
    // Free plan: 5% platform + Stripe/PayPal 2.9% + $0.30.
    platformPct: 0.05,
    platformFixed: 0,
    processingPct: 0.029,
    processingFixed: 0.3,
    commissionFloor: 0,
    commissionCeiling: Infinity,
    summary: '5% + 2.9% + $0.30 (free plan; paid plans reduce the 5%)',
    effectivePlatformPctAtPrice: (price: number) =>
      ((price * 0.05) / Math.max(0.01, price)) * 100,
  },
  'own-site': {
    // No platform cut — Stripe processing only. You own the customer list.
    platformPct: 0,
    platformFixed: 0,
    processingPct: 0.029,
    processingFixed: 0.3,
    commissionFloor: 0,
    commissionCeiling: Infinity,
    summary: '0% platform — 2.9% + $0.30 Stripe only',
    effectivePlatformPctAtPrice: () => 0,
  },
};

/**
 * Total effective take % (platform + processing) for a channel at a price and
 * monthly revenue. Returns 0 for zero price.
 */
export function takeRateFor(
  channel: FeeChannel,
  price: number,
  monthlyRevenue: number = Infinity,
): number {
  const s = FEE_SCHEDULES[channel];
  const p = Math.max(0.01, price);
  // Ravelry-style threshold channels: below the floor or above the ceiling,
  // the platform commission (pct and its companion fixed fee) is $0;
  // cents-only payment processing remains.
  const commissionActive = commissionActiveFor(s, monthlyRevenue);
  const platformPct = commissionActive ? s.platformPct : 0;
  const platformFixed = commissionActive ? s.platformFixed : 0;
  const totalFees =
    p * platformPct + platformFixed + p * s.processingPct + s.processingFixed;
  return (totalFees / p) * 100;
}

/** Net per sale on a channel at a price (commission active when within band). */
export function netPerSaleFor(
  channel: FeeChannel,
  price: number,
  monthlyRevenue: number = Infinity,
): number {
  const s = FEE_SCHEDULES[channel];
  const p = Math.max(0.01, price);
  const commissionActive = commissionActiveFor(s, monthlyRevenue);
  const platformPct = commissionActive ? s.platformPct : 0;
  const platformFixed = commissionActive ? s.platformFixed : 0;
  return p - (p * platformPct + platformFixed + p * s.processingPct + s.processingFixed);
}

/**
 * Whether the platform commission applies. Schedules with commissionCeiling
 * === Infinity have no ceiling at all (Etsy, Ribblr, Payhip, own site) —
 * an unguarded `revenue < Infinity` would always be false and silently
 * switch every commission off (the S251-class Infinity trap).
 */
function commissionActiveFor(s: FeeSchedule, monthlyRevenue: number): boolean {
  if (monthlyRevenue < s.commissionFloor) {
    return false;
  }
  if (s.commissionCeiling === Infinity) {
    return true;
  }
  return monthlyRevenue < s.commissionCeiling;
}

/** Display string: "96.5%" style, for a channel/price/monthly-revenue. */
export function fmtTakePct(n: number): string {
  return n.toFixed(1) + '%';
}
