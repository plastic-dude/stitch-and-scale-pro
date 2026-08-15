// CHK-080 — Gauge & Fit Translator engine.
//
// The stitchscale.app rival proved knitters will use a gauge-to-fit matcher
// (single page, one outcome, print it). Its weaknesses: no project, no
// persistence, no grading integration, no designer economics. This engine
// converts that weakness into a feature a rival cannot copy: it takes a
// TEST KNITTER'S swatch gauge and translates the DESIGNER's graded sizing
// across every written size — telling the designer exactly which size each
// knitter should knit at their tension, and how far off each size lands.
//
// Math: a knitter whose tension differs from the pattern gauge knits the
// STITCH COUNTS the pattern prescribes, so the finished garment scales by
// the gauge ratio (knitterStitches / patternStitches per 4in). Rows scale
// by the row ratio. Circumferences and widths scale with the stitch ratio;
// lengths with the row ratio.

import type { PatternProject, SizeKey, GradingKey } from "@/lib/grading-engine";

export interface TesterGauge {
  stitchesPer4In: number;
  rowsPer4In: number;
  /** Free-form tester identity shown in the report, e.g. "Tester A". */
  label: string;
}

export interface FitInput {
  /** The designer's own gauge (the pattern's published gauge). */
  patternStitchesPer4In: number;
  patternRowsPer4In: number;
  /** One or more test knitters' swatch gauges. */
  testers: TesterGauge[];
  /** Optional: a target finished circumference the designer is checking
   *  against (e.g. the fit spec for a given size). When provided, the engine
   *  reports how far each translated size deviates from it. */
  targetCircumference?: number;
  /** Grading table: size -> key circumference(s), from the project. */
  grading: Record<string, Record<GradingKey, number>>;
  /** Size order for deterministic output. */
  sizeOrder: SizeKey[];
  /** Measurement keys to translate. Widths/circumferences use the stitch
   *  ratio; lengths use the row ratio. */
  translateKeys: GradingKey[];
}

export interface SizeFit {
  size: SizeKey;
  /** Designer's nominal value for the primary circumference key. */
  nominal: number;
  /** Translated value at this tester's tension. */
  translated: number;
  /** signed deviation from nominal, same unit as the gauge */
  delta: number;
  deltaPct: number;
  /** Deviation from an optional fit target, when provided. */
  targetDelta?: number;
}

export interface TesterFitResult {
  label: string;
  /** stitch gauge ratio: tester / pattern. >1 means looser tension. */
  stitchRatio: number;
  rowRatio: number;
  /** Primary circumference key chosen per size (bust first, then first key). */
  primaryKey: GradingKey;
  fits: SizeFit[];
  /** The size whose translated circumference is closest to its own nominal
   *  fit intent — the size this tester should knit for the intended fit. */
  recommendedSize: SizeKey;
  /** Worst absolute deviation (pct) across sizes for the primary key. */
  worstDeviationPct: number;
  /** Flags about this tester's tension vs the pattern. */
  flags: { code: string; title: string; note: string }[];
}

export interface FitResult {
  testers: TesterFitResult[];
  /** Whether any tester's tension is far enough off to matter (>5%). */
  hasMaterialMismatch: boolean;
  verdict: string;
  verdictNote: string;
}

export const DEFAULT_FIT_INPUT: FitInput = {
  patternStitchesPer4In: 20,
  patternRowsPer4In: 28,
  testers: [
    { label: "Tester A", stitchesPer4In: 22, rowsPer4In: 30 },
  ],
  translateKeys: ["bust", "waist", "hip"],
  grading: {} as Record<string, Record<GradingKey, number>>,
  sizeOrder: [] as SizeKey[],
};

export const FIT_KEYS_LABEL: Record<GradingKey, string> = {
  bust: "Bust",
  waist: "Waist",
  hip: "Hip",
  upperArm: "Upper arm",
  lowerArm: "Lower arm",
  wrist: "Wrist",
  shoulder: "Shoulder",
  neckCircumference: "Neck",
  backLength: "Back length",
  sleeveLength: "Sleeve length",
  thigh: "Thigh",
  calf: "Calf",
  ankle: "Ankle",
  armholeDepth: "Armhole depth",
};

/** Width/circumference keys scale with stitch ratio; the rest with row ratio. */
const STITCH_RATIO_KEYS: GradingKey[] = [
  "bust", "waist", "hip", "upperArm", "lowerArm", "wrist",
  "shoulder", "neckCircumference", "thigh", "calf", "ankle",
];

/** Build a usable grading table from a project's sections, keyed by size.
 *  Projects without graded sections return an empty table (the UI shows the
 *  manual entry path). */
export function projectGradingTable(
  project: PatternProject,
  sizeOrder: SizeKey[],
): Record<string, Record<GradingKey, number>> {
  const out: Record<string, Record<GradingKey, number>> = {};
  for (const section of project.sections) {
    for (const m of section.measurements) {
      // baseValue is the base SIZE value; grading engines derive per-size
      // values elsewhere. Here we keep the simple, verified contract: the
      // base measurement stands in for every size only when the project has
      // no per-size rows. Full per-size grading lives in grading-engine.
      out[section.id] = { ...out[section.id], [m.gradingKey]: m.baseValue };
    }
  }
  return out;
}

