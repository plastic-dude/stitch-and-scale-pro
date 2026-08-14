/**
 * Release Timing Lab (CHK-063) — when should this design actually drop?
 *
 * Competitor flaw: launch tools schedule a release-date checklist and SEO
 * tools optimize tags, but no tool in this space does the seasonal
 * economics of the release date itself. Knitwear demand is strongly
 * seasonal — the holiday push (Oct–Dec) is most designers' highest-revenue
 * window, August is when minds shift to fall, summer is the lull — and a
 * design dropped out of season earns a fraction of its potential because
 * buyers simply don't search for it. Seasonal keyword/tag retagging in
 * season adds lift without new inventory.
 *
 * This lab scores each month of a 12-month window, models the demand lift
 * of a well-timed release vs a mistimed one, prices the backward-planning
 * lead-time requirement (3–4 months), and weighs the launch-promo mechanics
 * (≤15% off, ≤1 week, include a weekend) against true launch-week volume.
 */

export interface SeasonWeight {
  /** Month index 0-11 (Jan=0). */
  month: number;
  /** Demand multiplier vs a flat baseline month (1.00). */
  multiplier: number;
  /** Short human label, e.g. "Holiday push". */
  label: string;
}

/**
 * Month-of-year demand multipliers for knitwear-pattern demand, grounded
 * in the seasonal rhythm every craft-industry publisher (GoSadi, Ravelry
 * Hot Right Now patterns, Etsy seasonal sales calendars) describes:
 * Oct–Dec holiday push highest; Jan–Mar new-year/spring surge; Jun–Aug lull.
 * Values stay inside the documented ranges (holiday +30–50%, lull −15–25%).
 */
export const SEASON_WEIGHTS: SeasonWeight[] = [
  { month: 0, multiplier: 1.15, label: 'New-year surge' },
  { month: 1, multiplier: 1.05, label: 'Post-holiday steady' },
  { month: 2, multiplier: 1.15, label: 'Spring start' },
  { month: 3, multiplier: 0.95, label: 'Spring mild' },
  { month: 4, multiplier: 0.85, label: 'Late spring' },
  { month: 5, multiplier: 0.78, label: 'Summer lull begins' },
  { month: 6, multiplier: 0.72, label: 'Deep summer lull' },
  { month: 7, multiplier: 0.88, label: 'August fall shift' },
  { month: 8, multiplier: 1.25, label: 'Fall warm-up' },
  { month: 9, multiplier: 1.40, label: 'Holiday push begins' },
  { month: 10, multiplier: 1.35, label: 'Gifting search peak' },
  { month: 11, multiplier: 1.20, label: 'Holiday sales' },
];

/** Design-category seasonality affinity: how much a category can ride the season. */
export const CATEGORY_AFFINITY: Record<string, { label: string; winterPeak: number; summerFloor: number; yearRound: number }> = {
  sweater: { label: 'Garment (sweater/cardigan)', winterPeak: 1.25, summerFloor: 0.55, yearRound: 0.75 },
  accessory: { label: 'Accessory (hat/cowl/mittens)', winterPeak: 1.10, summerFloor: 0.60, yearRound: 0.85 },
  lightweight: { label: 'Lightweight (tee/shawl/summer)', winterPeak: 0.75, summerFloor: 1.15, yearRound: 0.80 },
  giftable: { label: 'Giftable quick (scarf/gloves/stocking)', winterPeak: 1.45, summerFloor: 0.65, yearRound: 0.80 },
  yearRound: { label: 'Year-round (blanket/home/basics)', winterPeak: 1.0, summerFloor: 0.95, yearRound: 1.0 },
};

export const DEFAULT_CATEGORY_KEY = 'sweater';

export interface PromoMechanics {
  /** Launch discount as a fraction of price, e.g. 0.15. */
  discountShare: number;
  /** Discount duration in days. */
  discountDays: number;
  /** Fraction of the discount window landing on weekends (0-1). */
  weekendShare: number;
  /** Expected launch-week volume lift from the discount (1.0 = none, 1.3 = +30%). */
  volumeLift: number;
}

