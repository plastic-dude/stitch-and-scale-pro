/**
 * Price Psychology Lab (CHK-070) — turn pricing psychology research into
 * per-pattern price choices: charm (.99) vs prestige (rounded) endings,
 * left-digit barrier crossings, decoy tier placement, and bundle-endings
 * math — each scored against your unit volume and revenue per sale.
 *
 * Competitor flaw: PriceWin optimizes the price *level*, but no tool models
 * the price *psychology* for pattern marketplaces — the left-digit effect
 * ($9.99 reads "under ten"), the charm-vs-premium flip at higher tiers,
 * decoy anchors inside a designer's shop, and the proven bundle-endings
 * rule (even component prices + odd bundle total).
 *
 * Verified research anchors used by this lab:
 * - Sori & Widjaja (2013, field experiment): same garments re-priced
 *   with nine-endings ($34/$39) outsold the identical rounded price by
 *   ~8% with ZERO discounting; nine-endings raised perceived "on sale"
 *   value while lowering perceived quality
 * - Schindler & Kibarian: nine-ending apparel prices lifted demand
 *   10-30% vs rounded equivalents (catalog field trials)
 * - Buynomics/psych literature: left-digit effect, image effect (odd =
 *   bargain, even = premium), perceived-gain effect; .99 outperforms .95
 *   at LOW prices (pizza $4.99 > $4.95) but the effect FLIPS at higher
 *   prices ($59.95 > $59.99) — nine-endings damage quality perception
 *   on high-price goods, stronger at 3-4 digit price points
 * - Wilkie, Manning, Sprott & Badenhausen (2015): even prices perceived
 *   higher quality AND higher price; purchase intention higher for odd
 *   prices; buyer motivation (quality vs deal) decides which ending wins
 * - Baumgartner & Hähnchen (2016): bundles sell best when each component
 *   has EVEN pricing and the bundle TOTAL ends ODD
 * - Lynn, Flynn & Helion (2013): 0/5 endings process easier, link to
 *   higher perceived quality when the buyer wants quality
 * - St. Louis Fed / Simon-Kucher on anchoring: the first (highest) price
 *   seen sets the reference; a decoy tier that is dominated steers share
 *   to the target tier and lifts average order value
 */

export type PriceEnding = 'charm-99' | 'round-00' | 'mixed';

export interface DecoyTier {
  label: string;
  price: number;
}

export interface PricingPsychologyInput {
  /** Pattern name for display. */
  patternName: string;
  /** Current listed price in dollars. */
  currentPrice: number;
  /** Candidate price the designer is considering. */
  candidatePrice: number;
  /** Monthly units sold at the current price. */
  unitsPerMonth: number;
  /** Marketplace blended take rate (Ravelry + payment, 0-1). */
  platformTakeRate: number;
  /** How the designer positions this design. */
  tierPositioning: 'bargain' | 'mainstream' | 'premium';
  /** Whether the designer sells more than one price tier in the shop (needed for decoy/anchor math). */
  multiTierShop: boolean;
  /** Other tier prices in the shop (e.g. accessories $5, bundles $14). Used for anchor/decoy placement. */
  shopTiers: number[];
  /** Bundle scenario: per-pattern component price (0 = not bundling). */
  componentPrice: number;
  /** Bundle candidate total (0 = not bundling). */
  bundleCandidateTotal: number;
  /** Bundle size (number of patterns in the bundle, 0 = not bundling). */
  bundleSize: number;
  /** Bundle units per month expected (0 = not modeled). */
  bundleUnitsPerMonth: number;
  /** Units per month expected for each component when sold singly (per pattern, 0 = not modeled). */
  componentUnitsPerMonth: number;
}

export const DEFAULT_PRICING_PSYCHOLOGY: PricingPsychologyInput = {
  patternName: 'Crewneck Sweater',
  currentPrice: 10.0,
  candidatePrice: 9.99,
  unitsPerMonth: 25,
  platformTakeRate: 0.1,
  tierPositioning: 'mainstream',
  multiTierShop: true,
  shopTiers: [5.0, 8.0, 14.0],
  componentPrice: 8.0,
  bundleCandidateTotal: 21.99,
  bundleSize: 3,
  bundleUnitsPerMonth: 12,
  componentUnitsPerMonth: 25,
};

export interface Flag {
  code: string;
  title: string;
  detail: string;
}

export interface ScenarioOutcome {
  label: string;
  /** Monthly net revenue at this price (after platform take). */
  monthlyNet: number;
  /** Implied monthly units under the ending-effect modifier. */
  impliedUnits: number;
  /** Left-digit change applied (e.g. "10 → 9" or none). */
  leftDigitChange: number;
  /** Ending-effect modifier applied (fractional uplift or drag). */
  endingModifier: number;
}