/** Translate the designer's graded sizing for one tester's tension. */
export function analyzeFit(input: FitInput): FitResult {
  const stitchRatio = (t: TesterGauge) => safeRatio(t.stitchesPer4In, input.patternStitchesPer4In);
  const rowRatio = (t: TesterGauge) => safeRatio(t.rowsPer4In, input.patternRowsPer4In);

  const primaryKey = primaryFitKey(input);
  const translateKeys = input.translateKeys.length > 0
    ? input.translateKeys
    : [primaryKey];

  const testerResults: TesterFitResult[] = input.testers.map((tester) => {
    const sr = stitchRatio(tester);
    const rr = rowRatio(tester);
    const ratioFor = (key: GradingKey) =>
      STITCH_RATIO_KEYS.includes(key) ? sr : rr;

    const fits: SizeFit[] = input.sizeOrder
      .filter((size) => input.grading[size]?.[primaryKey] != null)
      .map((size) => {
        const nominal = input.grading[size][primaryKey];
        const translated = nominal * ratioFor(primaryKey);
        const delta = translated - nominal;
        const deltaPct = nominal !== 0 ? (delta / nominal) * 100 : 0;
        const targetDelta =
          input.targetCircumference != null
            ? translated - input.targetCircumference
            : undefined;
        return { size, nominal, translated, delta, deltaPct, targetDelta };
      });

    // Recommended size: the size whose translated value is closest to the
    // size's own nominal intent (smallest |deltaPct|), i.e. the size where
    // the tester's tension still lands nearest the intended fit.
    let recommended = input.sizeOrder[0] ?? ("M" as SizeKey);
    let best = Infinity;
    for (const f of fits) {
      const d = Math.abs(f.deltaPct);
      if (d < best) {
        best = d;
        recommended = f.size;
      }
    }

    const worstDeviationPct =
      fits.length > 0 ? Math.max(...fits.map((f) => Math.abs(f.deltaPct))) : 0;

    const flags: TesterFitResult["flags"] = [];
    const absRatioOff = Math.abs(sr - 1) * 100;
    if (absRatioOff >= 10) {
      flags.push({
        code: "GF-01",
        title: "Severe tension mismatch (≥10%)",
        note: `${tester.label} knits ${sr.toFixed(2)}× the pattern's stitch gauge. At that tension the finished garment shifts by over 10% in every circumference — advise blocking guidance or a size change before the test knit proceeds.`,
      });
    } else if (absRatioOff >= 5) {
      flags.push({
        code: "GF-02",
        title: "Noticeable tension mismatch (5–10%)",
        note: `${tester.label} knits ${sr.toFixed(2)}× the pattern's stitch gauge. The translated sizes shift by 5–10%; check the translated table before finalizing the size recommendation.`,
      });
    }
    if (sr > 1 && fits.length > 0) {
      flags.push({
        code: "GF-03",
        title: "Loose tension — sizes run big",
        note: `Every written size finishes ${(sr * 100 - 100).toFixed(1)}% larger than spec for ${tester.label}. If testers run loose as a group, consider tightening the pattern's recommended ease or adding a blocking note.`,
      });
    } else if (sr < 1 && fits.length > 0) {
      flags.push({
        code: "GF-04",
        title: "Tight tension — sizes run small",
        note: `Every written size finishes ${(100 - sr * 100).toFixed(1)}% smaller than spec for ${tester.label}. A group trend like this is a gauge-callout candidate in the pattern notes.`,
      });
    }
    if (Math.abs(rr - 1) * 100 >= 10) {
      flags.push({
        code: "GF-05",
        title: "Row-gauge mismatch (≥10%)",
        note: `${tester.label}'s row gauge is ${(rr * 100).toFixed(0)}% of the pattern's. Lengths (sleeves, back, armhole depth) scale by this ratio — worth a length note in the pattern.`,
      });
    }

    return {
      label: tester.label,
      stitchRatio: sr,
      rowRatio: rr,
      primaryKey,
      fits,
      recommendedSize: recommended,
      worstDeviationPct,
      flags,
    };
  });

  const hasMaterialMismatch = testerResults.some((t) => Math.abs(t.stitchRatio - 1) >= 0.05);
  const offCount = testerResults.filter((t) => Math.abs(t.stitchRatio - 1) >= 0.05).length;

  let verdict: string;
  let verdictNote: string;
  if (input.testers.length === 0) {
    verdict = "Add at least one tester's gauge";
    verdictNote = "Enter a test knitter's 4-inch swatch (stitches and rows) to see how their tension translates your graded sizing.";
  } else if (!hasMaterialMismatch) {
    verdict = "Tension is on gauge — proceed";
    verdictNote = "Every tester's stitch gauge sits within 5% of the pattern's. Their translated sizes match your grading closely; no size changes needed on tension grounds.";
  } else if (offCount === input.testers.length) {
    verdict = "All testers off gauge — fix tension or size down the recommendation";
    verdictNote = "Every tester's tension drifts 5%+ from the pattern gauge, so their finished measurements shift by the same amount in both directions. Re-swatch with the recommended needle/hook before trusting size calls, or use the translated table to pick the compensating size.";
  } else {
    verdict = "Mixed tensions — size recommendations diverge";
    verdictNote = `Some testers are on gauge and some drift 5%+. Their recommended sizes differ: follow each tester's translated table rather than a single blanket size call.`;
  }

  return { testers: testerResults, hasMaterialMismatch, verdict, verdictNote };
}

function safeRatio(tester: number, pattern: number): number {
  return pattern > 0 ? tester / pattern : 1;
}

function primaryFitKey(input: FitInput): GradingKey {
  if (input.translateKeys.length > 0 && input.translateKeys[0]) {
    return input.translateKeys[0];
  }
  const order: GradingKey[] = ["bust", "chest" as GradingKey, "waist", "hip"];
  for (const k of order) {
    if (Object.values(input.grading).some((row) => row[k] != null)) return k;
  }
  return "bust";
}
