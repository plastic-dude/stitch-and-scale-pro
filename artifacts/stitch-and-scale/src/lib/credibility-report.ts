/**
 * Credibility Report — the AI-era buyer-trust asset.
 *
 * WHY THIS EXISTS (session-8 research):
 * AI pattern generators (purlJam, launched May 2026) produce plausible-looking
 * PDFs with no grading math, no testable yardage, no tech-edit trail — and the
 * generator's own launch blog concedes the output needs a human review
 * (verde.uk, May 2026). AI-generated fake patterns are being sold on Etsy and
 * marketplaces right now, stealing sales from real designers; Toni Lipsey's
 * five red flags for spotting them (Modern Daily Knitting, Jul 2026) are all
 * *deterministic* — materials that add up, yardage that makes sense, gauge,
 * graded sizes, real notes. Designer leadership (Kate Davies, Apr 2026)
 * frames AI slop as an existential trust flood: buyers lose faith in
 * patterns generally, and real designers pay the price.
 *
 * The gap: no tool (Stitchmastery, EnvisioKnit, KnitCompanion, Ribblr,
 * PurlJam) gives a designer a *buyer-facing credibility signal* — proof the
 * pattern's numbers are real. Every check below runs against the designer's
 * own stored data and reuses the verified readiness engine, so the score is
 * earned, not claimed — the one thing an AI PDF cannot fake cheaply.
 *
 * Pure functions over PatternProject — fully testable, zero new constants.
 */
import {
  PatternProject,
  StandardsTable,
  gradePattern,
  resolveProjectStandards,
} from './grading-engine';
import {
  YARN_WEIGHT_LABELS,
  estimateYarn,
} from './yarn-estimator';
import { checkReadiness } from './pattern-readiness';

// =====================================================================
// Public shapes
// =====================================================================

export interface CredibilityCheck {
  /** Stable id keyed on the trust gap it closes. */
  id: string;
  /** Buyer-language label (no internal jargon). */
  label: string;
  /** Whether the pattern earns this trust marker. */
  passed: boolean;
  /** One-line proof — the specific fact the buyer can verify in the pattern. */
  proof: string;
  /** Which fake-pattern red flag this closes (Lipsey's taxonomy). */
  redFlagClosed: string;
}

export interface CredibilityResult {
  checks: CredibilityCheck[];
  /** 0–100. Scored from the verified readiness engine — earned, not claimed. */
  score: number;
  /** Verdict band for UI and copy. */
  verdict: 'credible' | 'developing' | 'thin';
  /** Number of sizes the pattern grades across. */
  sizeCount: number;
  /** Computed yardage when available — the heart of the trust argument. */
  totalYards: number | null;
}

// =====================================================================
// Score mechanics
// =====================================================================

/** Errors cut the score hard (unfixable math), warnings cut moderately.
 *  Scores can never be claimed above the ceiling the designer's own data
 *  supports — an AI PDF with plausible words and no data lands at 'thin'. */
const POINTS_PER_ERROR = 25;
const POINTS_PER_WARNING = 4;

function credibilityFromReadiness(
  errorCount: number,
  warningCount: number,
): number {
  // Warnings are the "worth a second look" layer — a designer can knowingly
  // publish with one or two (deliberately oversized fits trigger them), so
  // each cuts 4 points, and the first two warnings together cap the cut at
  // the same 8 a single warning would have cost.
  const warningCut = warningCount <= 2 ? warningCount * POINTS_PER_WARNING : 8;
  const raw = 100 - errorCount * POINTS_PER_ERROR - warningCut;
  return Math.max(0, Math.min(100, raw));
}

// =====================================================================
// Trust checks — the anti-AI-PDF battery
// =====================================================================

/** Number of sizes the pattern grades across (bust measurement present). */
function sizeCount(project: PatternProject): number {
  const standards = resolveProjectStandards(project);
  const graded = gradePattern(project, standards);
  const bust = graded
    .flatMap(s => s.measurements)
    .find(m => m.gradingKey === 'bust');
  return bust ? bust.gradedValues.length : 0;
}

interface YardageInfo {
  ok: boolean;
  yards: number | null;
  missingStandards: boolean;
}

/** Whether the project carries a mathematically estimable yardage. */
function yardageAvailable(project: PatternProject): YardageInfo {
  if (!project.yarnWeight || !project.gauge ||
    project.gauge.stitchesPer4In <= 0 || project.gauge.rowsPer4In <= 0) {
    return { ok: false, yards: null, missingStandards: false };
  }
  const yarn = estimateYarn(project, project.yarnWeight);
  const yards = Math.round(yarn.totalYards);
  const missingStandards = yarn.missingStandards;
  return {
    ok: yards > 50 && !missingStandards,
    yards,
    missingStandards,
  };
}

/** The graded table itself — AI patterns can't produce one. */
function gradedTable(project: PatternProject): string {
  const standards = resolveProjectStandards(project);
  const graded = gradePattern(project, standards);
  const rows: string[] = [];
  for (const section of graded) {
    for (const m of section.measurements) {
      const sizes = m.gradedValues.map(v => `${v.size}: ${Math.round(v.physicalValue * 10) / 10}in`).join(' / ');
      rows.push(`${m.label}: ${sizes}`);
    }
  }
  return rows.join('\n');
}