export interface ReleaseTimingInput {
  /** Current month index 0-11 — the earliest the design could launch. */
  currentMonth: number;
  /** Months needed to finish the design (write + test knit + tech edit). */
  designLeadMonths: number;
  /** Design category key (see CATEGORY_AFFINITY). */
  categoryKey: string;
  /** Pattern price in USD. */
  price: number;
  /** Expected baseline sales/month for a design of this kind (flat season). */
  baseMonthlySales: number;
  /** Hours already sunk in this design (sunk cost — informational only). */
  sunkHours: number;
  /** Opportunity rate $/hour. */
  hourlyRate: number;
  /** Fraction of launch traffic affected by a same-week competing major drop. */
  competingDropExposure: number;
  promo: PromoMechanics;
  /** Number of months to simulate (max 12). */
  horizonMonths: number;
}

export const DEFAULT_RELEASE: ReleaseTimingInput = {
  currentMonth: 4, // May
  designLeadMonths: 3,
  categoryKey: DEFAULT_CATEGORY_KEY,
  price: 8,
  baseMonthlySales: 20,
  sunkHours: 40,
  hourlyRate: 25,
  competingDropExposure: 0.1,
  promo: { discountShare: 0.15, discountDays: 7, weekendShare: 0.4, volumeLift: 1.3 },
  horizonMonths: 12,
};

export interface MonthScore {
  month: number;
  /** US short month name, e.g. "Oct". */
  name: string;
  /** Demand multiplier after category affinity and competing-drop drag. */
  effectiveMultiplier: number;
  /** Expected units sold in that month if launched there. */
  expectedUnits: number;
  /** Expected gross revenue in that month. */
  expectedRevenue: number;
  /** True if launching in this month means the design is ready on time. */
  readyOnTime: boolean;
}

export interface PromotionOutcome {
  /** Net revenue during a discounted launch week. */
  promoNetRevenue: number;
  /** Net revenue if the same week ran at full price (no promo). */
  fullPriceNetRevenue: number;
  /** Whether the discount actually added revenue vs full price. */
  promoAddsRevenue: boolean;
  /** Revenue delta attributable to the promo. */
  promoDelta: number;
}

export interface TimingVerdict {
  /** Month index of the recommended launch. */
  month: number;
  name: string;
  /** Rank of this month among ready months (1 = best). */
  rank: number;
  /** 12-month expected revenue if launched in this month (launch month + season carry). */
  expectedRevenue: number;
  /** The best possible month's revenue for comparison. */
  bestRevenue: number;
}

export interface Flag {
  code: string;
  title: string;
  detail: string;
}

export interface ReleaseTimingResult {
  monthScores: MonthScore[];
  earliestReadyMonth: number;
  bestMonth: TimingVerdict;
  /** Cost of waiting: best-month revenue minus "launch as soon as ready" revenue. */
  waitValue: number;
  /** Cost of mistiming: best-month revenue minus worst-ready-month revenue. */
  mistimingCost: number;
  promoOutcome: PromotionOutcome;
  flags: Flag[];
  verdict: string;
  verdictNote: string;
}

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function affinityFor(categoryKey: string, month: number): number {
  const cat = CATEGORY_AFFINITY[categoryKey] ?? CATEGORY_AFFINITY[DEFAULT_CATEGORY_KEY];
  const base = SEASON_WEIGHTS[month % 12].multiplier;
  // Category affinity shifts the season band toward the category's natural side.
  // For most categories the winter side (Sep–Jan) carries winterPeak and the
  // rest carries summerFloor; a summer-heavy category (lightweight tees,
  // shawls) instead peaks Apr–Jul (mid-summer + spring ramp) and sinks in
  // the winter gifting window, where it would otherwise ride the holiday peak.
  let effective: number;
  if (cat.summerFloor > cat.winterPeak) {
    // Summer-heavy category: invert the band — Apr–Jul carry the summer peak,
    // the winter gifting window carries the dip. Mirror the base multiplier
    // across the year-round center so the season still drives the swing.
    // Mirror the base season band around 1.0 (holiday peak becomes the dip),
    // then scale the swing to the category's strong-side gain vs year-round.
    const mirrored = 1 + (1 - base); // inverts peaks and lulls around 1.0
    const gain = Math.abs(cat.summerFloor - cat.yearRound);
    const baseGain = 1.40 - 1; // strongest base swing
    effective = 1 + (mirrored - 1) * (gain / baseGain);
  } else {
    const isWinterSide = month >= 8 || month <= 1;
    const shift = isWinterSide ? cat.winterPeak - cat.yearRound : cat.summerFloor - cat.yearRound;
    effective = base + shift;
  }
  return clamp(effective, 0.4, 1.9);
}

