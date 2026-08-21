import { LanguageCode } from './i18n';
import { PRICING_PSYCHOLOGY_COPY } from './pricing-psychology-copy';

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
  verdict: 'clean' | 'check' | 'fix';
  findingCounts: { error: number; warning: number; info: number };
  score: number;
}

export interface PricingPsychologyConfig {
  language?: LanguageCode;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function centsPart(n: number): number {
  return Math.round((n % 1) * 100);
}

function endsWith99(n: number): boolean {
  return centsPart(n) === 99;
}

function centsEndOdd(n: number): boolean {
  return centsPart(n) % 2 !== 0;
}

function centsEndEven(n: number): boolean {
  return centsPart(n) % 2 === 0;
}

/** Ending effect: fractional unit uplift (charm, low price, bargain/mainstream)
 *  or drag (charm at high price, quality-seeking buyer). */
function endingEffectFor(price: number, positioning: PricingPsychologyInput['tierPositioning']): number {
  if (positioning === 'premium') return -0.04;
  if (price < 20) return 0.08;
  return 0.03; // mainstream, higher price: small charm lift, diminishing
}

/** Left-digit change: how many units the left digit drops (10.00 → 9.99 = 1). */
function leftDigitDrop(current: number, candidate: number): number {
  return Math.max(0, Math.floor(current) - Math.floor(candidate));
}

function leftDigitLift(drop: number): number {
  return Math.min(drop, 2) * 0.03;
}

function platformNet(price: number, units: number, takeRate: number): number {
  return round2(price * units * (1 - Math.max(0, Math.min(1, takeRate))));
}

export function analyzePricingPsychology(input: PricingPsychologyInput, config: PricingPsychologyConfig = {}): PricingPsychologyResult {
  const lang = config.language || 'en';
  const copy = PRICING_PSYCHOLOGY_COPY[lang];
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

  // ---- Bundle comparison ----
  let bundle: BundleComparison | null = null;
  if (input.bundleSize > 1 && input.componentPrice > 0 && input.bundleCandidateTotal > 0) {
    const singleNet = platformNet(
      input.componentPrice,
      input.bundleSize * input.componentUnitsPerMonth,
      input.platformTakeRate,
    );
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

  // Barriers
  const floor = Math.floor(input.candidatePrice);
  const barriers = {
    below: Math.max(0, floor - (floor % 5)),
    above: Math.ceil((floor + 1) / 5) * 5,
  };

  // Recommended ending
  let recommendedEnding: PriceEnding = 'charm-99';
  if (input.tierPositioning === 'premium') recommendedEnding = 'round-00';
  else if (input.candidatePrice >= 20 && input.tierPositioning === 'mainstream') recommendedEnding = 'mixed';

  // ---- Flags ----

  // PP-01 — left-digit barrier
  const currentRounded = centsPart(input.currentPrice) === 0 && currentDrop === 1 && input.candidatePrice === input.currentPrice - 0.01;
  const sameDigitEdge = currentDrop === 0 && Math.floor(input.currentPrice) === Math.floor(input.candidatePrice) && centsPart(input.candidatePrice) >= 50;
  if (currentRounded || sameDigitEdge) {
    flags.push({
      code: 'PP-01',
      title: copy.findingPp01Title(currentRounded),
      detail: copy.findingPp01Detail(input.candidatePrice, Math.floor(input.candidatePrice), input.currentPrice, currentRounded),
    });
  }

  // PP-02 — charm ending flip
  if (endsWith99(input.candidatePrice) && input.candidatePrice >= 60) {
    flags.push({
      code: 'PP-02',
      title: copy.findingPp02Title,
      detail: copy.findingPp02Detail(input.candidatePrice, Math.round(input.candidatePrice)),
    });
  }

  // PP-03 — premium/bargain mismatch
  if (input.tierPositioning === 'premium' && endsWith99(input.candidatePrice)) {
    flags.push({
      code: 'PP-03',
      title: copy.findingPp03Title,
      detail: copy.findingPp03Detail(input.patternName, input.candidatePrice, Math.ceil(input.candidatePrice)),
    });
  }

  // PP-04 — shop anchors
  if (input.multiTierShop && input.shopTiers.length > 0 && input.shopTiers.every(t => t <= input.candidatePrice)) {
    flags.push({
      code: 'PP-04',
      title: copy.findingPp04Title,
      detail: copy.findingPp04Detail(input.candidatePrice),
    });
  }

  // PP-05 — decoy gap
  if (input.multiTierShop && input.shopTiers.length >= 2) {
    const sorted = [...input.shopTiers, input.currentPrice].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] > 0 && (sorted[i] - sorted[i - 1]) / sorted[i] < 0.1) {
        flags.push({
          code: 'PP-05',
          title: copy.findingPp05Title,
          detail: copy.findingPp05Detail(sorted[i - 1], sorted[i]),
        });
        break;
      }
    }
  }

  // PP-06 — barrier-less cut
  if (input.candidatePrice < input.currentPrice && leftDigitDrop(input.currentPrice, input.candidatePrice) === 0) {
    const pct = round2((1 - input.candidatePrice / Math.max(0.01, input.currentPrice)) * 100);
    flags.push({
      code: 'PP-06',
      title: copy.findingPp06Title(input.candidatePrice, pct, input.currentPrice, Math.floor(input.candidatePrice)), // Call with all params, interface now allows it
      detail: copy.findingPp06Detail(input.candidatePrice, pct, input.currentPrice, Math.floor(input.candidatePrice)),
    });
  }

  const findingCounts = {
    error: flags.filter(f => f.code === 'PP-01' || f.code === 'PP-02').length, // PP-01 is often a warning but treated as high priority here
    warning: flags.filter(f => f.code === 'PP-03' || f.code === 'PP-04' || f.code === 'PP-05').length,
    info: flags.filter(f => f.code === 'PP-06').length,
  };

  const score = Math.max(0, 100 - flags.length * 15);
  const verdict = findingCounts.error > 0 ? 'fix' : findingCounts.warning > 0 ? 'check' : 'clean';

  return {
    current: currentOutcome,
    candidate: candidateOutcome,
    bundle,
    highestShopAnchor,
    recommendedEnding,
    barriers,
    flags,
    verdict,
    findingCounts,
    score,
  };
}