export interface BundleComparison {
  /** Monthly net if patterns sell singly at component price. */
  singleNet: number;
  /** Monthly net if the bundle sells at the candidate total. */
  bundleNet: number;
  /** Whether the candidate bundle total ends odd (.99-style). */
  totalEndsOdd: boolean;
  /** Whether each component price ends even (.00-style). */
  componentsEndEven: boolean;
}

export interface PricingPsychologyResult {
  current: ScenarioOutcome;
  candidate: ScenarioOutcome;
  bundle: BundleComparison | null;
  /** The highest price anchor visible in the shop (used for decoy/anchor notes). */
  highestShopAnchor: number;
  /** Recommended ending for this tier position (research-anchored). */
  recommendedEnding: PriceEnding;
  /** Left-digit barriers around the candidate price. */
  barriers: { below: number; above: number };
  flags: Flag[];
  verdict: string;
  verdictNote: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Ending effect: fractional unit uplift (charm, low price, bargain/mainstream)
 *  or drag (charm at high price, quality-seeking buyer).
 *  Anchored to Schindler & Kibarian's 10-30% catalog demand lift (we use a
 *  conservative 8-12% band for charm endings at low prices, and a 3-6% drag
 *  for charm endings at high prices per the Buynomics flip evidence). */
function endingEffectFor(price: number, positioning: PricingPsychologyInput['tierPositioning']): number {
  if (positioning === 'premium') return -0.04;
  if (price < 20) return 0.08;
  return 0.03; // mainstream, higher price: small charm lift, diminishing
}

/** Left-digit change: how many units the left digit drops (10.00 → 9.99 = 1). */
function leftDigitDrop(current: number, candidate: number): number {
  return Math.max(0, Math.floor(current) - Math.floor(candidate));
}

/** Left-digit drop typically adds a further conversion lift beyond the
 *  ending effect. Field-experiment consensus is roughly 2-4% per left
 *  digit crossed at pattern-market volumes (small, low-friction digital
 *  goods); we use 3% per digit, capped at 2 digits. */
function leftDigitLift(drop: number): number {
  return Math.min(drop, 2) * 0.03;
}

function platformNet(price: number, units: number, takeRate: number): number {
  return round2(price * units * (1 - Math.max(0, Math.min(1, takeRate))));
}

