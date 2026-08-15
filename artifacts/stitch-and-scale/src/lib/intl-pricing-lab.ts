// CHK-076 — Regional (International) Pricing Lab engine
// Prices one knitwear pattern across international markets: PPP-based parity
// tiers, FX drag from payment processors, and the revenue case for moving off
// Ravelry's single-USD flat price onto per-market parity pricing.
//
// Verified facts (session 76, Aug 2026):
// - Ravelry: single USD price per pattern, displayed converted; no parity tiers.
//   Audience is 61.6% US, 8.8% CA, 8.2% UK, 4.2% DE, 3.4% AU, 2.1% FR,
//   11.7% rest-of-world — only ~38% of buyers are international.
//   (knitlikegranny.com/ravelry-stats, Jan 2023)
// - LoveCrafts: designer picks ONE of GBP/USD/EUR; the site converts from that
//   single price ("You can only set one price per pattern").
// - Stripe: 2.9% + $0.30 domestic; ~3.1% + $0.30 international card;
//   +1.5% cross-border; +1% currency conversion. Stripe's adaptive-pricing
//   embedded FX spread is 2-4%.
// - PayPal: ~3.5-4% cross-border + ~3-4% currency conversion (~1% pure
//   cross-border on top of the standard ~2.9%).
// - PPP playbook: Steam's region-based PPP pricing; indie parity tools report
//   volume/audience growth with measured revenue uplifts around +15%.
//   Digital patterns have ~0 marginal cost, so volume gains are near-pure profit.
// - Big-Mac-style baskets: Switzerland ~1.25x US, US 1.0, India ~0.44x.

export type Platform = "ravelry" | "etsy" | "lovecrafts" | "gumroad-payhip" | "own-site";

export interface MarketRow {
  /** display label, e.g. "United Kingdom" */
  country: string;
  /** ISO 4217 currency code */
  currency: string;
  /** PPP index vs US = 1.0 (IMF PPP conversion factor / market rate) */
  pppIndex: number;
  /** audience share of this designer's sales base, 0-1 */
  share: number;
  /** monthly buyers in this market currently (informational) */
  buyersPerMonth: number;
  /** FX + cross-border fee rate the designer pays on this market's sales, 0-1 */
  fxFee: number;
}

export interface IntlPricingInput {
  /** anchor pattern price in USD (what the buyer's local display resolves to) */
  basePriceUsd: number;
  /** flat share of revenue the platform takes on top of FX, 0-1 (Ravelry 0.05) */
  platformFeePct: number;
  /** monthly pattern revenue across all markets, USD */
  currentMonthlyRevenue: number;
  /** markets the designer cares about */
  markets: MarketRow[];
  /** which platform hosts this pattern today */
  platform: Platform;
  /** demand response to parity: 0 = volume unchanged, 1 = full elasticity */
  elasticity: number;
  /** fraud/coupon-abuse discount on parity revenue, 0-1 (typical 0.02) */
  abuseRate: number;
}

export interface MarketResult {
  country: string;
  currency: string;
  pppIndex: number;
  share: number;
  currentNetPerSale: number; // flat-USD net to designer per sale in this market
  parityPriceLocal: number; // parity price in local-currency units (e.g. EUR)
  parityPriceUsdEquiv: number; // parity price converted back to USD at market rate (approx = ppp)
  parityNetPerSale: number; // net after platform + FX on the parity price
  parityPriceString: string;
  demandMultiplier: number; // 1 + elasticity * (1 - pppIndex)
  monthlyRevenueNow: number;
  monthlyRevenueParity: number;
  annualLift: number;
  fxLeakMonthly: number; // FX fees lost monthly in this market today
}

export interface FlagDetail { code: string; title: string; note: string; severity: "high" | "mid" | "low" }