export function estimateEditorSavings(result: PricingPsychologyResult, timeValue: number, lang: LanguageCode = 'en') {
  const copy = PRICING_PSYCHOLOGY_COPY[lang];
  const lift = result.candidate.monthlyNet - result.current.monthlyNet;
  const savings = Math.max(0, Math.round(lift));
  const pending = result.flags.length;
  const note = pending > 0 ? copy.savingsNote(pending) : copy.cleanSavingsNote;
  return { savings, note };
}

export function generatePreEditSummary(input: PricingPsychologyInput, result: PricingPsychologyResult, lang: LanguageCode = 'en'): string {
  const copy = PRICING_PSYCHOLOGY_COPY[lang];
  const lines = [
    copy.preEditSummaryHeader(input.patternName),
    `${copy.tierPositioningLabel}: ${input.tierPositioning}`,
    `${copy.currentPriceLabel}: $${input.currentPrice.toFixed(2)} | ${copy.candidatePriceLabel}: $${input.candidatePrice.toFixed(2)}`,
    copy.auditScoreLabel(result.score, result.verdict),
    '',
    copy.alreadyCheckedLabel,
    ...copy.checkedItems.map(item => `  • ${item}`),
    '',
    copy.outstandingItemsLabel(result.flags.length),
    ...result.flags.map(f => `  • [${f.code}] ${f.title} — ${f.detail}`),
    '',
    copy.prosePassLabel,
    copy.prosePassDetails,
  ];
  return lines.join('\n');
}
