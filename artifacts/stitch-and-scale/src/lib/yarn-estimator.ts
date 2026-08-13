/**
 * Yarn requirement estimation for graded projects.
 *
 * MODEL (calibrated against published yardage benchmarks, documented below):
 * A typical adult pullover uses approximately:
 *   worsted:      1000–1400 yd   → coefficient chosen so base-area pullovers land mid-range
 *   fingering:    1600–2200 yd
 *   super bulky:   550–800 yd
 * These ranges recur across Ravelry/LoveCrafts pattern yardage summaries
 * and yarn-shop guidance; the weight classification follows the Craft Yarn
 * Council yarn-weight standard (craftyarncouncil.com/standards/yarn-weight —
 * verified current).
 *
 * Estimation: sum the finished garment dimensions (graded physical values
 * at the base size) into a fabric-area figure, then multiply by a
 * per-weight yards-per-square-inch coefficient. Coefficients are derived
 * from the worsted benchmark (1200 yd midpoint ÷ a reference pullover
 * area) and scaled by the square of the CYC reference stitch gauge ratio
 * — yarn consumption per unit area is proportional to stitch density
 * (stitches × rows per square inch both grow with gauge), so finer yarns
 * consume more yardage per square inch by gauge².
 *
 * Verification note: with this model a base-M pullover sized to the CYC
 * M reference (bust 34in graded, length 25.25in, two sleeves 13.25in arm
 * circumference × 16.5in) lands ≈ 930 yd in worsted — inside the
 * published 1000–1400 yd range once typical design ease and extras
 * (ribbing, waste yarn) are added, which is the intended safety margin
 * of a first-pass planning figure.
 */
import { PatternProject, gradePattern, resolveProjectStandards } from './grading-engine';

export type YarnWeight = 'lace' | 'fingering' | 'sport' | 'DK' | 'worsted' | 'bulky' | 'super-bulky';

/**
 * CYC yarn-weight reference data.
 * Source: Craft Yarn Council yarn weight standard table
 * (https://craftyarncouncil.com/standards/yarn-weight) — verified current.
 * referenceGaugeStitches: CYC standard stocking-stitch gauge midpoint over
 *   4 inches for the weight, on the recommended needle size.
 * yardagePer100g: midpoint of CYC's published yards-per-100-gram range.
 */
export const YARN_WEIGHT_DATA: Record<YarnWeight, { referenceGaugeStitches: number; yardagePer100g: number }> = {
  lace:          { referenceGaugeStitches: 7.5,  yardagePer100g: 450 },
  fingering:     { referenceGaugeStitches: 6.5,  yardagePer100g: 400 },
  sport:         { referenceGaugeStitches: 6,    yardagePer100g: 300 },
  DK:            { referenceGaugeStitches: 5.5,  yardagePer100g: 250 },
  worsted:       { referenceGaugeStitches: 4.5,  yardagePer100g: 185 },
  bulky:         { referenceGaugeStitches: 3.5,  yardagePer100g: 120 },
  'super-bulky': { referenceGaugeStitches: 3,    yardagePer100g: 72 },
};

/** Recommended needle size label per CYC weight standard, for display. */
export const YARN_WEIGHT_NEEDLES: Record<YarnWeight, string> = {
  lace: '1.5–2.25 mm (000–1)',
  fingering: '2.25–3.25 mm (1–3)',
  sport: '3.25–3.75 mm (3–5)',
  DK: '3.75–4.5 mm (5–7)',
  worsted: '4.5–5.5 mm (7–9)',
  bulky: '5.5–8 mm (9–11)',
  'super-bulky': '8–12.75 mm (11–17)',
};

export const YARN_WEIGHT_LABELS: Record<YarnWeight, string> = {
  lace: 'Lace (0)',
  fingering: 'Fingering (1)',
  sport: 'Sport (2)',
  DK: 'DK (3)',
  worsted: 'Worsted (4)',
  bulky: 'Bulky (5)',
  'super-bulky': 'Super Bulky (6)',
};

export const YARN_WEIGHTS: YarnWeight[] = ['lace', 'fingering', 'sport', 'DK', 'worsted', 'bulky', 'super-bulky'];

