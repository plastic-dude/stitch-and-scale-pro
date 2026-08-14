/**
 * CHK-045 — Spec Sheet Lab
 *
 * Generates and audits a factory-grade knitwear spec sheet from the
 * project's own machine-form grading data — the document factories and
 * pattern companies demand before quoting (Techpacker's own documentation
 * states factories "will not take your orders unless you provide a clear
 * and detailed Tech Pack").
 *
 * Why this exists (session-45 research):
 * - Techpacker (market leader): $35/user/mo Essentials, $95/user/mo
 *   Professional (annual billing) — built for cut-and-sew fashion, no
 *   knit-specific logic (gauge, stitches/rows, 7–14 gauge flat-bed).
 * - Freelance tech-pack creators: $100–300 per pack; AI generators $3–5
 *   per pack but output is 50–70% complete and needs manual rework.
 * - Enterprise PLM tops $50,000/yr — overkill for an indie designer.
 * - A sweater spec sheet carries 12–18 points of measurement (POM), a
 *   gauge block, yarn bill, colourways, construction notes and tolerance
 *   bands (±0.25in typical knitwear) — all of which Stitch & Scale
 *   already computes in machine form.
 * - Their flaw: you pay a subscription for fashion-generic sheets.
 *   Our strength: the grading table IS the POM sheet; the spec writes
 *   itself from your own data, free, local-first, forever.
 *
 * S-flags: S-01 POM coverage, S-02 tolerance band, S-03 colourway depth,
 * S-04 yarn bill completeness, S-05 gauge/machine-gauge block, S-06
 * quote-readiness score (0–6).
 */
import {
  ALL_SIZES,
  gradePattern,
  PatternProject,
  resolveProjectStandards,
  SizeKey,
  SIZE_STANDARDS,
} from './grading-engine';
import { estimateYarn, YarnWeight } from './yarn-estimator';

export interface SpecPomPoint {
  /** Human POM label, e.g. "Half Chest (1\" below armhole)" */
  label: string;
  /** Which grading key this point maps to in the project, if any.
   *  Empty string means a derived/offset point with no direct key. */
  gradingKey: string;
  /** Optional per-point tolerance override, inches (0 = use default). */
  toleranceIn: number;
}

export interface SpecColourway {
  name: string;
  /** e.g. "80% merino / 20% nylon, fingering" */
  yarnSpec: string;
}

export interface SpecSheetInputs {
  /** Designer-authored POM points; the lab also derives coverage from the
   *  project's graded measurements. */
  pomPoints: SpecPomPoint[];
  /** Default tolerance band for points without an override, inches. */
  toleranceDefault: number;
  colourways: SpecColourway[];
  /** e.g. "100% superwash merino" */
  fibreComposition: string;
  construction: 'flat' | 'circular' | 'fully-fashioned' | '';
  /** Flat-bed machine gauge, 7–14 for typical knitwear manufacturing.
   *  0 = not yet chosen. */
  machineGauge: number;
  yarnWeight: YarnWeight;
  /** Yardage override (0 = derive from the shared yardage model). */
  yardageOverride: number;
  notes: string;
}

export interface PomRow {
  point: string;
  /** Graded value per size, inches, keyed by size label. */
  values: Partial<Record<SizeKey, number>>;
  toleranceIn: number;
  /** Whether this point is covered by a graded project measurement. */
  graded: boolean;
  /** Optional designer note. */
  note?: string;
}

export interface YarnBillRow {
  label: string;
  value: string;
}

export interface SpecSheetResult {
  /** The core factory table: every graded measurement as a POM row. */
  pomTable: PomRow[];
  /** Designer-added POM points with no direct graded mapping. */
  extraPoints: PomRow[];
  yarnBill: YarnBillRow[];
  /** Gauge block lines for the sheet. */
  gaugeBlock: string[];
  /** Quote-readiness score, 0–6 (see S-06). */
  readinessScore: number;
  /** Industry norm references used in the framing. */
  benchmarks: { pomNormMin: number; pomNormMax: number; toleranceBand: string; machineGaugeBand: string };
  /** Money framing vs the subscription/freelance/AI market. */
  moneyLine: string;
  flags: Array<{ code: string; severity: 'error' | 'warning' | 'info'; message: string }>;
  verdict: 'ready' | 'review' | 'blocked';
  verdictReason: string;
}

