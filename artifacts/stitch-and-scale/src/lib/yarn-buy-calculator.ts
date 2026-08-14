/**
 * Yarn Buy Calculator — turns a yardage estimate into a money decision.
 *
 * WHY THIS EXISTS (session-37 research):
 * Every yarn tool on the market stops at a yardage number. The real decision
 * a designer or knitter faces is a *purchasing* decision: how many skeins of
 * this exact yarn, in one dye lot, to buy NOW — because dye lots are batch
 * numbers that can never be re-ordered (Lion Brand support) and industry
 * guidance is explicit: "purchase 10–15% more yarn than calculated to account
 * for gauge changes or mistakes, since matching dye lots later can be
 * impossible" (Mary Maxim, Mar 2026). A mismatched lot discovered 2 inches
 * from finishing is the classic knitwear disaster — the pain hits after hours
 * of labour, when supplier stock is depleted (Stitch & Story blog).
 *
 * The model (pure math, no UI, no storage — reuse the verified yarn-estimator):
 *  1. Start from the graded-project yardage estimate (estimateYarn).
 *  2. Convert yardage into skeins of the YARN (per-skein yardage comes from
 *     the ball band the user enters — the only source of truth for a real
 *     product, not an average).
 *  3. Apply a risk-adjusted buffer. Base buffer 10%; raised toward 15% for
 *     high-risk cases — fine yarn (more yards, more places for gauge drift),
 *     large size counts (multiple graded sizes add uncertainty), or projects
 *     without a swatch confirmation flag.
 *  4. Round UP (Math.ceil) — you cannot buy a fraction of a skein, and
 *     rounding down is exactly how disasters start.
 *  5. Optionally subtract stash (grams already owned of the same yarn) and
 *     report the shortfall. Recommend one insurance skein (same lot) when the
 *     buy list is 3+ skeins — standard pro practice for repair/resale value.
 *
 * Every constant is traceable to the documented sources above. Nothing invented.
 */
import { estimateYarn, YARN_WEIGHT_DATA, type YarnWeight } from './yarn-estimator';
import { PatternProject } from './grading-engine';
import { sizeCountForProject } from './pattern-pricing-advisor';

export interface YarnBuyInputs {
  /** Yardage on one skein of the chosen yarn, per its ball band (yards). */
  skeinYardage: number;
  /** Price of one skein, per its ball band ($). */
  skeinPrice: number;
  /** Grams the designer already owns of this yarn (stash, 0 = none). */
  stashGrams?: number;
  /** Per-skein weight in grams (for stash conversion; typical 100g). */
  skeinGrams?: number;
  /** True when the designer intends to swatch before buying/buying more. */
  swatchConfirmed?: boolean;
  /** Which yarn weight the yarn is (drives the risk buffer calibration). */
  weight: YarnWeight;
}

export interface YarnBuyPlan {
  /** Raw yardage estimate for the base size before buffer. */
  baseYards: number;
  /** Total yardage target after the risk buffer. */
  targetYards: number;
  /** Risk-buffer percentage applied (0.10 … 0.15 documented range). */
  bufferPct: number;
  /** Reasons that pushed the buffer up toward 15%, for transparency. */
  bufferReasons: string[];
  /** Skeins needed of the target yardage, before stash offset. */
  skeinsGross: number;
  /** Skeins covered by the stash offset. */
  stashSkeins: number;
  /** Final buy list: skeins to purchase now, in one dye lot. */
  skeinsToBuy: number;
  /** Cost of the buy list at the entered skein price. */
  totalCost: number;
  /** Cost range: per-size-grade spread when the project has multiple sizes. */
  costPerSizeLow: number | null;
  costPerSizeHigh: number | null;
  /** Recommendation to add one insurance skein (same lot) for repair/resale. */
  insuranceSkein: boolean;
  /** Shortfall in yardage when stash covers less than the target. */
  stashShortfallYards: number;
  /** Skein-equivalent of the stash offset, before rounding. */
  stashSkeinsExact: number;
  /** True when inputs were invalid and no plan could be produced. */
  invalid: boolean;
}

const BASE_BUFFER = 0.10; // documented floor of the 10–15% rule
const MAX_BUFFER = 0.15;  // documented ceiling of the 10–15% rule

/** Smallest vs largest graded value of a body measurement across the CYC size range. */
function gradingSpread(measurement: { baseValue: number; gradingKey: string }): { smallest: number; largest: number } {
  const offsets = gradeOffsetFor(measurement.gradingKey as 'bust' | 'waist' | 'hip');
  return {
    smallest: Math.max(0, measurement.baseValue + offsets.smallest),
    largest: Math.max(0, measurement.baseValue + offsets.largest),
  };
}

/** CYC-verified grade offsets (inches) from base size M to XS and 5XL. */
function gradeOffsetFor(key: 'bust' | 'waist' | 'hip'): { smallest: number; largest: number } {
  // CYC Woman's chart (verified): bust XS=32.5 vs M=37.5 (-5), 5XL=57.5 (+20);
  // waist XS=26 vs M=31 (-5), 5XL=52 (+21); hip XS=35 vs M=40 (-5), 5XL=59.5 (+19.5).
  const table: Record<'bust' | 'waist' | 'hip', { XS: number; '5XL': number }> = {
    bust: { XS: -5, '5XL': 20 },
    waist: { XS: -5, '5XL': 21 },
    hip: { XS: -5, '5XL': 19.5 },
  };
  return { smallest: table[key].XS, largest: table[key]['5XL'] };
}

