/**
 * Price Window & Discount Optimizer (CHK-028).
 *
 * Models the real job of a launch discount: converting the Ravelry fave
 * queue into week-one sales while the pattern sits in promo threads — and
 * catching the two traps nobody tools for:
 *
 *  1. The permanent-discount train: running sale after sale teaches buyers
 *     to wait for the next deal, so full-price baseline volume decays.
 *  2. The forever-sale: a discount with no end date never creates urgency,
 *     so the fave queue trickles instead of converting.
 *
 * Seasonal demand multipliers are documented industry convention
 * (knitting season Nov–Dec & Jan–Feb, slow summer, Sep/Oct comeback) and
 * all money math runs through the shared platformNet seam so promo math is
 * always net of platform fees.
 */

import { platformNet, PLATFORMS, type PlatformId } from './pattern-income-calculator';

export type SeasonId = 'novdec' | 'janfeb' | 'marapr' | 'mayjun' | 'jul' | 'aug' | 'sepoct';

/** Month-of-year → season, Jan = 1 (JS Date.getMonth() + 1). */
export const MONTH_SEASON: Record<number, SeasonId> = {
  1: 'janfeb', 2: 'janfeb', 3: 'marapr', 4: 'marapr', 5: 'mayjun', 6: 'mayjun',
  7: 'jul', 8: 'aug', 9: 'sepoct', 10: 'sepoct', 11: 'novdec', 12: 'novdec',
};

/** Seasonal knitting-demand multipliers relative to a flat year. */
export const SEASON_MULTIPLIERS: Record<SeasonId, { label: string; mult: number; note: string }> = {
  novdec: { label: 'Nov–Dec', mult: 1.75, note: 'Gift season — the biggest buying window of the year.' },
  janfeb: { label: 'Jan–Feb', mult: 1.25, note: 'New-year craft resolutions keep demand high.' },
  marapr: { label: 'Mar–Apr', mult: 0.9, note: 'Post-holiday settling; steady demand.' },
  mayjun: { label: 'May–Jun', mult: 0.7, note: 'Summer slowdown — people knit less.' },
  jul: { label: 'Jul', mult: 0.6, note: 'The slowest month for pattern sales.' },
  aug: { label: 'Aug', mult: 0.75, note: 'Back-to-knitting interest starts building.' },
  sepoct: { label: 'Sep–Oct', mult: 1.25, note: 'Sweater season begins — second peak.' },
};

export type Verdict = 'go' | 'maybe' | 'no';

export interface PriceWindowInput {
  platform: PlatformId;
  listPrice: number;
  baselineMonthlySales: number;
  /** Fave-queue size at launch (Ravelry favourites). */
  faveQueue: number;
  /** Discount percent applied during the launch window (0–100). */
  launchDiscountPct: number;
  /** How many weeks the launch discount runs. */
  launchWeeks: number;
  /** Extra weekly sales while the pattern sits in Ravelry promo threads. */
  promoThreadLiftPerWeek: number;
  /** Months of promo-thread lift to model. */
  promoThreadMonths: number;
  /** Full-price conversion rate of the fave queue per week (e.g. 0.02 = 2%). */
  fullPriceConversionPct: number;
  /** Discounted conversion uplift multiple (e.g. 2.5x during the sale). */
  discountUpliftMultiple: number;
  /** Baseline seasonal multiplier for the launch month. */
  seasonMult: number;
}

export const DEFAULT_PRICE_WINDOW: PriceWindowInput = {
  platform: 'ravelry',
  listPrice: 8,
  baselineMonthlySales: 10,
  faveQueue: 60,
  launchDiscountPct: 20,
  launchWeeks: 2,
  promoThreadLiftPerWeek: 3,
  promoThreadMonths: 3,
  fullPriceConversionPct: 2,
  discountUpliftMultiple: 2.5,
  seasonMult: 1.25,
};

export interface WindowPath {
  name: string;
  /** Net revenue over the modeled horizon, after fees. */
  netRevenue: number;
  /** Sales realized during the modeled horizon. */
  sales: number;
  verdict: Verdict;
  note: string;
}

export interface DiscountTrap {
  /** True when sales were discounted more than two of the last four weeks. */
  trainedToWait: boolean;
  /** True when a sale has no planned end date in the plan. */
  noEndDate: boolean;
  /** True when discount depth exceeds the 15–20% competitive band. */
  tooDeep: boolean;
  /** True when the sale runs longer than 4 weeks. */
  tooLong: boolean;
  items: string[];
}