export const DEFAULT_SPEC_SHEET: SpecSheetInputs = {
  pomPoints: [],
  toleranceDefault: 0.25,
  colourways: [],
  fibreComposition: '',
  construction: '',
  machineGauge: 0,
  yarnWeight: 'worsted',
  yardageOverride: 0,
  notes: '',
};

/* ------------------------- session-45 market facts -----------------------
 * Sources:
 * - Techpacker pricing (techpacker.com/pricing): Essentials $35/user/mo
 *   ($420/yr annual), Professional $95/user/mo ($1140/yr annual),
 *   onboarding $100–3,000; 15,000+ brands claimed.
 * - Techpacker blog (best tech pack software 2026): freelance AI packs
 *   $3–5 each, "50–70% complete"; enterprise PLM tops $50,000/yr; Reddit
 *   r/streetwearstartup freelancers quote $100–300 per pack.
 * - CottonWorks sweater manufacturing: weft knitting dominates; 7–14
 *   gauge flat-bed machines for knitwear panels.
 * - Industry norm: 12–18 POM points for a sweater spec sheet; knitwear
 *   finished-measurement tolerance typically ±0.25in (6mm).
 */
export const SESSION_45_MARKET = {
  techpackerMonthly: 35,
  techpackerYearly: 420,
  techpackerProMonthly: 95,
  techpackerProYearly: 1140,
  freelancePackLow: 100,
  freelancePackHigh: 300,
  aiPackLow: 3,
  aiPackHigh: 5,
  pomNormMin: 12,
  pomNormMax: 18,
  toleranceIn: 0.25,
  machineGaugeLow: 7,
  machineGaugeHigh: 14,
} as const;

