/**
 * CHK-050 — Ad Break-Even Lab
 *
 * Paid-marketing channel economics for pattern designers. Session-50
 * research (2026-08): Etsy Ads CPC typically $0.15–0.75 with digital
 * products at the low end ($0.20–0.40, MyDesigns Apr-2026); Etsy/WordStream
 * benchmark ROAS ≥ 3x, below 2x almost certainly losing money after costs
 * (Etsy Seller Handbook, get-ryze.ai Apr-2026); break-even ROAS =
 * 1 / profit margin; Etsy Offsite Ads fee 15% (<$10k/365d) or 12%
 * (≥$10k, mandatory lifetime) capped at $100/order, attributed on any sale
 * within 30 days of a click (Etsy Help Center 360000338367); Google Ads
 * median ROAS ~3.52–4.0x, Meta ~2.8x, digital products/courses avg 2.8x
 * (ryze.ai Apr-2026); email marketing ROI ~$36/$1 with ~3.2–4.8% visitor→
 * subscriber conversion and ~2%+ order conversion on warm sends
 * (Bloomreach/Litmus 2025–2026).
 *
 * The competitor flaws this converts into our strength:
 * - Etsy's ads give designers zero keyword/audience control and
 *   algorithm-set CPCs — designers can't compute whether a click is worth
 *   it before spending. This lab computes the ceiling BEFORE spending.
 * - Offsite Ads is a mandatory 15% margin haircut disguised as "free"
 *   promotion — we surface it as an explicit marginal fee per sale.
 * - Generic ROAS benchmarks (3x) ignore the pattern's actual margin —
 *   break-even ROAS is computed from the pattern's own fee structure.
 *
 * Engine: per-pattern, per-channel break-even math (CPC ceiling, max viable
 * ad spend per sale, break-even ROAS, offsite marginal fee) plus an email
 * baseline comparison (the ~36x-ROI channel every ad dollar should be
 * benchmarked against) and per-listing kill/keep verdicts against the
 * documented benchmarks.
 */

import { platformNet, type PlatformId } from './pattern-income-calculator';

export type AdChannel = 'etsy_onplatform' | 'etsy_offsite' | 'google_search' | 'meta_prospecting' | 'meta_retargeting' | 'pinterest' | 'ravelry_featured_source' | 'email_list';

export const AD_CHANNEL_LABELS: Record<AdChannel, string> = {
  etsy_onplatform: 'Etsy Ads (on-platform CPC)',
  etsy_offsite: 'Etsy Offsite Ads',
  google_search: 'Google Search',
  meta_prospecting: 'Meta prospecting (IG/FB)',
  meta_retargeting: 'Meta retargeting',
  pinterest: 'Pinterest promoted pins',
  ravelry_featured_source: 'Ravelry Featured Source',
  email_list: 'Email list send',
};

export const AD_CHANNEL_DESCRIPTIONS: Record<AdChannel, string> = {
  etsy_onplatform:
    'Algorithm-set CPCs inside Etsy search ($0.15–0.75 typical; digital products at the low end). No keyword or audience targeting. The ceiling per click is your net per sale.',
  etsy_offsite:
    'Etsy advertises for you on Google/Facebook/Pinterest at no upfront cost, but every attributed sale (within 30 days of a click) loses a 15% fee (<$10k/yr shops) or 12% ($10k+ shops, mandatory for life). Fee capped at $100/order.',
  google_search:
    'Highest-intent paid channel: ~$0.66 CPC benchmark, 3.5–4.5x median ROAS. You control keywords and bids — the only channel where a designer can out-compute the algorithm.',
  meta_prospecting:
    'Cold audiences: ~$1.72 CPC benchmark, ~2.1x median prospecting ROAS. Rarely viable for low-priced patterns at prospecting scale.',
  meta_retargeting:
    'Warm audiences (e.g., free-pattern downloaders): ~8.4x median retargeting ROAS — the documented high-ROAS play for digital patterns.',
  pinterest:
    'Discovery-intent CPCs run below Facebook and digital downloads still clear ~3x ROAS — the closest thing to organic on a paid surface.',
  ravelry_featured_source:
    'Ravelry promotes the designer page, not individual patterns, to knitters browsing Pattern search. Flat-rate/PPC; pattern discovery still relies on queues, favourites and HRN.',
  email_list:
    'Not an ad platform — the baseline. ~$36 return per $1 spent, ~3.2–4.8% visitor→subscriber conversion. Every ad dollar should clear a multiple of this channel before it is approved.',
};