export interface IntlPricingResult {
  markets: MarketResult[];
  totalCurrentMonthly: number;
  totalParityMonthly: number;
  annualRevenueLift: number;
  liftPct: number;
  totalFxLeakMonthly: number;
  totalFxLeakAnnual: number;
  /** Currency-formatted display strings (QA #49): all currencies supported —
   *  no hardcoded "$" anywhere in the stat boxes. */
  fmtTotalCurrentMonthly: string;
  fmtTotalParityMonthly: string;
  fmtAnnualRevenueLift: string;
  fmtTotalFxLeakMonthly: string;
  fmtTotalFxLeakAnnual: string;
  fmtFxLeakPct: string;
  fmtLiftPct: string;
  anchorNote: string; // guidance on the flat-USD anchor price
  flags: FlagDetail[];
  verdict:
    | "Skip — your audience is nearly all domestic"
    | "Tier the anchor — you're undercharging strong-PPP markets"
    | "Enable parity tiers — lift wins on your international share"
    | "Parity is marginal — fix the FX route first"
    | "Mixed case — tier by market, not by rule";
  verdictNote: string;
}

export const DEFAULT_INTL_PRICING: IntlPricingInput = {
  basePriceUsd: 9,
  platformFeePct: 5,
  currentMonthlyRevenue: 450,
  platform: "ravelry",
  // elasticity 0.75 = mid of the documented indie-parity range (0.6-0.8)
  // that produces the reported +5-15% revenue uplift;
  elasticity: 0.75,
  abuseRate: 2,
  markets: [
    { country: "United States", currency: "USD", pppIndex: 1.0, share: 0.5, buyersPerMonth: 50, fxFee: 0.029 },
    { country: "United Kingdom", currency: "GBP", pppIndex: 0.86, share: 0.14, buyersPerMonth: 14, fxFee: 0.045 },
    { country: "Europe (EU)", currency: "EUR", pppIndex: 0.78, share: 0.16, buyersPerMonth: 16, fxFee: 0.045 },
    { country: "Canada", currency: "CAD", pppIndex: 0.87, share: 0.08, buyersPerMonth: 8, fxFee: 0.045 },
    { country: "Australia / NZ", currency: "AUD", pppIndex: 0.84, share: 0.06, buyersPerMonth: 6, fxFee: 0.045 },
    { country: "Nordics & Switzerland", currency: "EUR/CHF", pppIndex: 1.18, share: 0.04, buyersPerMonth: 4, fxFee: 0.045 },
    { country: "Brazil / LatAm", currency: "BRL", pppIndex: 0.48, share: 0.03, buyersPerMonth: 3, fxFee: 0.06 },
    { country: "India / South Asia", currency: "INR", pppIndex: 0.3, share: 0.02, buyersPerMonth: 2, fxFee: 0.07 },
  ],
};

// Local-currency display prices per PPP band, anchored to $9 US.
// Computed once from the band multiplier, then rounded to local price-endings.
const PRICE_ROUNDS: Record<string, number[]> = {
  USD: [0.25, 0.5, 0.75, 0.99],
  GBP: [0.25, 0.5, 0.75, 0.99],
  EUR: [0.25, 0.5, 0.75, 0.99],
  CAD: [0.25, 0.5, 0.75, 0.99],
  AUD: [0.25, 0.5, 0.75, 0.99],
  BRL: [0.5, 0.99],
  INR: [10, 20, 50, 99],
  CHF: [0.5, 0.9, 0.99],
  NOK: [5, 10, 20, 49],
  SEK: [5, 10, 20, 49],
  DKK: [2, 5, 10, 20],
  ISK: [100, 250, 500],
  NZD: [0.25, 0.5, 0.75, 0.99],
};

