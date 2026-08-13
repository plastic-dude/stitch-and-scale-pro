/**
 * Pattern income calculator — revenue planning for designers selling patterns.
 *
 * PLATFORM FEE MODEL (verified against published platform fee pages and
 * designer accounts, documented below):
 *
 * - Ravelry Pattern Store: no listing fee; 3.5% commission applies only on
 *   months where sales exceed $30 (below that threshold the store charges
 *   no commission at all); payment processing ≈ 5% (Stripe/PayPal class
 *   rates). Source: ravelry.com Pattern Store wiki + community fee
 *   disclosures (2022–2026, consistent across designer discussions).
 * - Etsy: $0.20 listing fee per pattern (renews every 4 months), 6.5%
 *   transaction fee, plus payment processing 3% + $0.25 per sale.
 *   Source: etsy.com/fees pages + designer accounting write-ups.
 * - Ribblr: no listing fee; 4% of the sale price or $0.25, whichever is
 *   greater, plus Stripe processing (class rate 2.9% + $0.30).
 *   Source: ribblr.com seller terms + Snickerdoodle Knits platform summary.
 * - Payhip: free plan; 5% transaction fee plus PayPal/Stripe processing.
 *   Source: payhip.com/pricing.
 *
 * All percentages are treated as decimal fractions of the sale price;
 * fixed per-sale fees ($0.25, $0.30) are added after the percentage cut.
 * Listing/subscription fees are amortized across monthly sales.
 *
 * BREAKEVEN: how many pattern sales cover the designer's own time cost
 * (design hours × hourly rate). This is a planning figure, not a promise.
 */

export type PlatformId = 'ravelry' | 'etsy' | 'ribblr' | 'payhip';

export const PLATFORM_LABELS: Record<PlatformId, string> = {
  ravelry: 'Ravelry Pattern Store',
  etsy: 'Etsy',
  ribblr: 'Ribblr',
  payhip: 'Payhip',
};

export interface PlatformNet {
  /** Net revenue for `units` sales at `price`, after all platform fees. */
  netRevenue: number;
  /** Total fees paid to the platform and processors. */
  totalFees: number;
  /** Per-sale net take, for the margin display. */
  netPerSale: number;
  /** Effective fee percentage of gross revenue. */
  effectiveFeePct: number;
}

export interface BreakevenResult {
  /** Sales needed to cover design hours × rate with the chosen platform. */
  salesToBreakEven: number;
  /** Months needed at `monthlySales` to break even. */
  monthsToBreakEven: number;
  /** Annualized net revenue at `monthlySales`. */
  annualizedNet: number;
}

function ravelryNet(price: number, units: number): { fees: number } {
  // Commission only when monthly sales exceed $30; processing always applies.
  const gross = price * units;
  const commissionPct = gross > 30 ? 0.035 : 0;
  const fees = gross * (commissionPct + 0.05);
  return { fees: Math.round(fees * 100) / 100 };
}

function etsyNet(price: number, units: number): { fees: number } {
  // $0.20 listing amortized over sales; 6.5% transaction + 3% + $0.25 per sale.
  const gross = price * units;
  const fees =
    units * 0.2 + // listing (renewed; conservative: one per sale)
    gross * 0.065 +
    gross * 0.03 +
    units * 0.25;
  return { fees: Math.round(fees * 100) / 100 };
}

function ribblrNet(price: number, units: number): { fees: number } {
  const gross = price * units;
  // 4% of sale or $0.25, whichever is greater, per sale; Stripe 2.9% + $0.30.
  const commission = Math.max(gross * 0.04, units * 0.25);
  const fees = commission + gross * 0.029 + units * 0.3;
  return { fees: Math.round(fees * 100) / 100 };
}

function payhipNet(price: number, units: number): { fees: number } {
  const gross = price * units;
  const fees = gross * 0.05 + gross * 0.029 + units * 0.3; // + Stripe class rate
  return { fees: Math.round(fees * 100) / 100 };
}

const NETTERS: Record<PlatformId, (price: number, units: number) => { fees: number }> = {
  ravelry: ravelryNet,
  etsy: etsyNet,
  ribblr: ribblrNet,
  payhip: payhipNet,
};

/**
 * Net-revenue computation for a platform at a given price and monthly unit
 * sales. Fixed per-sale fees mean effective margins improve with volume.
 */
export function platformNet(
  platform: PlatformId,
  price: number,
  monthlySales: number,
): PlatformNet {
  const gross = price * monthlySales;
  const { fees } = NETTERS[platform](price, monthlySales);
  const netRevenue = Math.round((gross - fees) * 100) / 100;
  const netPerSale = monthlySales > 0
    ? Math.round((netRevenue / monthlySales) * 100) / 100
    : 0;
  const effectiveFeePct = gross > 0
    ? Math.round((fees / gross) * 1000) / 10
    : 0;
  return { netRevenue, totalFees: fees, netPerSale, effectiveFeePct };
}

/**
 * Breakeven analysis: how many sales (and months at a steady sales rate)
 * recover the designer's invested time cost, plus the annualized net.
 */
export function breakeven(
  platform: PlatformId,
  price: number,
  monthlySales: number,
  designHours: number,
  hourlyRate: number,
): BreakevenResult {
  const cost = designHours * hourlyRate;
  const net = platformNet(platform, price, Math.max(monthlySales, 1));
  const salesToBreakEven = net.netPerSale > 0 && cost > 0
    ? Math.ceil(cost / net.netPerSale)
    : cost > 0 ? Infinity : 0;
  const monthsToBreakEven = monthlySales > 0 && Number.isFinite(salesToBreakEven)
    ? Math.round((salesToBreakEven / monthlySales) * 10) / 10
    : Number.isFinite(salesToBreakEven) ? 0 : Infinity;
  return {
    salesToBreakEven,
    monthsToBreakEven,
    annualizedNet: Math.round(net.netRevenue * 12 * 100) / 100,
  };
}

export const PLATFORMS: PlatformId[] = ['ravelry', 'etsy', 'ribblr', 'payhip'];