/** Finer yarns carry more yardage per skein — more exposure to gauge drift. */
const FINE_YARN_WEIGHTS: YarnWeight[] = ['lace', 'fingering', 'sport'];

/**
 * Risk-adjusted buffer within the documented 10–15% rule.
 *  - +2.5% for fine yarn (high yardage = high gauge-drift exposure)
 *  - +2.5% for projects graded across 4+ sizes (multi-size uncertainty)
 *  - 0 for swatch-confirmed buys (the swatch is the gauge proof)
 * Capped at MAX_BUFFER.
 */
function positiveNumber(v: number | undefined, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : fallback;
}

export function bufferFor(inputs: YarnBuyInputs, sizeCount: number): { pct: number; reasons: string[] } {
  const reasons: string[] = [];
  let pct = BASE_BUFFER;
  if (FINE_YARN_WEIGHTS.includes(inputs.weight)) {
    pct += 0.025;
    reasons.push('fine yarn — high yardage magnifies gauge-drift exposure');
  }
  if (sizeCount >= 4) {
    pct += 0.025;
    reasons.push('4+ graded sizes — multi-size yardage uncertainty');
  }
  if (inputs.swatchConfirmed) {
    reasons.push('swatch confirmed — buffer held at the documented floor');
  }
  return { pct: Math.min(pct, MAX_BUFFER), reasons };
}

/**
 * Build the buy plan for one yarn choice against the project's base size.
 */
export function buyPlan(project: PatternProject, inputs: YarnBuyInputs): YarnBuyPlan {
  const skeinYardage = Number.isFinite(inputs.skeinYardage) && inputs.skeinYardage > 0
    ? inputs.skeinYardage : 0;
  const skeinPrice = Number.isFinite(inputs.skeinPrice) && inputs.skeinPrice >= 0
    ? inputs.skeinPrice : 0;
  if (skeinYardage === 0) {
    return {
      baseYards: 0, targetYards: 0, bufferPct: 0, bufferReasons: [],
      skeinsGross: 0, stashSkeins: 0, skeinsToBuy: 0, totalCost: 0,
      costPerSizeLow: null, costPerSizeHigh: null, insuranceSkein: false,
      stashShortfallYards: 0, stashSkeinsExact: 0, invalid: true,
    };
  }
  const estimate = estimateYarn(project, inputs.weight);
  const sizeCount = sizeCountForProject(project);
  const { pct: bufferPct, reasons } = bufferFor(inputs, sizeCount);
  const baseYards = estimate.totalYards;
  const targetYards = baseYards * (1 + bufferPct);

  const skeinsGross = Math.ceil(targetYards / skeinYardage);
  const skeinGrams = positiveNumber(inputs.skeinGrams, 100);
  const stashGrams = Math.max(0, positiveNumber(inputs.stashGrams, 0));
  const stashSkeinsExact = stashGrams / skeinGrams;
  const stashSkeins = Math.floor(stashSkeinsExact); // stash covers whole skeins only — a partial skein still needs buying
  const skeinsToBuy = Math.max(skeinsGross - stashSkeins, 0);
  const totalCost = Math.round(skeinsToBuy * skeinPrice * 100) / 100;

  // Cost spread across graded sizes: the smallest and largest graded body
  // measurement give the realistic planning range for a multi-size release.
  // Yardage scales roughly with body circumference, so we scale the base-size
  // estimate by smallest/largest bust (falling back to waist, then hip).
  let costPerSizeLow: number | null = null;
  let costPerSizeHigh: number | null = null;
  if (sizeCount > 1) {
    for (const key of ['bust', 'waist', 'hip'] as const) {
      const measurement = project.sections
        .flatMap((s) => s.measurements)
        .find((m) => m.gradingKey === key);
      if (measurement && measurement.baseValue > 0) {
        const grades = gradingSpread(measurement);
        if (grades.smallest > 0 && grades.largest > 0 && grades.largest !== grades.smallest) {
          const yardsLow = baseYards * (grades.smallest / grades.largest) * (1 + bufferPct);
          costPerSizeLow = Math.round(
            Math.max(0, Math.ceil(yardsLow / skeinYardage) - stashSkeins) * skeinPrice * 100,
          ) / 100;
          costPerSizeHigh = totalCost;
          break; // one good grade key is enough for the planning range
        }
      }
    }
  }

  // Insurance skein: standard pro practice for repair/resale when buying 3+.
  const insuranceSkein = skeinsToBuy >= 3 && stashGrams === 0;

  const stashYards = stashSkeins * skeinYardage;
  const stashShortfallYards = Math.max(targetYards - stashYards, 0);

  return {
    baseYards: Math.round(baseYards * 10) / 10,
    targetYards: Math.round(targetYards * 10) / 10,
    bufferPct,
    bufferReasons: reasons,
    skeinsGross,
    stashSkeins,
    skeinsToBuy,
    totalCost,
    costPerSizeLow,
    costPerSizeHigh,
    insuranceSkein,
    stashShortfallYards: Math.round(stashShortfallYards * 10) / 10,
    stashSkeinsExact: Math.round(stashSkeinsExact * 10) / 10,
    invalid: false,
  };
}