export function formatUsd(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function resolveStandards(project: PatternProject) {
  return resolveProjectStandards(project, SIZE_STANDARDS);
}

function gradedValue(project: PatternProject, gradingKey: string): Partial<Record<SizeKey, number>> {
  const values: Partial<Record<SizeKey, number>> = {};
  if (!gradingKey) return values;
  const graded = gradePattern(project, resolveStandards(project));
  for (const section of graded) {
    for (const m of section.measurements) {
      if (m.gradingKey === gradingKey) {
        for (const g of m.gradedValues) {
          if (Math.abs(g.physicalValue) > 0) values[g.size] = g.physicalValue;
        }
      }
    }
  }
  return values;
}

/** Distinct graded measurements available in the project — each becomes a
 *  candidate POM row on the sheet. */
function projectPomPoints(project: PatternProject): Array<{ label: string; gradingKey: string }> {
  const points: Array<{ label: string; gradingKey: string }> = [];
  for (const section of project.sections) {
    for (const m of section.measurements) {
      const graded = gradedValue(project, m.gradingKey);
      if (Object.keys(graded).length > 0) points.push({ label: `${section.name} › ${m.label}`, gradingKey: m.gradingKey });
    }
  }
  return points;
}

function yardageFor(project: PatternProject, inputs: SpecSheetInputs): number {
  if (inputs.yardageOverride > 0) return inputs.yardageOverride;
  const est = estimateYarn(project, inputs.yarnWeight);
  // NaN-safe: an unverifiable gauge produces no yardage — same as a
  // missing gauge block on a factory sheet.
  const yards = Number(est.totalYards) || 0;
  return yards > 0 ? Math.round(yards) : 0;
}

export function analyzeSpecSheet(project: PatternProject, raw: Partial<SpecSheetInputs> = {}): SpecSheetResult {
  const inputs: SpecSheetInputs = { ...DEFAULT_SPEC_SHEET, ...raw };
  const flags: SpecSheetResult['flags'] = [];

  // POM table: one row per graded project measurement, tolerance carried.
  const pomTable: PomRow[] = [];
  for (const p of projectPomPoints(project)) {
    const designer = inputs.pomPoints.find(x => x.gradingKey === p.gradingKey);
    pomTable.push({
      point: p.label,
      values: gradedValue(project, p.gradingKey),
      toleranceIn: designer ? Math.abs(designer.toleranceIn) || inputs.toleranceDefault : inputs.toleranceDefault,
      graded: true,
      note: designer?.label,
    });
  }
  const extraPoints: PomRow[] = inputs.pomPoints
    .filter(x => !x.gradingKey)
    .map(x => ({ point: x.label, values: {}, toleranceIn: Math.abs(x.toleranceIn) || inputs.toleranceDefault, graded: false }));

  // Yarn bill: composition + yardage + weight.
  const yardage = yardageFor(project, inputs);
  const yarnBill: YarnBillRow[] = [];
  if (inputs.fibreComposition) yarnBill.push({ label: 'Fibre / composition', value: inputs.fibreComposition });
  if (inputs.yarnWeight) yarnBill.push({ label: 'Yarn weight class', value: inputs.yarnWeight });
  if (yardage > 0) yarnBill.push({ label: 'Estimated yardage (base size)', value: `${yardage.toLocaleString('en-US')} yd` });

  // Gauge block.
  const unit = project.gauge?.unit || 'in';
  const gaugeUnusable =
    !project.gauge || project.gauge.stitchesPer4In <= 0 || project.gauge.rowsPer4In <= 0;
  const gaugeBlock: string[] = [];
  if (!gaugeUnusable) {
    gaugeBlock.push(`Gauge: ${project.gauge.stitchesPer4In} sts × ${project.gauge.rowsPer4In} rows / 4${unit}`);
  }
  if (inputs.machineGauge > 0) gaugeBlock.push(`Machine gauge: ${inputs.machineGauge} gauge flat-bed`);
  if (inputs.construction) gaugeBlock.push(`Construction: ${inputs.construction}`);

  // S-01 POM coverage vs the 12–18 point industry norm.
  const pointCount = pomTable.length + extraPoints.length;
  if (pointCount < SESSION_45_MARKET.pomNormMin) {
    flags.push({
      code: 'S-01',
      severity: pointCount < 8 ? 'error' : 'warning',
      message: `Spec carries ${pointCount} POM points; the sweater norm is ${SESSION_45_MARKET.pomNormMin}–${SESSION_45_MARKET.pomNormMax}. Factories quote from the POM sheet — a thin one invites rework rounds. Add sections/measurements to the grading table or manual points.`,
    });
  } else {
    flags.push({ code: 'S-01', severity: 'info', message: `${pointCount} POM points — inside the ${SESSION_45_MARKET.pomNormMin}–${SESSION_45_MARKET.pomNormMax} industry norm.` });
  }

  // S-02 tolerance band.
  if (inputs.toleranceDefault <= 0) {
    flags.push({
      code: 'S-02',
      severity: 'error',
      message: `No tolerance band set. Knitwear factories price and QC against finished-measurement tolerance (±${SESSION_45_MARKET.toleranceIn}in is typical) — without it the sheet reads as unreviewed.`,
    });
  } else {
    flags.push({ code: 'S-02', severity: 'info', message: `Tolerance band ±${inputs.toleranceDefault}in per point — the documented knitwear norm.` });
  }

  // S-03 colourway depth.
  const cw = inputs.colourways.filter(c => c.name.trim());
  if (cw.length === 0) {
    flags.push({ code: 'S-03', severity: 'warning', message: 'No colourways listed. Factories and pattern companies ask "which colourways?" on the first quote request — one colourway answers weakly, three answers competitively.' });
  } else if (cw.length === 1) {
    flags.push({ code: 'S-03', severity: 'info', message: `1 colourway (${cw[0].name}) — sufficient to quote, but multi-colourway sheets win repeat manufacturing orders.` });
  } else {
    flags.push({ code: 'S-03', severity: 'info', message: `${cw.length} colourways — multi-colourway depth that strengthens the quote.`, });
  }

  // S-04 yarn bill completeness.
  if (!inputs.fibreComposition || yardage === 0) {
    flags.push({
      code: 'S-04',
      severity: 'error',
      message: yardage === 0
        ? 'Yardage could not be derived — check the yardage override or the project gauge. Factories cannot source substitute yarn without a yardage figure.'
        : 'Yarn bill incomplete — set the fibre composition (e.g. "100% superwash merino") and yardage. A factory can\'t price a sheet that can\'t be sourced.',
    });
  } else {
    flags.push({ code: 'S-04', severity: 'info', message: `Yarn bill complete: composition + ${yardage.toLocaleString('en-US')} yd estimated yardage.` });
  }

  // S-05 gauge / machine-gauge block.
  // gaugeUnusable already derived above; keep this comment in place for the
  // S-05 error branch that follows.
  if (gaugeUnusable && inputs.yardageOverride <= 0) {
    flags.push({
      code: 'S-05',
      severity: 'error',
      message: 'Gauge block missing — no gauge means no machine can be matched and every number on this sheet is unverifiable. Set the project gauge first.',
    });
  } else if (inputs.machineGauge === 0) {
    flags.push({
      code: 'S-05',
      severity: 'warning',
      message: `Machine gauge unset — knitwear manufacturing runs 7–14 gauge flat-bed (CottonWorks). A sheet without a gauge band sends the quote to more vendors than it needs to.`,
    });
  } else if (inputs.machineGauge < SESSION_45_MARKET.machineGaugeLow || inputs.machineGauge > SESSION_45_MARKET.machineGaugeHigh) {
    flags.push({
      code: 'S-05',
      severity: 'info',
      message: `Machine gauge ${inputs.machineGauge} sits outside the typical 7–14 flat-bed band — fine if intentional (fine-gauge shetland, e.g.), but note it so vendors don't auto-reject.`,
    });
  } else {
    flags.push({ code: 'S-05', severity: 'info', message: `Machine gauge ${inputs.machineGauge} — inside the 7–14 flat-bed manufacturing band.` });
  }

  // S-06 quote-readiness score.
  const s1Ok = pointCount >= 8;
  const s2Ok = inputs.toleranceDefault > 0;
  const s3Ok = cw.length >= 2;
  const s4Ok = !!inputs.fibreComposition && yardage > 0;
  const s5Ok = !gaugeUnusable && inputs.machineGauge > 0;
  const s6Ok = !!inputs.construction;
  const readinessScore = [s1Ok, s2Ok, s3Ok, s4Ok, s5Ok, s6Ok].filter(Boolean).length;

  // Verdict.
  let verdict: SpecSheetResult['verdict'];
  let verdictReason: string;
  const hardErrors = flags.some(f => f.severity === 'error');
  if (hardErrors || readinessScore < 3) {
    verdict = 'blocked';
    verdictReason = `Resolve the errors before requesting quotes — an incomplete sheet is what the rework round is made of (every Techpacker-class vendor returns it).`;
  } else if (readinessScore < 6) {
    verdict = 'review';
    verdictReason = `${readinessScore}/6 quote-readiness — the sheet will get you quotes, but the missing items are exactly what a factory will come back for. Add them and the first quote arrives without a rework round.`;
  } else {
    verdict = 'ready';
    verdictReason = `Quote-ready: ${readinessScore}/6 — gauge block, yarn bill, tolerance bands, POM coverage, colourway depth and construction note all present. This sheet is what Techpacker's Professional tier charges $95/user/mo to assemble, built from your own grading data for free.`;
  }

  // Money line: the subscription-vs-sheet framing.
  const moneyLine = `Techpacker charges ${formatUsd(SESSION_45_MARKET.techpackerMonthly)}/mo (Essentials) to ${formatUsd(SESSION_45_MARKET.techpackerProMonthly)}/mo (Professional) for fashion-generic packs with no knit logic; freelance packs run ${formatUsd(SESSION_45_MARKET.freelancePackLow)}–${formatUsd(SESSION_45_MARKET.freelancePackHigh)} and AI generators ${formatUsd(SESSION_45_MARKET.aiPackLow)}–${formatUsd(SESSION_45_MARKET.aiPackHigh)}/pack at 50–70% completeness. Your grading table IS the POM sheet — the subscription you'd pay forever starts at zero.`;

  return {
    pomTable,
    extraPoints,
    yarnBill,
    gaugeBlock,
    readinessScore,
    benchmarks: {
      pomNormMin: SESSION_45_MARKET.pomNormMin,
      pomNormMax: SESSION_45_MARKET.pomNormMax,
      toleranceBand: `±${SESSION_45_MARKET.toleranceIn}in`,
      machineGaugeBand: `${SESSION_45_MARKET.machineGaugeLow}–${SESSION_45_MARKET.machineGaugeHigh} gauge`,
    },
    moneyLine,
    flags,
    verdict,
    verdictReason,
  };
}