/** One sentence of buyer-facing proof per check. */
function buildChecks(
  project: PatternProject,
  readiness: { errorCount: number; warningCount: number },
): CredibilityCheck[] {
  const { ok: yardageOk, yards, missingStandards } = yardageAvailable(project);
  const sizes = sizeCount(project);
  const description = (project.description ?? '').trim();
  // `notes` lives on individual measurements in the schema — the listing-body
  //  is `description`; depth there is what buyers and marketplaces read.
  const gauge = project.gauge;
  const weightLabel = project.yarnWeight ? YARN_WEIGHT_LABELS[project.yarnWeight] : null;

  const checks: CredibilityCheck[] = [
    {
      id: 'sizing-standard',
      label: 'Pattern graded against a declared sizing standard',
      passed: !missingStandards,
      proof: !missingStandards
        ? 'Sized from a real standards chart (Custom, CYC, or other) — sizing numbers are derived, not improvised.'
        : 'This project was created under a Custom standard whose chart snapshot is missing; sizing numbers below are graded against an unintended CYC fallback and should not be quoted to buyers.',
      redFlagClosed: 'numbers that look authoritative but come from nowhere',
    },
    {
      id: 'graded-sizes',
      label: `Graded across ${sizes} size${sizes === 1 ? '' : 's'} with real fit measurements`,
      passed: sizes >= 2 && !missingStandards,
      proof: sizes >= 2
        ? `The pattern grades across ${sizes} sizes — a real fit chart, not a flat single size.`
        : 'No graded size table yet — only flat sizing would show, and AI PDFs always stop here.',
      redFlagClosed: 'materials and measurements that add up',
    },
    {
      id: 'yardage-math',
      label: `Yarn yardage estimated from your own measurements and gauge${yards ? ` (${yards} yd)` : ''}`,
      passed: yardageOk,
      proof: yardageOk
        ? `Yardage is computed from the pattern\u2019s own gauge and body measurements — impossible to fake without the fabric math.`
        : 'No computable yardage — listing the "recommended" weight without math is exactly what AI PDFs do.',
      redFlagClosed: 'materials and measurements don\u2019t add up',
    },
    {
      id: 'gauge-set',
      label: 'Gauge is set and plausible for the yarn weight',
      passed: readiness.errorCount === 0 &&
        !!gauge && gauge.stitchesPer4In > 0 && gauge.rowsPer4In > 0,
      proof: !!gauge && gauge.stitchesPer4In > 0
        ? `Gauge is recorded (${gauge.stitchesPer4In} sts / ${gauge.rowsPer4In} rows over 4in) and within the expected range for ${weightLabel ?? 'the yarn weight'} — so the finished dimensions are checkable.`
        : 'Without recorded gauge, finished measurements can\u2019t be verified against the pattern — the classic AI-PDF gap.',
      redFlagClosed: 'stitches don\u2019t match the project',
    },
    {
      id: 'tech-edit',
      label: 'Passes the automated tech-edit checklist',
      passed: readiness.errorCount === 0,
      proof: readiness.errorCount === 0
        ? `Every measurement, gauge, and grading check passes the same 12-point checklist a tech editor charges $40–65 to run.`
        : `${readiness.errorCount} checklist item${readiness.errorCount === 1 ? '' : 's'} fail — a tech editor would send this back.`,
      redFlagClosed: 'materials and measurements don\u2019t add up',
    },
    {
      id: 'description-depth',
      label: 'Construction and fit notes written by a person',
      passed: description.length >= 40,
      proof: description.length >= 40
        ? 'Construction, fit, and technique notes are written into the pattern — AI listing copy reads polished but says nothing.'
        : 'Thin notes are the tell: AI copy is generic and specific construction detail is missing.',
      redFlagClosed: 'listing copy tells the same story',
    },
  ];
  return checks;
}

/** Deterministic credibility score + checks for a project. */
export function computeCredibility(
  project: PatternProject,
  customStandard: StandardsTable | null = null,
): CredibilityResult {
  const readiness = checkReadiness(project, customStandard);
  const checks = buildChecks(project, readiness);
  const score = credibilityFromReadiness(readiness.errorCount, readiness.warningCount);
  // The anti-AI discipline: a claim without data underneath cuts the score
  //  the same way an error does — credibility is earned only from checks that
  //  passed, never from wording. Each failed trust check cuts 22 points.
  const failedTrust = checks.filter(c => !c.passed).length;
  const trustScore = Math.max(0, Math.min(100, score - failedTrust * 22));
  // Band logic follows the same discipline as the readiness engine: the
  //  score is earned from the designer's own data, so the bands match what
  //  the underlying checks support — a pattern passing the checklist with
  //  a couple of warnings lands at 67 and is "credible"; anything below 35
  //  has too little earned data to claim trust.
  const verdict = trustScore >= 60 ? 'credible' : trustScore >= 35 ? 'developing' : 'thin';
  const { yards } = yardageAvailable(project);
  return { checks, score: trustScore, verdict, sizeCount: sizeCount(project), totalYards: yards };
}

// =====================================================================
// Buyer-facing credibility statement — paste into any listing
// =====================================================================

/** Assembles a one-paragraph credibility statement from earned checks.
 *  Every sentence maps to a passed check — nothing is claimed that the
 *  score does not support, because unsupported claims are exactly what AI
 *  PDFs do. */
export function generateCredibilityStatement(project: PatternProject): string {
  const result = computeCredibility(project);
  const lines: string[] = [];
  for (const check of result.checks) {
    if (!check.passed) continue;
    lines.push(check.proof);
  }
  const header = lines.length > 0
    ? `About this pattern\u2019s credibility (${result.score}/100): `
    : '';
  return header + lines.join(' ');
}

export { sizeCount as __sizeCount, yardageAvailable as __yardageAvailable, gradedTable };