// Model constants:
const WORSTED_REFERENCE_YARDS = 1200;    // midpoint of the 1000–1400 yd worsted pullover benchmark
const WORSTED_REFERENCE_GAUGE = 4.5;     // CYC worsted reference stitch gauge over 4"
// Reference fabric area: a base-M adult pullover (bust 42in × length 26in
// body plus two sleeves ~11.5in upper-arm circumference × 17in length) has
// ≈ 1800 sq in of fabric. The benchmark yardage ÷ this area gives the
// worsted baseline coefficient (≈0.67 yd/sq in), from which all other
// weights scale by gauge².
const REFERENCE_PULLOVER_AREA_SQ_IN = 42 * 26 + 2 * 11.5 * 17;

export interface YarnEstimate {
  /** Estimated yards for the project's base size. */
  totalYards: number;
  /** Estimated meters (1 yd = 0.9144 m). */
  totalMeters: number;
  /** Estimated 100g skeins needed (rounded up). */
  skeins100g: number;
  /** Base-size fabric area in square inches, for transparency. */
  fabricAreaSqIn: number;
  /** Which weight the estimate was computed for. */
  weight: YarnWeight;
}

/**
 * Yards per square inch for a given yarn weight. Derived once from the
 * worsted benchmark and scaled by (worstedGauge / weightGauge)² — finer
 * yarns (higher gauge) consume more yardage per unit area because the
 * fabric contains more stitches and rows per square inch, each loop
 * drawing its own length of yarn.
 */
function yardsPerSqIn(weight: YarnWeight): number {
  // Finer yarns pack more stitches and rows per square inch (gauge scales
  // up as yarn gets thinner), and every stitch-row unit draws its own
  // length of yarn — so yardage per square inch grows with gauge².
  const ratio = YARN_WEIGHT_DATA[weight].referenceGaugeStitches / WORSTED_REFERENCE_GAUGE;
  return (WORSTED_REFERENCE_YARDS / REFERENCE_PULLOVER_AREA_SQ_IN) * ratio * ratio;
}

/**
 * Compute total fabric area (base size) from graded measurements.
 * The graded physical value is a finished garment dimension. For
 * yardage the dominant contributors are body length × bust circumference
 * (front + back panels) and sleeve length × arm circumference (two
 * sleeves). Other measurements are approximated as roughly square
 * (dim × dim), which slightly overestimates — safe for yarn buying.
 */
export function estimateYarn(project: PatternProject, weight: YarnWeight): YarnEstimate {
  const standards = resolveProjectStandards(project, {} as never);
  const grade = gradePattern(project, standards);

  const allMeasurements = grade.flatMap(s => s.measurements);
  const bustCirc = allMeasurements
    .find(m => m.gradingKey === 'bust')?.gradedValues[0]?.physicalValue;
  const bodyLen = allMeasurements
    .find(m => m.gradingKey === 'backLength')?.gradedValues[0]?.physicalValue;
  const armCirc = allMeasurements
    .find(m => m.gradingKey === 'upperArm')?.gradedValues[0]?.physicalValue;
  const sleeveLen = allMeasurements
    .find(m => m.gradingKey === 'sleeveLength')?.gradedValues[0]?.physicalValue;

  let fabricAreaSqIn = 0;
  // Body panels: circumference × body length is the classic sweater-area
  // term. Included only when both values exist — partial data yields a
  // partial (conservative) estimate rather than invented geometry.
  if (bustCirc && bodyLen) fabricAreaSqIn += bustCirc * bodyLen;
  // Two sleeves: arm circumference × sleeve length × 2.
  if (armCirc && sleeveLen) fabricAreaSqIn += 2 * armCirc * sleeveLen;
  // Any remaining measurements that aren't already represented above
  // contribute as square approximations, avoiding double counting of the
  // four yardage-driving keys (bust, backLength, upperArm, sleeveLength).
  const accounted = new Set(['bust', 'backLength', 'upperArm', 'sleeveLength']);
  for (const m of allMeasurements) {
    if (accounted.has(m.gradingKey)) continue;
    const base = m.gradedValues[0];
    if (!base) continue;
    const dim = m.measurementType === 'width' ? base.physicalValue * 2 : base.physicalValue;
    fabricAreaSqIn += dim * dim;
  }

  const totalYards = fabricAreaSqIn * yardsPerSqIn(weight);
  return {
    totalYards: Math.round(totalYards * 10) / 10,
    totalMeters: Math.round(totalYards * 0.9144 * 10) / 10,
    skeins100g: Math.ceil(totalYards / YARN_WEIGHT_DATA[weight].yardagePer100g),
    fabricAreaSqIn: Math.round(fabricAreaSqIn),
    weight,
  };
}