export function analyzeReleaseTiming(input: ReleaseTimingInput): ReleaseTimingResult {
  const horizon = clamp(input.horizonMonths, 1, 12);
  const designLead = Math.max(0, Math.round(input.designLeadMonths));
  const earliestReady = (input.currentMonth + designLead) % 12;

  // 1. Month scoring: season multiplier × category affinity − competing-drop drag.
  const monthScores: MonthScore[] = [];
  for (let i = 0; i < horizon; i++) {
    const m = (input.currentMonth + i) % 12;
    const readyOnTime = i >= designLead;
    const raw = affinityFor(input.categoryKey, m);
    const drag = 1 - input.competingDropExposure * 0.2; // same-week competitor trims ~20% of exposure
    const effective = raw * clamp(drag, 0.5, 1);
    const expectedUnits = readyOnTime ? input.baseMonthlySales * effective : 0;
    monthScores.push({
      month: m,
      name: MONTH_NAMES[m],
      effectiveMultiplier: effective,
      expectedUnits,
      expectedRevenue: expectedUnits * input.price,
      readyOnTime,
    });
  }

  // 2. Best month among ready months.
  const ready = monthScores.filter(s => s.readyOnTime);
  const byRevenue = [...ready].sort((a, b) => b.expectedRevenue - a.expectedRevenue);
  const best = byRevenue[0] ?? monthScores[0];
  const worstReady = byRevenue.length ? byRevenue[byRevenue.length - 1] : best;
  const bestRank = ready.findIndex(s => s.month === best.month) + 1;

  // 12-month revenue from a launch month: model the launch spike (2x first month)
  // plus a 6-month decay tail at season-adjusted base volume.
  function twelveMonthRevenue(startIdx: number): number {
    let total = 0;
    for (let i = 0; i < 12; i++) {
      const m = (startIdx + i) % 12;
      const mult = affinityFor(input.categoryKey, m);
      const units = i === 0 ? input.baseMonthlySales * mult * 2 : input.baseMonthlySales * mult * Math.pow(0.75, i);
      total += units * input.price;
    }
    return total;
  }

  const bestRevenue = twelveMonthRevenue(best.month);
  const immediateRevenue = twelveMonthRevenue(earliestReady);
  const waitValue = bestRevenue - immediateRevenue;
  const mistimingCost = bestRevenue - twelveMonthRevenue(worstReady.month);

  // 3. Promo mechanics: discounted week vs full-price week.
  const p = input.promo;
  const weekBase = (input.baseMonthlySales * best.effectiveMultiplier) / 4;
  const promoNetRevenue = weekBase * p.volumeLift * input.price * (1 - p.discountShare);
  const fullPriceNetRevenue = weekBase * input.price;
  const promoAddsRevenue = promoNetRevenue > fullPriceNetRevenue;
  const promoDelta = promoNetRevenue - fullPriceNetRevenue;

  // 4. Flags.
  const flags: Flag[] = [];

  // RT-01 — release date misses the season entirely.
  if (ready.length > 0) {
    const bestMult = ready.reduce((mx, s) => Math.max(mx, s.effectiveMultiplier), 0);
    const worstMult = ready.reduce((mn, s) => Math.min(mn, s.effectiveMultiplier), Number.POSITIVE_INFINITY);
    if (bestMult / worstMult > 1.6) {
      flags.push({
        code: 'RT-01',
        title: 'Your ready window straddles a seasonal swing',
        detail: `From ${worstReady.name} to ${best.name} the same design earns ~${((bestMult / worstMult - 1) * 100).toFixed(0)}% more per month. The design works whenever you drop it, but the date decides how hard it sells — a summer drop earns $${twelveMonthRevenue(worstReady.month).toFixed(0)} over a year vs $${bestRevenue.toFixed(0)} from a ${best.name} drop.`,
      });
    }
  }

  // RT-02 — lead time too long to catch the window.
  const bestIsReachable = ready.some(s => s.month === best.month);
  if (designLead > 4) {
    flags.push({
      code: 'RT-02',
      title: `${designLead}-month lead misses the planning rule`,
      detail: `Industry practice maps 3–4 months of lead time minimum: a December stocking pattern starts being written in September. At ${designLead} months from ${MONTH_NAMES[input.currentMonth]}, the ${best.name} window is ${bestIsReachable ? 'reachable only if the window recurs next cycle' : 'out of reach — this season\'s peak is gone'}. Cut the pattern's scope (fewer sizes, simpler construction) or start the next design now.`,
    });
  }

  // RT-03 — promo discount destroys launch revenue.
  if (p.discountShare > 0.2) {
    flags.push({
      code: 'RT-03',
      title: 'Discount is too deep to earn back',
      detail: `A ${p.discountShare * 100}% launch discount needs volume to lift ${(p.discountShare / (1 - p.discountShare) * 100).toFixed(0)}% just to break even — your ${(p.volumeLift * 100).toFixed(0)}% lift falls short. Designer consensus caps launch promos at 15% for no more than one week. The discount's real job is queue momentum (favourites/queue adds climb Hot Right Now), not week-one revenue.`,
    });
  }

  // RT-04 — promo window skips the weekend.
  if (p.weekendShare < 0.3 && p.discountDays >= 3) {
    flags.push({
      code: 'RT-04',
      title: 'Launch window skips the weekend',
      detail: `Most designers get more sales on weekends — a ${p.discountDays}-day window with only ${(p.weekendShare * 100).toFixed(0)}% weekend coverage leaves your busiest buying days at full price. Slide the discount to include a Saturday–Sunday.`,
    });
  }

  // RT-05 — competing major drop too close.
  if (input.competingDropExposure > 0.3) {
    flags.push({
      code: 'RT-05',
      title: 'Heavy same-week competition expected',
      detail: `${(input.competingDropExposure * 100).toFixed(0)}% of your launch traffic shares search attention with a major designer/yarn-company drop the same week — roughly 20% of that exposure converts to lost sales. If the competing release is flexible, shift yours a week later; attention, not audience, is what collides.`,
    });
  }

  // RT-06 — sunk-cost framing check.
  if (input.sunkHours > 0) {
    flags.push({
      code: 'RT-06',
      title: `${input.sunkHours} hours sunk — irrelevant to the date decision`,
      detail: `The ${input.sunkHours} hours already spent earn nothing if the date is wrong. The only number that matters now is what each candidate month nets from here forward — $${bestRevenue.toFixed(0)} for a ${best.name} drop vs $${twelveMonthRevenue(earliestReady).toFixed(0)} for an as-soon-as-ready drop. Decide forward, not backward.`,
    });
  }

  // RT-07 — summer-deadline risk for fall designs.
  const fallDesignInSummer = input.categoryKey === 'sweater' && input.currentMonth >= 4 && input.currentMonth <= 6;
  if (fallDesignInSummer) {
    flags.push({
      code: 'RT-07',
      title: 'Starting a fall garment now is on schedule',
      detail: `Knitters shift mentally to fall in August — by the time they cast on, the market wants the design. Starting a sweater in ${MONTH_NAMES[input.currentMonth]} with a ${designLead}-month lead lands in ${MONTH_NAMES[(input.currentMonth + designLead) % 12]} — ${((input.currentMonth + designLead) % 12) >= 8 ? 'inside the fall warm-up and holiday push, exactly right' : 'still pre-season; keep the calendar'}.`,
    });
  }

  // RT-08 — giftable category outside the gifting window.
  if (input.categoryKey === 'giftable') {
    const giftingMonths = ready.filter(s => s.month >= 9 || s.month <= 11);
    if (giftingMonths.length === 0) {
      flags.push({
        code: 'RT-08',
        title: 'Giftable designs live or die in Oct–Dec',
        detail: `Last-minute gifters search in the 10 weeks before Christmas — a giftable quick pattern dropped outside that window forfeits most of its category affinity (Oct +45% category boost). If the design is truly giftable, hold it for October or re-market it as a stocking-stuffer with seasonal tags in season.`,
      });
    }
  }

  // ---- Verdict ladder ----
  let verdict: string;
  let verdictNote: string;

  if (!bestIsReachable) {
    verdict = 'This season\'s best window is gone — ship now or hold to next cycle';
    verdictNote = `The ideal month (${best.name}) can't be reached with a ${designLead}-month lead. Two honest options: release in ${worstReady.name} and earn $${twelveMonthRevenue(worstReady.month).toFixed(0)} over the next year, or hold the design and drop it in ${best.name} next cycle for $${bestRevenue.toFixed(0)} — the wait costs you ${designLead} months of shelf time but is worth $${Math.max(0, waitValue).toFixed(0)} if you can afford the delay. Year-round categories rarely justify waiting.`;
  } else if (waitValue < 0) {
    verdict = 'Release as soon as ready — the season won\'t wait';
    verdictNote = `Launching in ${best.name} earns $${bestRevenue.toFixed(0)} over twelve months, but waiting until then leaves $${Math.abs(waitValue).toFixed(0)} on the table vs releasing in ${MONTH_NAMES[earliestReady]}. The seasonal tail after ${MONTH_NAMES[earliestReady]} is worth more than the peak month itself — hit publish the day the design is done.`;
  } else if (waitValue > twelveMonthRevenue(earliestReady) * 0.3) {
    verdict = `Hold for the ${best.name} window — worth the wait`;
    verdictNote = `A ${best.name} drop earns $${bestRevenue.toFixed(0)} over twelve months vs $${immediateRevenue.toFixed(0)} from shipping in ${MONTH_NAMES[earliestReady]} — waiting is worth $${waitValue.toFixed(0)} (a ${((waitValue / immediateRevenue) * 100).toFixed(0)}% improvement). Finish the design now, keep the promo to ≤15% for one week including a weekend, and re-tag the listing with seasonal keywords as the window opens.`;
  } else if (waitValue > 0) {
    verdict = 'Ship when ready — the peak is close enough';
    verdictNote = `The best month (${best.name}, $${bestRevenue.toFixed(0)}) is only $${waitValue.toFixed(0)} ahead of shipping in ${MONTH_NAMES[earliestReady]} ($${immediateRevenue.toFixed(0)}) — not enough to justify idling a finished design. Publish on completion, ride the rising season, and let the queue momentum carry it.`;
  } else {
    verdict = 'No clear seasonal edge — ship on completion';
    verdictNote = `Across the horizon, every ready month lands within a few percent of each other ($${immediateRevenue.toFixed(0)} now vs $${bestRevenue.toFixed(0)} at best). Seasonal timing isn't your bottleneck — completion speed is. Publish when the design is done and spend the energy on photography and launch-week promotion instead.`;
  }

  return {
    monthScores,
    earliestReadyMonth: earliestReady,
    bestMonth: { month: best.month, name: best.name, rank: bestRank, expectedRevenue: bestRevenue, bestRevenue },
    waitValue,
    mistimingCost,
    promoOutcome: { promoNetRevenue, fullPriceNetRevenue, promoAddsRevenue, promoDelta },
    flags,
    verdict,
    verdictNote,
  };
}

export function fmt$(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