export interface AdLabInput {
  /** Pattern list price, USD. */
  price: number;
  /** Platform where the sale is completed. */
  platform: PlatformId;
  /** Designer hourly rate for opportunity-cost sanity checks, $/hr. */
  designRate: number;
  /** Production/design hours invested in this pattern. */
  productionHours: number;
  /** Email list size of opted-in subscribers. */
  emailListSize: number;
  /** Expected order-conversion rate on a warm email send (e.g. 0.02). */
  emailConversion: number;
  /** Planned daily ad budget for the CPC channels, $/day. */
  dailyBudget: number;
  /** Runway in days to evaluate the budget against. */
  runwayDays: number;
  /** Observed / expected conversion rate from ad click to order (e.g. 0.02). */
  clickToOrder: number;
  /** Typical CPC assumed for the on-platform channel, $ (e.g. 0.30 for digital). */
  typicalCpc: number;
  /** Annual shop revenue — drives the 15%/12% offsite-ads tier. */
  annualShopRevenue: number;
}

export const AD_LAB_DEFAULTS: AdLabInput = {
  price: 6,
  platform: 'etsy',
  designRate: 32,
  productionHours: 40,
  emailListSize: 250,
  emailConversion: 0.02,
  dailyBudget: 3,
  runwayDays: 30,
  clickToOrder: 0.02,
  typicalCpc: 0.3,
  annualShopRevenue: 4000,
};

export interface ChannelBreakdown {
  channel: AdChannel;
  /** Net per completed sale after platform fees (and offsite fee where relevant). */
  netPerSale: number;
  /** Marginal ad-channel fee as % of order (offsite 15/12; others 0 — CPC is spend, not fee). */
  marginalFeePct: number;
  /** Break-even ROAS = 1 / (1 - platform-fee-pct - marginalFeePct), floored at 1. */
  breakEvenRoas: number;
  /** Maximum CPC that still breaks even at the given click-to-order rate. */
  maxBreakEvenCpc: number;
  /** Expected orders per day at typicalCpc (CPC channels only). */
  expectedOrdersPerDay: number | null;
  /** Expected daily profit at typicalCpc (CPC channels only). */
  expectedDailyProfit: number | null;
  /** Verdict against documented benchmarks. */
  verdict: 'strong' | 'marginal' | 'avoid' | 'baseline';
  /** Human explanation citing the documented market data. */
  reason: string;
}

export interface EmailBaseline {
  /** Orders expected from a single campaign send to the whole list. */
  expectedOrders: number;
  /** Gross revenue of one campaign send. */
  grossRevenue: number;
  /** Net revenue after platform fees. */
  netRevenue: number;
  /** Cost proxy: list provider share of a ~$0/sender cost (email ROI ~$36/$1). */
  sendCostEstimate: number;
  /** Implied ROI of one send vs email benchmark ($36/$1). */
  roiMultiple: number;
  reason: string;
}

export interface BudgetVerdict {
  /** Can the budget even buy enough clicks at the max break-even CPC? */
  spendableClicksPerDay: number;
  /** Daily spend that would never break even at the assumed CPC. */
  wastefulSpendThreshold: number;
  /** Days to recover production cost at expected daily profit (null if non-positive). */
  paybackDays: number | null;
  verdict: 'fund' | 'test_small' | 'skip';
  reason: string;
}