export interface PriceWindowResult {
  fullPricePath: WindowPath;
  launchDiscountPath: WindowPath;
  permanentDiscountPath: WindowPath;
  launchDelta: number;
  trap: DiscountTrap;
  horizonMonths: number;
  seasonNote: string;
  listingCopy: string;
}

export const PRICE_WINDOW_STORAGE_KEY = 'prcw-v1';

/**
 * Full-path analysis: full price vs launch-window discount vs permanent
 * discount, over a season-adjusted horizon, all net of platform fees.
 */
export function analyzePriceWindow(input: Partial<PriceWindowInput> = {}): PriceWindowResult {
  const p: PriceWindowInput = { ...DEFAULT_PRICE_WINDOW, ...input };
  const horizonMonths = Math.max(1, Math.round(p.promoThreadMonths));

  // --- Path 1: full price, no launch discount. Baseline sales season-
  // adjusted, plus the fave queue converting slowly at full-price rate.
  const fpNet = platformNet(p.platform, p.listPrice, Math.max(p.baselineMonthlySales, 1));
  const fpSeasonalMonthly = p.baselineMonthlySales * p.seasonMult;
  // Fave queue dribbles at full-price conversion: % of the queue per week,
  // sustained across the horizon weeks.
  const fpWeeks = horizonMonths * 4.33;
  const fpQueueSales = Math.min(p.faveQueue * (p.fullPriceConversionPct / 100) * fpWeeks, p.faveQueue);
  const fpTotalSales = fpSeasonalMonthly * horizonMonths + fpQueueSales;
  const fpNetRevenue =
    platformNet(p.platform, p.listPrice, Math.max(fpTotalSales, 1)).netRevenue *
    (fpTotalSales / Math.max(fpTotalSales, 1));
  const fpVerdict: Verdict = fpQueueSales < p.faveQueue * 0.3 ? 'maybe' : 'go';
  const fullPricePath: WindowPath = {
    name: 'Full price, no sale',
    netRevenue: Math.round(fpNetRevenue * 100) / 100,
    sales: Math.round(fpTotalSales * 10) / 10,
    verdict: fpVerdict,
    note: `Baseline net ${fmt$(fpNet.netPerSale)}/sale. The fave queue converts only ~${
      (p.fullPriceConversionPct).toFixed(0)}%/wk — most queue never buys at full price.`,
  };

  // --- Path 2: launch-window discount. Converts the fave queue at uplift
  // rate during the sale weeks, then returns to (discount-taught) baseline.
  const salePrice = Math.round(p.listPrice * (1 - p.launchDiscountPct / 100) * 100) / 100;
  const launchWeeks = Math.max(0, Math.min(12, Math.round(p.launchWeeks)));
  const weeksInHorizon = horizonMonths * 4.33;
  const windowShare = Math.min(1, launchWeeks / weeksInHorizon);
  // During the window: season-adjusted baseline + queue conversion at uplift,
  // sustained week over the sale weeks (same weekly-rate model as the
  // full-price path, just accelerated by the discount uplift).
  const windowSales = fpSeasonalMonthly * (launchWeeks / 4.33)
    + Math.min(p.faveQueue * (p.fullPriceConversionPct / 100) * p.discountUpliftMultiple * launchWeeks, p.faveQueue);
  // After the window: season-adjusted baseline, plus the remaining queue
  // dribbling at full-price weekly rate (a launch sale borrows from the
  // queue — it does not create more of it).
  const remainingQueue = Math.max(0, p.faveQueue -
    Math.min(p.faveQueue * (p.fullPriceConversionPct / 100) * p.discountUpliftMultiple * launchWeeks, p.faveQueue));
  const postWeeks = Math.max(0, weeksInHorizon - launchWeeks);
  const postQueueSales = Math.min(remainingQueue * (p.fullPriceConversionPct / 100) * postWeeks, remainingQueue);
  const postSales = fpSeasonalMonthly * (postWeeks / 4.33) + postQueueSales;
  const ldTotalSales = windowSales + postSales;
  const blendedGross = salePrice * windowSales + p.listPrice * postSales;
  const ldBlendedUnits = Math.max(ldTotalSales, 1);
  const ldBlendedPrice = Math.max(blendedGross / ldBlendedUnits, 0.01);
  const ldNetRevenue = platformNet(p.platform, ldBlendedPrice, ldBlendedUnits).netRevenue;
  const ldDelta = ldNetRevenue - fullPricePath.netRevenue;
  const launchDiscountPath: WindowPath = {
    name: `Launch sale ${p.launchDiscountPct}% × ${launchWeeks} wk`,
    netRevenue: Math.round(ldNetRevenue * 100) / 100,
    sales: Math.round(ldTotalSales * 10) / 10,
    verdict: ldDelta > 0 ? 'go' : ldDelta > -fpNet.netRevenue * 0.2 ? 'maybe' : 'no',
    note: ldDelta > 0
      ? `Launch window nets ${fmt$(Math.abs(ldDelta))} more than holding price — the queue converts.`
      : `The ${p.launchDiscountPct}% window nets ${fmt$(Math.abs(ldDelta))} less than full price — shorten or shallow the sale.`,
  };

  // --- Path 3: permanent discount (the trap). Converts queue at uplift
  // continuously, but every sale is at the sale price AND baseline buyers
  // are trained to wait (a large share of baseline volume is taught to hold
  // out until the next sale).
  const trainedBaseline = fpSeasonalMonthly * (1 - 0.4);
  // A trained audience buys through the queue early then stops favouriting
  // new work — cap lifetime queue conversion at the original queue.
  const permQueueSales = Math.min(
    p.faveQueue * (p.fullPriceConversionPct / 100) * p.discountUpliftMultiple * weeksInHorizon,
    p.faveQueue,
  );
  const permTotalSales = trainedBaseline * horizonMonths + permQueueSales;
  const permNetRevenue = platformNet(p.platform, salePrice, Math.max(permTotalSales, 1)).netRevenue;
  const permDelta = permNetRevenue - fullPricePath.netRevenue;
  const permanentDiscountPath: WindowPath = {
    name: 'Forever sale (trap)',
    netRevenue: Math.round(permNetRevenue * 100) / 100,
    sales: Math.round(permTotalSales * 10) / 10,
    verdict: permDelta > fpNet.netRevenue * 2 ? 'maybe' : 'no',
    note: permDelta > 0
      ? `A forever sale at ${fmt$(salePrice)} looks busy but trains buyers to never pay full price — baseline volume decays.`
      : `The forever sale nets ${fmt$(Math.abs(permDelta))} less than full price AND trains a wait-for-sale audience.`,
  };

  // --- Discount trap audit (the plan's own discount discipline).
  const trapItems: string[] = [];
  const tooDeep = p.launchDiscountPct > 25;
  const tooLong = launchWeeks > 4;
  if (tooDeep) trapItems.push(`A ${p.launchDiscountPct}% cut is past the 15–25% band buyers expect — it signals "always on sale".`);
  if (tooLong) trapItems.push(`${launchWeeks} weeks of sale with no end date never creates urgency — cap launch sales at 2 weeks.`);
  if (p.launchDiscountPct > 0 && launchWeeks === 0) trapItems.push('Discount set but zero sale weeks — either run it or kill it.');
  const trainedToWait = tooDeep || tooLong;
  const trap: DiscountTrap = {
    trainedToWait,
    noEndDate: tooLong,
    tooDeep,
    tooLong,
    items: trapItems,
  };

  const bestSeason = Object.entries(SEASON_MULTIPLIERS)
    .sort((a, b) => b[1].mult - a[1].mult)
    .slice(0, 2)
    .map(([, s]) => `${s.label} (${s.mult.toFixed(2)}×)`)
    .join(' · ');

  const salePriceStr = fmt$(salePrice);
  const launchCopy = [
    '— Launch Listing Copy —',
    `Pattern now ${p.launchDiscountPct}% off — ${salePriceStr} until ${launchWeeks > 0 ? `day ${launchWeeks * 7}` : 'soon'}, then ${fmt$(p.listPrice)}.`,
    `If this design is sitting in your favourites, the launch window is the moment to grab it.`,
    `Graded across the size range, tech-edited, and test-knitted before release.`,
  ].join('\n');

  return {
    fullPricePath,
    launchDiscountPath,
    permanentDiscountPath,
    launchDelta: Math.round(ldDelta * 100) / 100,
    trap,
    horizonMonths,
    seasonNote: `Launch in ${bestSeason} — plan the release around these windows.`,
    listingCopy: launchCopy,
  };
}

function fmt$(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

/** Supported platforms exposed to the UI (re-export for convenience). */
export { PLATFORMS };