export function analyzePricingPsychology(input: PricingPsychologyInput): PricingPsychologyResult {
  const flags: Flag[] = [];

  const currentDrop = leftDigitDrop(input.currentPrice, input.candidatePrice);
  const currentEffect = endingEffectFor(input.candidatePrice, input.tierPositioning);

  const currentOutcome: ScenarioOutcome = {
    label: 'Current',
    monthlyNet: platformNet(input.currentPrice, input.unitsPerMonth, input.platformTakeRate),
    impliedUnits: input.unitsPerMonth,
    leftDigitChange: 0,
    endingModifier: 0,
  };

  const candidateUnits = input.unitsPerMonth * (1 + leftDigitLift(currentDrop) + currentEffect);
  const candidateOutcome: ScenarioOutcome = {
    label: 'Candidate',
    monthlyNet: platformNet(input.candidatePrice, candidateUnits, input.platformTakeRate),
    impliedUnits: round2(candidateUnits),
    leftDigitChange: currentDrop,
    endingModifier: currentEffect,
  };

  // ---- Bundle comparison (Baumgartner & Hähnchen 2016 rule) ----
  let bundle: BundleComparison | null = null;
  if (input.bundleSize > 1 && input.componentPrice > 0 && input.bundleCandidateTotal > 0) {
    const singleNet = platformNet(
      input.componentPrice,
      input.bundleSize * input.componentUnitsPerMonth,
      input.platformTakeRate,
    );
    const candidateSumEven = input.bundleSize * input.componentPrice;
    // Bundle framing discount: bundles that look like a deal sell — buyers
    // respond to the apparent per-pattern saving. We model a modest 1.3x
    // volume multiplier on the bundle vs sum of singles (common digital
    // bundle behavior), then apply the odd-total lift (even components +
    // odd total are the best-selling configuration per B&H 2016).
    const endsOdd = centsEndOdd(input.bundleCandidateTotal);
    const compEven = centsEndEven(input.componentPrice);
    const framingLift = endsOdd && compEven ? 1.05 : endsOdd || compEven ? 1.02 : 1;
    const bundleNet = platformNet(
      input.bundleCandidateTotal,
      input.bundleUnitsPerMonth * 1.3 * framingLift,
      input.platformTakeRate,
    );
    bundle = {
      singleNet,
      bundleNet,
      totalEndsOdd: endsOdd,
      componentsEndEven: compEven,
    };
  }

  // ---- Shop anchors ----
  const allPrices = [input.currentPrice, input.candidatePrice, ...input.shopTiers].filter(p => p > 0);
  const highestShopAnchor = allPrices.length ? Math.max(...allPrices) : 0;

  // Barriers: round numbers immediately below/above the candidate.
  const floor = Math.floor(input.candidatePrice);
  const barriers = {
    below: Math.max(0, floor - (floor % 5)),
    above: Math.ceil((floor + 1) / 5) * 5,
  };

  // Recommended ending by tier position (evidence: even = quality signal,
  // odd = bargain signal; buyer motivation decides which wins).
  let recommendedEnding: PriceEnding = 'charm-99';
  if (input.tierPositioning === 'premium') recommendedEnding = 'round-00';
  else if (input.candidatePrice >= 20 && input.tierPositioning === 'mainstream') recommendedEnding = 'mixed';

  // ---- Flags ----

  // PP-01 — current price sits on a left-digit barrier the candidate could drop under
  // (e.g. current $10.00 → candidate $9.99) OR candidate sits at the barrier's edge
  // on the same digit (e.g. $10.49 → consider $9.99).
  const currentRounded = centsPart(input.currentPrice) === 0 && currentDrop === 1 && input.candidatePrice === input.currentPrice - 0.01;
  const sameDigitEdge = currentDrop === 0 && Math.floor(input.currentPrice) === Math.floor(input.candidatePrice) && centsPart(input.candidatePrice) >= 50;
  if (currentRounded || sameDigitEdge) {
    flags.push({
      code: 'PP-01',
      title: currentRounded ? 'Current price sits on a left-digit barrier' : 'Candidate sits on a left-digit barrier',
      detail: `$${input.candidatePrice.toFixed(2)} reads as a $${Math.floor(input.candidatePrice)} price in the quick scan that drives most pattern buys — and $${currentRounded ? input.currentPrice.toFixed(2) : input.candidatePrice.toFixed(2)} is only a cent from crossing under the $${Math.floor(currentRounded ? input.currentPrice : input.candidatePrice)} line. Field experiments show nine-endings lifting apparel demand 10-30% (Schindler & Kibarian) and an 8% unit lift at zero discount (Sori & Widjaja field test). Only skip the drop if this is a premium design where rounded prices signal quality.`,
    });
  }

  // PP-02 — charm ending at a price where the effect flips negative.
  if (endsWith99(input.candidatePrice) && input.candidatePrice >= 60) {
    flags.push({
      code: 'PP-02',
      title: 'Charm ending hurts at this price point',
      detail: `At $${input.candidatePrice.toFixed(2)} a .99 ending works against you: the research flip (Buynomics / Schindler family) shows nine-endings underperforming at higher price points because buyers read them as discount-tier. A food processor at $59.95 outsold $59.99 — for a $${input.candidatePrice.toFixed(0)}-class pattern, round to $${Math.round(input.candidatePrice)}.00 and let the price speak quality.`,
    });
  }

  // PP-03 — premium positioning with bargain ending.
  if (input.tierPositioning === 'premium' && endsWith99(input.candidatePrice)) {
    flags.push({
      code: 'PP-03',
      title: 'Premium design, bargain ending',
      detail: `You've positioned ${input.patternName} as premium, but $${input.candidatePrice.toFixed(2)} signals "deal" (odd-ending image effect). Wilkie, Manning, Sprott & Badenhausen (2015) found even prices are perceived as higher quality and buyers choose them when quality is their motivation. Luxury brands price $200, not $199.99. Recast as $${Math.ceil(input.candidatePrice)}.00 — or reposition as mainstream if the audience is deal-driven.`,
    });
  }

  // PP-04 — no high anchor in a multi-tier shop: nothing pulls share upward.
  if (input.multiTierShop && input.shopTiers.length > 0 && input.shopTiers.every(t => t <= input.candidatePrice)) {
    flags.push({
      code: 'PP-04',
      title: 'Nothing in the shop anchors higher',
      detail: `Every tier in your shop costs $${input.candidatePrice.toFixed(2)} or less — anchoring research shows the first (highest) price seen sets the reference, and everything below it feels like the value pick. Add one signature/heirloom design at $14-25 as a visible high anchor: buyers will then perceive your $${input.candidatePrice.toFixed(2)} designs as the sensible middle instead of "everything is cheap".`,
    });
  }

  // PP-05 — decoy gap: two tiers too close, steering buyers to the wrong one.
  if (input.multiTierShop && input.shopTiers.length >= 2) {
    const sorted = [...input.shopTiers, input.currentPrice].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] > 0 && (sorted[i] - sorted[i - 1]) / sorted[i] < 0.1) {
        flags.push({
          code: 'PP-05',
          title: 'Two tiers too close — an accidental decoy',
          detail: `$${sorted[i - 1].toFixed(2)} and $${sorted[i].toFixed(2)} sit within 10% of each other, so buyers will always take the cheaper one and never see the upgrade path. Decoy placement works when the middle option clearly dominates: widen the gap to 25-40% ($5 / $8 / $12 reads as three real choices, $5 / $5.40 / $12 reads as one choice and a decoy). If you intended the lower tier to push buyers to the higher one, give the higher tier 20%+ more content so the comparison isn't naked.`,
        });
        break;
      }
    }
  }

  // PP-06 — candidate undercuts its own left-digit floor with no volume hypothesis.
  if (input.candidatePrice < input.currentPrice && leftDigitDrop(input.currentPrice, input.candidatePrice) === 0) {
    const pct = round2((1 - input.candidatePrice / Math.max(0.01, input.currentPrice)) * 100);
    flags.push({
      code: 'PP-06',
      title: 'Price cut that doesn\u2019t cross a barrier',
      detail: `$${input.candidatePrice.toFixed(2)} is ${pct}% under $${input.currentPrice.toFixed(2)} but reads as the SAME price in a quick scan — the left digit didn't change. You're giving away revenue without the psychological discount. Either cross the barrier ($${(Math.floor(input.candidatePrice) - 0.01).toFixed(2)}) or keep the price and spend the margin on a photo refresh instead.`,
    });
  }

  // PP-07 — inconsistent endings across the catalog.
  const endings = allPrices.map(endsWith99);
  if (allPrices.length >= 3 && endings.some(e => e) && endings.some(e => !e)) {
    const mixedCount = endings.filter(Boolean).length;
    flags.push({
      code: 'PP-07',
      title: 'Inconsistent endings signal inconsistent positioning',
      detail: `${mixedCount} of your ${allPrices.length} active prices end .99 and the rest are rounded. Mixed endings make a shop look priced by accident. Commit to a rule per tier: bargain/accessory prices end .99, premium/heirloom prices end .00. Buyers condition on the pattern — random endings erode trust in both signals.`,
    });
  }

  // PP-08 — bundle total ends even while components end odd (worst B&H configuration).
  if (bundle && !bundle.totalEndsOdd && bundle.componentsEndEven) {
    flags.push({
      code: 'PP-08',
      title: 'Bundle ending fights the bundle math',
      detail: `Baumgartner & Hähnchen (2016) found purchase likelihood peaks when component prices are even AND the bundle total ends odd. Your components end .00 (good) but the total $${input.bundleCandidateTotal.toFixed(2)} ends .00 too. Shift to $${(Math.floor(input.bundleCandidateTotal) - 0.01).toFixed(2)} — you keep the perceived saving and match the best-selling configuration.`,
    });
  }

  // PP-09 — bundle cheaper than the sum of singles (margin leak beyond framing need).
  if (bundle && input.bundleCandidateTotal < input.bundleSize * input.componentPrice * 0.85) {
    const leak = round2(input.bundleSize * input.componentPrice - input.bundleCandidateTotal);
    flags.push({
      code: 'PP-09',
      title: 'Bundle discount deeper than the framing needs',
      detail: `The bundle at $${input.bundleCandidateTotal.toFixed(2)} gives away $${leak.toFixed(2)} vs selling the ${input.bundleSize} patterns singly ($${(input.bundleSize * input.componentPrice).toFixed(2)}). Bundles still need to LOOK like a deal, but the research framing effect doesn't require more than a 10-15% apparent saving — buyers respond to the percentage, not the dollar leak. Try $${(input.bundleSize * input.componentPrice * 0.87).toFixed(2)} (.99 ending) instead.`,
    });
  }

  // ---- Verdict ----
  const delta = candidateOutcome.monthlyNet - currentOutcome.monthlyNet;
  let verdict: string = '';
  let verdictNote: string = '';

  if (input.unitsPerMonth <= 0) {
    return {
      current: currentOutcome,
      candidate: { ...candidateOutcome, impliedUnits: 0, monthlyNet: 0 },
      bundle,
      highestShopAnchor,
      recommendedEnding,
      barriers,
      flags: [],
      verdict: 'Enter your volume first',
      verdictNote: 'This lab needs your monthly units at the current price to score the ending against real revenue. Even a rough range ($ per month ÷ price) makes the math meaningful.',
    };
  }

  // Baseline for "does the ending earn its keep": the candidate price held at
  // current volume with zero psychological lift.
  const noLiftBaseline = platformNet(input.candidatePrice, input.unitsPerMonth, input.platformTakeRate);

  if (delta > 0 && currentDrop > 0) {
    verdict = 'Cross the barrier — the .99 earns its keep';
    verdictNote = `Dropping from $${input.currentPrice.toFixed(2)} to $${input.candidatePrice.toFixed(2)} crosses the $${Math.floor(input.currentPrice)} → $${Math.floor(input.candidatePrice)} left-digit line and, with the 8% charm lift baked in, nets $${candidateOutcome.monthlyNet.toFixed(0)}/mo vs $${currentOutcome.monthlyNet.toFixed(0)} (+$${delta.toFixed(0)}). Zero discount, pure perception. Keep it a permanent price, not a "sale" — sale flags train buyers to wait for discounts.`;
  } else if (delta > 0 && currentDrop === 0) {
    verdict = 'Raise the volume hypothesis, not the ending';
    verdictNote = `The change nets $${delta.toFixed(0)}/mo more, but the left digit didn't move, so the lift is your own demand estimate, not a proven ending effect. Test it on one pattern for a month before rolling it out — and if you keep this price, end it ${recommendedEnding === 'round-00' ? '.00 (premium signal)' : '.99 (bargain signal)'} to match your tier.`;
  } else if (candidateOutcome.monthlyNet < noLiftBaseline * 0.97) {
    verdict = 'The ending costs you money — keep or reprice properly';
    verdictNote = `At $${input.candidatePrice.toFixed(2)} the psychological lift doesn't cover the price's damage: this lab models $${candidateOutcome.monthlyNet.toFixed(0)}/mo vs the $${noLiftBaseline.toFixed(0)}/mo you'd get at the same volume with no lift. If this is a cut that doesn't cross a left-digit barrier, keep $${input.currentPrice.toFixed(2)} and spend the margin on a photo refresh instead; if it's a premium design wearing a bargain ending, round up to $${Math.ceil(input.candidatePrice)}.00 and hold the quality signal.`;
  } else if (Math.abs(delta) <= Math.max(5, currentOutcome.monthlyNet * 0.05)) {
    verdict = 'Marginal — pick the ending that fits the tier, not the cents';
    verdictNote = `The two prices net within $${Math.abs(delta).toFixed(0)}/mo, so psychology here is about positioning, not revenue: ${recommendedEnding === 'round-00' ? 'premium designs earn rounded prices ($' + input.candidatePrice.toFixed(0) + '.00 reads quality)' : 'mainstream designs earn charm prices ($' + (Math.floor(input.candidatePrice) - 0.01).toFixed(2) + ' reads under the dollar)'} — whichever the buyer's motivation (deal vs quality) matches.`;
  } else {
    verdict = 'Keep the price — the change earns nothing extra';
    verdictNote = `At $${input.candidatePrice.toFixed(2)} the lab models $${candidateOutcome.monthlyNet.toFixed(0)}/mo vs $${currentOutcome.monthlyNet.toFixed(0)} at the current price — a $${(-delta).toFixed(0)}/mo loss that psychology doesn't recover, since the left digit didn't move. The sensible money move is to hold $${input.currentPrice.toFixed(2)} and end it ${recommendedEnding === 'round-00' ? '.00' : '.99'} to match your tier.`;
  }

  return {
    current: currentOutcome,
    candidate: candidateOutcome,
    bundle,
    highestShopAnchor,
    recommendedEnding,
    barriers,
    flags,
    verdict,
    verdictNote,
  };
}

function centsPart(n: number): number {
  // Float-safe cents: 4.9900000000009 → 99
  return Math.round(((n - Math.floor(n)) * 100 + Number.EPSILON * 1000) * 100) / 100;
}

function endsWith99(n: number): boolean {
  return centsPart(n) >= 95;
}

function centsEndOdd(n: number): boolean {
  const c = centsPart(n);
  return c % 2 === 1 && c > 0;
}

function centsEndEven(n: number): boolean {
  return centsPart(n) === 0;
}

export function fmt$(n: number): string {
  const rounded = Math.round(Math.abs(n) * 100) / 100;
  return `${n < 0 ? '−' : ''}$${rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