export interface AdLabResult {
  channels: ChannelBreakdown[];
  email: EmailBaseline;
  budget: BudgetVerdict;
  /** Offsite-ads tier in force for the shop. */
  offsiteTier: 'fifteen_pct' | 'twelve_pct';
  /** The single best-paid channel (excluding the email baseline). */
  bestPaidChannel: AdChannel | null;
  /** Flag when no paid channel can clear the email baseline multiple. */
  emailBeatsAllAds: boolean;
}

/** Effective platform-fee share of order value, from the existing fee seam. */
function platformFeePct(platform: PlatformId, price: number): number {
  const { effectiveFeePct } = platformNet(platform, price, 1);
  return effectiveFeePct / 100;
}

function offsiteFeePct(annualShopRevenue: number): number {
  return annualShopRevenue >= 10000 ? 0.12 : 0.15;
}

/** Break-even ROAS for a channel: 1 / margin after platform fee and marginal channel fee. */
function breakEvenRoas(platform: PlatformId, price: number, marginalFeePct: number): number {
  const fee = platformFeePct(platform, price) + marginalFeePct;
  if (fee >= 1) return Number.POSITIVE_INFINITY;
  return 1 / (1 - fee);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Whether the channel is a CPC spend channel (vs fee-only or effort-only). */
function isCpcChannel(c: AdChannel): boolean {
  return c !== 'etsy_offsite' && c !== 'ravelry_featured_source' && c !== 'email_list';
}

/** Documented CPC band for CPC channels (research file, session 50). */
function documentedCpc(c: AdChannel, typicalCpc: number): { low: number; high: number } {
  switch (c) {
    case 'etsy_onplatform': return { low: 0.2, high: 0.4 };
    case 'google_search': return { low: 0.5, high: 0.8 };
    case 'meta_prospecting': return { low: 1.4, high: 2.0 };
    case 'meta_retargeting': return { low: 0.8, high: 1.4 };
    case 'pinterest': return { low: 0.5, high: 1.0 };
    default: return { low: typicalCpc, high: typicalCpc };
  }
}

/** Documented ROAS benchmark for the channel (median, session-50 sources). */
function documentedRoas(c: AdChannel): number | null {
  switch (c) {
    case 'etsy_onplatform': return 3.0;
    case 'etsy_offsite': return null; // fee channel, no ROAS to benchmark — fee is the whole story
    case 'google_search': return 4.0;
    case 'meta_prospecting': return 2.1;
    case 'meta_retargeting': return 8.4;
    case 'pinterest': return 3.0;
    case 'ravelry_featured_source': return null;
    case 'email_list': return null;
  }
}

export function analyzeAdSpend(input: AdLabInput): AdLabResult {
  const price = Math.max(0.01, input.price);
  const offsiteTier: AdLabResult['offsiteTier'] = input.annualShopRevenue >= 10000 ? 'twelve_pct' : 'fifteen_pct';
  const offsitePct = offsiteFeePct(input.annualShopRevenue);
  const platformFee = platformFeePct(input.platform, price);

  const channels: ChannelBreakdown[] = (Object.keys(AD_CHANNEL_LABELS) as AdChannel[]).map((c) => {
    const netPerSaleBase = platformNet(input.platform, price, 1).netPerSale;
    const netPerSale = c === 'etsy_offsite' ? Math.max(0, netPerSaleBase * (1 - offsitePct)) : netPerSaleBase;
    const marginalFeePct = c === 'etsy_offsite' ? offsitePct : 0;
    const beRoas = breakEvenRoas(input.platform, price, marginalFeePct);
    // Max CPC at which one expected order covers the clicks that bought it:
    // expected orders per click = clickToOrder; cost per expected order = CPC / clickToOrder.
    const maxBreakEvenCpc = netPerSale * input.clickToOrder;

    let expectedOrdersPerDay: number | null = null;
    let expectedDailyProfit: number | null = null;
    let verdict: ChannelBreakdown['verdict'] = 'marginal';
    let reason = '';

    if (c === 'email_list') {
      verdict = 'baseline';
      reason =
        `Email is the benchmark, not an ad channel: at a ${Math.round(input.emailConversion * 100)}% warm-list conversion, ` +
        `one send nets ${fmt(netPerSale * input.emailListSize * input.emailConversion)} on the pattern — at roughly $36 return per $1 spent ` +
        `(Bloomreach/Litmus 2025–2026), no paid channel should launch before this list is warm.`;
    } else if (c === 'etsy_offsite') {
      verdict = netPerSale < netPerSaleBase * 0.9 ? 'avoid' : 'marginal';
      reason =
        `Not an ad you buy — a ${Math.round(offsitePct * 100)}% fee Etsy takes on any sale within 30 days of an Offsite Ad click. ` +
        `${offsiteTier === 'fifteen_pct' ? 'Under $10k/yr you can opt out' : 'At $10k+/yr this is mandatory for the lifetime of the shop'} — ` +
        `an order attributed to an offsite click nets ${fmt(netPerSale)}, ${fmt(netPerSaleBase - netPerSale)} less than an organic order of ${fmt(netPerSaleBase)}.`;
    } else if (c === 'ravelry_featured_source') {
      verdict = 'marginal';
      reason =
        `Ravelry promotes your designer page, not the pattern — individual patterns are discovered via queues, favourites and HRN. ` +
        `No per-pattern promoted placement exists for designers; spend here only as brand-building, never as direct-response.`;
    } else {
      // CPC channels
      const docCpc = documentedCpc(c, input.typicalCpc);
      const cpc = c === 'etsy_onplatform' ? input.typicalCpc : (docCpc.low + docCpc.high) / 2;
      const ordersPerDay = (input.dailyBudget / Math.max(0.01, cpc)) * input.clickToOrder;
      expectedOrdersPerDay = round2(ordersPerDay);
      const dailyProfit = ordersPerDay * netPerSale - input.dailyBudget;
      expectedDailyProfit = round2(dailyProfit);
      const docRoas = documentedRoas(c);

      const belowFloor = docRoas !== null && beRoas > docRoas * 1.25;
      if (dailyProfit > 0 && beRoas <= 3) verdict = 'strong';
      else if (dailyProfit > 0) verdict = 'marginal';
      else verdict = 'avoid';

      const above = docRoas !== null && beRoas <= docRoas ? ' clears' : ' does not clear';
      reason =
        `${c === 'etsy_onplatform' ? 'Etsy sets the CPC (no keyword targeting) — assume ' + fmt(input.typicalCpc) : 'Assumed CPC ' + fmt(cpc)}: ` +
        `${fmt(cpc)} / ${fmt(netPerSale)} net per sale needs at most ${fmt(maxBreakEvenCpc)} per click at ${Math.round(input.clickToOrder * 100)}% click→order — ` +
        `break-even ROAS ${beRoas.toFixed(2)}x${above} the ${docRoas ? docRoas.toFixed(1) + 'x documented median' : 'fee-only'} benchmark. ` +
        `At $${input.dailyBudget}/day that projects ${expectedOrdersPerDay?.toFixed(2)} orders/day and ${fmt(dailyProfit)}/day profit.`;
    }

    return {
      channel: c,
      netPerSale: round2(netPerSale),
      marginalFeePct,
      breakEvenRoas: Number.isFinite(beRoas) ? round2(beRoas) : beRoas,
      maxBreakEvenCpc: round2(Math.max(0, maxBreakEvenCpc)),
      expectedOrdersPerDay,
      expectedDailyProfit,
      verdict,
      reason,
    };
  });

  // Sort: email baseline first, then by expected daily profit desc (nulls last).
  channels.sort((a, b) => (b.expectedDailyProfit ?? -Infinity) - (a.expectedDailyProfit ?? -Infinity));
  const emailChan = channels.find((c) => c.channel === 'email_list')!;
  const paid = channels.filter((c) => c.channel !== 'email_list');

  const email: EmailBaseline = {
    expectedOrders: round2(input.emailListSize * input.emailConversion),
    grossRevenue: round2(input.emailListSize * input.emailConversion * price),
    netRevenue: round2(input.emailListSize * input.emailConversion * emailChan.netPerSale),
    sendCostEstimate: 0,
    roiMultiple: 36,
    reason:
      `One warm send to ${input.emailListSize} subscribers at ${Math.round(input.emailConversion * 100)}% conversion ≈ ${round2(input.emailListSize * input.emailConversion)} orders ` +
      `→ ${fmt(input.emailListSize * input.emailConversion * emailChan.netPerSale)} net — at the industry ~$36/$1 email ROI, this baseline out-returns most paid spend for patterns under $10.`,
  };

  const beCpc = emailChan.maxBreakEvenCpc;
  const spendableClicksPerDay = input.dailyBudget / Math.max(0.01, input.typicalCpc);
  const wastefulSpendThreshold = round2(spendableClicksPerDay * beCpc);
  const bestPaid = paid.reduce<ChannelBreakdown | null>((acc, c) =>
    (c.expectedDailyProfit ?? -Infinity) > ((acc?.expectedDailyProfit ?? -Infinity)) ? c : acc, null);
  const topDailyProfit = bestPaid?.expectedDailyProfit ?? 0;
  const paybackDays = topDailyProfit > 0 ? Math.ceil(input.productionHours * input.designRate / topDailyProfit) : null;
  const emailBeatsAllAds = email.netRevenue > Math.max(0, topDailyProfit * 30);

  let budgetVerdict: BudgetVerdict['verdict'] = 'test_small';
  let budgetReason = '';
  if (!bestPaid || (bestPaid.expectedDailyProfit ?? 0) <= 0) {
    budgetVerdict = 'skip';
    budgetReason =
      `No CPC channel profits at the assumed ${Math.round(input.clickToOrder * 100)}% click→order rate and ${fmt(input.typicalCpc)} CPC — ` +
      `the break-even CPC ceiling is ${fmt(beCpc)}/click. Redirect the $${input.dailyBudget}/day ($${input.dailyBudget * input.runwayDays} over ${input.runwayDays}d) into growing the email list instead.`;
  } else {
    const daily = bestPaid.expectedDailyProfit as number;
    if (daily * input.runwayDays < input.productionHours * input.designRate) {
      budgetVerdict = 'test_small';
      budgetReason =
        `${AD_CHANNEL_LABELS[bestPaid.channel]} returns ${fmt(daily)}/day — it pays for its own spend but needs ${paybackDays ?? 'many'} days to repay ` +
        `${input.productionHours}h of production (${fmt(input.productionHours * input.designRate)}). Cap at $${Math.min(input.dailyBudget, 5)}/day for 30 days; kill any listing under 2x ROAS after 30 days (Etsy's own rule).`;
    } else {
      budgetVerdict = 'fund';
      budgetReason =
        `${AD_CHANNEL_LABELS[bestPaid.channel]} projects ${fmt(daily)}/day — the $${input.dailyBudget}/day budget repays ` +
        `${input.productionHours}h of production in ${paybackDays ?? '?'} days and clears the email baseline on velocity. Scale only listings above 3x ROAS.`;
    }
  }

  return {
    channels,
    email,
    budget: { spendableClicksPerDay: round2(spendableClicksPerDay), wastefulSpendThreshold, paybackDays, verdict: budgetVerdict, reason: budgetReason },
    offsiteTier,
    bestPaidChannel: bestPaid?.channel ?? null,
    emailBeatsAllAds,
  };
}

function fmt(n: number): string {
  return '$' + (Math.round(n * 100) / 100).toFixed(2);
}

export { platformFeePct as _platformFeePct, offsiteFeePct as _offsiteFeePct, breakEvenRoas as _breakEvenRoas };