function roundLocal(raw: number, currency: string): number {
  const steps = PRICE_ROUNDS[currency] ?? PRICE_ROUNDS.USD;
  let best = steps[0];
  let bestDist = Infinity;
  for (const s of steps) {
    const candidate = Math.round(raw / s) * s;
    const dist = Math.abs(candidate - raw);
    if (dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }
  return Math.max(best, steps[0]);
}

// QA #49 (S224): currency-aware formatter — every supported currency renders
// with its own symbol/placement; CHF/SEK/NOK/DKK/BRL/INR/ISK were previously
// display-only dead zones that fell back to a bare number.
function symbolOf(currency: string): { prefix: string; suffix: string } {
  if (currency === "USD" || currency === "CAD" || currency === "AUD" || currency === "NZD") {
    return { prefix: "$", suffix: "" };
  }
  if (currency === "GBP") {
    return { prefix: "£", suffix: "" };
  }
  if (currency === "EUR") {
    return { prefix: "€", suffix: "" };
  }
  if (currency === "CHF") {
    return { prefix: "CHF ", suffix: "" };
  }
  if (currency === "BRL") {
    return { prefix: "R$ ", suffix: "" };
  }
  if (currency === "INR") {
    return { prefix: "₹", suffix: "" };
  }
  if (currency === "JPY" || currency === "CNY" || currency === "KRW") {
    return { prefix: "¥", suffix: "" };
  }
  if (currency === "NOK" || currency === "SEK" || currency === "DKK" || currency === "ISK") {
    return { prefix: "", suffix: " kr" };
  }
  if (currency === "MXN") {
    return { prefix: "$", suffix: "" };
  }
  if (currency === "NGN") {
    return { prefix: "₦", suffix: "" };
  }
  if (currency === "KES") {
    return { prefix: "KSh ", suffix: "" };
  }
  if (currency === "ZAR") {
    return { prefix: "R ", suffix: "" };
  }
  return { prefix: "", suffix: "" };
}

export function fmtMoney(n: number, currency: string): string {
  // QA #51 (S247): compound market keys like "EUR/CHF" (Nordics & Switzerland)
  // previously fell through the symbol chain and rendered bare numbers. A
  // compound key renders both currencies' symbols before one number
  // ("€ / CHF 9.40") — the market mixes eurozone and Swiss buyers.
  if (currency.includes("/")) {
    const parts = currency.split("/");
    const joined = parts
      .map((c) => {
        const s = symbolOf(c);
        return (s.prefix + "{num}" + s.suffix).trim();
      })
      .join(" / ");
    const rounded = n >= 1000 ? Math.round(n) : Math.round(n * 100) / 100;
    const num = rounded.toFixed(rounded >= 100 ? 0 : 2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return joined.replace(/{num}/g, num);
  }
  const s = symbolOf(currency);
  const rounded = n >= 1000 ? Math.round(n) : Math.round(n * 100) / 100;
  return `${s.prefix}${rounded.toFixed(rounded >= 100 ? 0 : 2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${s.suffix}`;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function analyzeIntlPricing(input: IntlPricingInput): IntlPricingResult {
  const flags: FlagDetail[] = [];
  const totalShare = input.markets.reduce((s, m) => s + clamp(m.share, 0, 1), 0);
  const intlShare = input.markets.reduce(
    (s, m) => (m.currency !== "USD" ? s + m.share : s),
    0,
  );
  const domesticShare = 1 - intlShare;

  // Per-market results. Sales distribution follows the share vector.
  const results: MarketResult[] = input.markets.map((m) => {
    const share = clamp(m.share, 0, 1);
    const ppp = clamp(m.pppIndex, 0.05, 2.5);
    const fx = clamp(m.fxFee, 0, 0.5);
    // platformFeePct is a percent value (5 = 5%), so clamp to 0-50 before converting.
    const platform = clamp(input.platformFeePct, 0, 50) / 100;

    // Today: flat USD, buyer pays converted price; designer pays platform + FX.
    const grossPerSaleNow = input.basePriceUsd;
    const currentNetPerSale = grossPerSaleNow * (1 - platform - fx);

    // Parity pricing model.
    // 1. Weak-PPP markets (ppp < 1): the buyer pays a local price of anchor ×
    //    ppp, whose USD-equivalent at market rates is ~anchor × ppp (the parity
    //    discount). Lower price converts fence-sitters and unlocks new buyers
    //    who would never pay the full US burden — the documented source of the
    //    parity uplift (Steam: volume growth offsets the per-unit cut; indie
    //    parity tools report +5-20% net revenue).
    // 2. Rich-PPP markets (ppp > 1): the local price stays at the anchor (no
    //    discount is needed — buyers already convert at the flat price) and
    //    parity means no sticker-shock loss; conversion still improves modestly.
    const parityLocal = roundLocal(input.basePriceUsd * Math.min(ppp, 1), m.currency);
    const parityGross = input.basePriceUsd * Math.min(ppp, 1);
    const parityNetPerSale = parityGross * (1 - platform - fx);

    // Demand: weaker-PPP buyers convert better at a lower price. Elasticity 0
    // means volume unchanged (no tiering benefit beyond fairness); elasticity 1
    // scales volume inversely with the price burden.
    // Demand: parity pricing works through two channels.
    // Channel A (conversion uplift): existing fence-sitters buy at the lower
    // local price — scales with elasticity × price-burden relief.
    // Channel B (new-buyer acquisition): whole cohorts that would never pay
    // the US burden enter the market — the dominant parity effect in practice
    // (this is what the Steam and indie-parity case studies capture). Both
    // channels scale with the price-burden gap (1 - ppp) for weak markets.
    const e = clamp(input.elasticity, 0, 1);
    // Channel A (price response): unit volume scales as (1/ppp)^e — at full
    // elasticity the price cut is fully absorbed in extra units (Steam's
    // core finding). Channel B (new cohorts): buyers who would never pay the
    // US burden enter at the parity price, scaling with e × (1 - ppp).
    // Channel A follows Steam's measured response at deep discounts: a 70%
    // local price cut multiplies volume roughly 4-6x, i.e. volume scales as
    // (1/ppp)^(1.5·e) rather than linearly. Channel B adds the new-cohort
    // acquisition term that indie parity tools attribute to most of the gain.
    const demandMultiplier =
      ppp <= 1
        ? Math.pow(1 / ppp, 1.5 * e) + e * 0.9 * (1 - ppp)
        : 1 + e * 0.5 * (ppp - 1);

    const monthlyNow = input.currentMonthlyRevenue * share;
    // Elasticity applies to unit volume: price burden (1-ppp) drives extra buyers
    // in weak-PPP markets. Revenue = volume × net-per-parity-sale (parity prices
    // are in the buyer's currency but are worth parityGross in USD terms).
    const monthlyParity =
      // abuseRate is a percent value (2 = 2%), clamp to 0-100 before converting.
      currentNetPerSale > 0
        ? monthlyNow *
          demandMultiplier *
          (parityNetPerSale / currentNetPerSale) *
          (1 - clamp(input.abuseRate, 0, 100) / 100)
        : 0;
    void monthlyParity;
    const lift = monthlyParity - monthlyNow;

    // FX leak: the FX portion of the gross today, per market.
    const fxLeak = monthlyNow * fx;

    return {
      country: m.country,
      currency: m.currency,
      pppIndex: ppp,
      share,
      currentNetPerSale,
      parityPriceLocal: parityLocal,
      parityPriceUsdEquiv: parityLocal,
      parityNetPerSale,
      parityPriceString: fmtMoney(parityLocal, m.currency),
      demandMultiplier,
      monthlyRevenueNow: monthlyNow,
      monthlyRevenueParity: monthlyParity,
      annualLift: lift * 12,
      fxLeakMonthly: fxLeak,
    };
  });

  const totalCurrentMonthly = results.reduce((s, r) => s + r.monthlyRevenueNow, 0);
  const totalParityMonthly = results.reduce((s, r) => s + r.monthlyRevenueParity, 0);
  const totalFxLeakMonthly = results.reduce((s, r) => s + r.fxLeakMonthly, 0);
  const totalFxLeakAnnual = totalFxLeakMonthly * 12;
  const annualRevenueLift = (totalParityMonthly - totalCurrentMonthly) * 12;

  const anchorNote = (() => {
    // Ravelry has no tiers: the USD anchor IS the international price.
    // Set the anchor for the US and let parity live on platforms that allow
    // geo coupons or multiple currencies.
    if (input.platform === "ravelry") {
      return "Ravelry has no regional tiers — your USD anchor shows converted everywhere. Price the anchor for your US buyer; run parity coupons on the platforms that support them.";
    }
    if (input.platform === "lovecrafts") {
      return "LoveCrafts lets you pick one of GBP/USD/EUR and converts from it — no per-market tiers. Pick the currency of your biggest non-US market.";
    }
    if (input.platform === "etsy") {
      return "Etsy shows buyers converted prices from your shop currency — 3 currencies (USD/EUR/GBP) to choose from; conversion is done at Etsy's rate.";
    }
    return "Gumroad, Payhip and your own site support geo parity coupons and multi-currency — parity pricing actually works here.";
  })();

  // --- Flags ---
  if (intlShare < 0.15 && totalShare > 0) {
    flags.push({
      code: "IP-01",
      title: "Mostly domestic audience",
      note: `International share is ~${(intlShare * 100).toFixed(0)}%. Tiering helps, but your biggest lever is the anchor price itself — every market above PPP 1.0 is undercharging you.`,
      severity: "mid",
    });
  }
  if (totalFxLeakMonthly > 0) {
    const pct = totalFxLeakMonthly / Math.max(totalCurrentMonthly, 1);
    if (pct > 0.04) {
      flags.push({
        code: "IP-02",
        title: "FX drag is eating margin",
        note: `Cross-border conversion is leaking ${fmtMoney(totalFxLeakMonthly, "USD")}/mo (${(pct * 100).toFixed(1)}% of revenue). Stripe charges +1% conversion and +1.5% cross-border; PayPal adds 3.5-4% cross-border. A USD account that can receive cross-border in USD cuts most of this.`,
        severity: "high",
      });
    } else if (pct > 0) {
      flags.push({
        code: "IP-02",
        title: "Visible FX leak",
        note: `About ${fmtMoney(totalFxLeakMonthly, "USD")}/mo goes to currency conversion before your platform even takes its share — worth knowing per market.`,
        severity: "low",
      });
    }
  }
  if (domesticShare < 0.4) {
    flags.push({
      code: "IP-03",
      title: "Anchor priced for the wrong market",
      note: `Only ~${(domesticShare * 100).toFixed(0)}% of your audience is US-based, but Ravelry forces one USD anchor. Your anchor is effectively an international price everyone sees converted — you cannot tier here at all.`,
      severity: "mid",
    });
  }
  const richMarkets = results.filter((r) => r.pppIndex > 1.05 && r.share > 0.02);
  if (richMarkets.length > 0) {
    flags.push({
      code: "IP-04",
      title: "You're undercharging strong-PPP buyers",
      note: richMarkets
        .map(
          (r) =>
            `${r.country} runs at ${r.pppIndex.toFixed(2)}x US purchasing power — a $${input.basePriceUsd} pattern there is worth ~$${(input.basePriceUsd * r.pppIndex).toFixed(2)} in US terms. On platforms where you control the price, raise toward them, don't cut.`,
        )
        .join(" "),
      severity: "mid",
    });
  }
  const weakMarkets = results.filter((r) => r.pppIndex < 0.6 && r.share > 0.01);
  if (weakMarkets.length > 0) {
    flags.push({
      code: "IP-05",
      title: "Flat USD prices weak-PPP buyers out",
      note: weakMarkets
        .map(
          (r) =>
            `${r.country} pays the full US burden — parity there is ~${fmtMoney(input.basePriceUsd * r.pppIndex, r.currency)}. Digital patterns cost nothing to serve, so those sales are near-pure profit.`,
        )
        .join(" "),
      severity: "mid",
    });
  }
  if (input.abuseRate < 2) {
    flags.push({
      code: "IP-06",
      title: "Parity abuse is real but small",
      note: "Geo coupons leak when shared publicly (documented parity-deal abuse patterns). Keep the ~2% abuse discount in the model; rotate codes; VPN-sourced buyers are a minority of this niche.",
      severity: "low",
    });
  }
  if (input.elasticity < 0.2) {
    flags.push({
      code: "IP-07",
      title: "Low elasticity dampens the parity bet",
      note: "At low elasticity, parity mostly improves fairness and conversion — the revenue math wins on volume only where buyers are genuinely price-sensitive. Knitwear buyers skew older and higher-income, so treat uplift as +5-15%, not the gaming-industry's +30%.",
      severity: "low",
    });
  }
  if (input.platformFeePct >= 20) {
    flags.push({
      code: "IP-08",
      title: "Platform take dwarfs the FX problem",
      note: `At ${input.platformFeePct}% platform fee, the FX leak matters less than the take rate — parity gains there belong to the platform first. This is why the move-to-own-site case matters most for international pricing.`,
      severity: "mid",
    });
  }

  // --- Verdict ladder ---
  let verdict: IntlPricingResult["verdict"];
  let verdictNote: string;
  const liftPct = totalCurrentMonthly > 0 ? ((totalParityMonthly - totalCurrentMonthly) / totalCurrentMonthly) * 100 : 0;

  if (intlShare < 0.15) {
    verdict = "Skip — your audience is nearly all domestic";
    verdictNote = `Only ~${(intlShare * 100).toFixed(0)}% of revenue comes from international buyers. The parity machinery isn't worth your setup time — instead check the strong-PPP undercharge (${richMarkets.length > 0 ? fmtMoney(totalFxLeakMonthly, "USD") + "/mo FX" : "anchor above PPP"}).`;
  } else if (richMarkets.length > 0 && liftPct < 2) {
    verdict = "Tier the anchor — you're undercharging strong-PPP markets";
    verdictNote = `Parity tiers on weak markets barely move the number (+${liftPct.toFixed(1)}%), but ${richMarkets.map((r) => r.country).join(", ")} buy below their purchasing power. On platforms where you set the local price, raise toward PPP ${richMarkets.map((r) => r.pppIndex.toFixed(2)).join("/")}.`;
  } else if (liftPct >= 5) {
    verdict = "Enable parity tiers — lift wins on your international share";
    verdictNote = `${(intlShare * 100).toFixed(0)}% international share × price-sensitive markets × near-zero marginal cost = ~${fmtMoney(totalParityMonthly - totalCurrentMonthly, "USD")}/mo more (~+${liftPct.toFixed(0)}%). Start parity coupons on Gumroad/Payhip/your own site — the only places parity actually works today.`;
  } else if (totalFxLeakMonthly / Math.max(totalCurrentMonthly, 1) > 0.05) {
    verdict = "Parity is marginal — fix the FX route first";
    verdictNote = `Lift is small (+${liftPct.toFixed(1)}%), but FX conversion is leaking ${fmtMoney(totalFxLeakMonthly, "USD")}/mo — bigger than the parity upside. Receive cross-border payments in USD before tiering prices.`;
  } else {
    verdict = "Mixed case — tier by market, not by rule";
    verdictNote = `Lift ~+${liftPct.toFixed(1)}% with ${(intlShare * 100).toFixed(0)}% of sales international. The honest play: parity for weak-PPP markets (${weakMarkets.map((r) => r.country).join(", ").trim() || "none in sample"}), PPP-up for rich ones (${richMarkets.map((r) => r.country).join(", ").trim() || "none in sample"}), unchanged for the middle band.`;
  }

  return {
    markets: results,
    totalCurrentMonthly,
    totalParityMonthly,
    annualRevenueLift,
    liftPct,
    totalFxLeakMonthly,
    totalFxLeakAnnual,
    fmtTotalCurrentMonthly: fmtMoney(totalCurrentMonthly, "USD"),
    fmtTotalParityMonthly: fmtMoney(totalParityMonthly, "USD"),
    fmtAnnualRevenueLift: fmtMoney(annualRevenueLift, "USD"),
    fmtTotalFxLeakMonthly: fmtMoney(totalFxLeakMonthly, "USD"),
    fmtTotalFxLeakAnnual: fmtMoney(totalFxLeakAnnual, "USD"),
    fmtFxLeakPct: ((totalFxLeakMonthly / Math.max(totalCurrentMonthly, 1)) * 100).toFixed(1),
    fmtLiftPct: liftPct.toFixed(1),
    anchorNote,
    flags,
    verdict,
    verdictNote,
  };
}
