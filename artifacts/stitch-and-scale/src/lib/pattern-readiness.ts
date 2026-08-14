/**
 * Pattern Readiness — pre-publish checks plus a marketplace listing generator.
 *
 * WHY THIS EXISTS (session-6 research):
 * Designers pay tech editors ~$40–65 per pattern largely for the checklist
 * work below — "check your math, gauge, sizing info, conversions,
 * headers/footers, style-sheet consistency" (Snickerdoodle Knits, Feb 2022:
 * https://www.snickerdoodleknits.com/post/how-to-decrease-tech-editing-costs-your-knitting-pattern-editing-checklist).
 * Tech editors verify stitch counts, gauge, terminology, clarity
 * (techeditor.co.uk, Nov 2024). Every missed item costs real money: either a
 * pricier edit bill, or — worse — a published pattern that gets frogged and
 * abandoned, killing the designer's shop reviews.
 *
 * No tool in the market (Stitchmastery, EnvisioKnit, KnitCompanion, Pattern
 * Keeper, Ravelry itself) turns the designer's own graded data into a
 * deterministic pre-publish readiness report — that's the gap this fills.
 *
 * The listing generator closes the second gap: nothing assembles a pattern's
 * computed data (sizes, gauge, yarn estimate, notes) into a paste-ready
 * marketplace description. Ravelry's own guidance asks for enough description
 * for buyers to know what they'd knit (ravelry.com/wiki; sistermountain.com
 * Jan 2020) — designers still hand-write this from scratch every release.
 *
 * Both parts are pure functions over PatternProject — no UI, no storage,
 * fully testable.
 */
import {
  PatternProject,
  GradingKey,
  StandardsTable,
  SIZE_STANDARDS,
  gradePattern,
  resolveProjectStandards,
  isCustomStandardMissing,
} from './grading-engine';
import {
  YarnWeight,
  YARN_WEIGHT_DATA,
  YARN_WEIGHT_LABELS,
  estimateYarn,
} from './yarn-estimator';
import {
  PLATFORM_LABELS,
} from './pattern-income-calculator';

export type ReadinessSeverity = 'error' | 'warning' | 'pass';

export interface ReadinessCheck {
  /** Stable id so UI tests / persistence can key on this row. */
  id: string;
  /** What this check verifies, in plain designer language. */
  label: string;
  severity: ReadinessSeverity;
  /** Empty when passing; the fix the designer should apply otherwise. */
  detail: string;
  /** Category used to group rows in the UI. */
  category: 'engineering' | 'metadata' | 'presentation';
}

/**
 * Plausible human-scale bounds for base-size measurements (inches), per CYC
 * body-chart ranges. Anything outside is almost certainly a unit mixup
 * (cm entered as inches — the single most common designer data error) or a
 * slip of the finger. Tolerance is ±45% around the standard midpoint so that
 * intentionally oversized designs still pass while a 29in bust typed as
 * 29cm (11.4in) does not.
 */
const BASE_TOLERANCE = 0.45;

/** Plausible gauge check per the project's yarn weight — the CYC standard
 * reference gauge for each weight is the honest baseline (a designer swatching
 * 2×–3× the standard fabric is not, but it's plausible), and the band is
 * ±90% around it. Below the band the gauge belongs to a coarser weight or a
 * unit slip; far above it is almost always cm-typed-as-stitches (e.g. 45–50
 * when the swatch reads 4.5 sts/cm). Rows per 4in run higher than stitches
 * (row gauge is typically 1.25–1.5× stitch gauge on stocking stitch), so the
 * row band is anchored on the project's own stitch gauge instead of a flat
 * ceiling. */
const GAUGE_TOLERANCE = 0.9;
const ROW_GAUGE_MULTIPLIER = 2.5;
const MIN_STITCH_GAUGE = 2; // coarser than any CYC weight reference

function stitchGaugeRange(project: PatternProject): { min: number; max: number } {
  const ref = project.yarnWeight
    ? YARN_WEIGHT_DATA[project.yarnWeight].referenceGaugeStitches
    : 4.5; // worsted default — the most common garment weight
  const min = Math.min(MIN_STITCH_GAUGE, ref * (1 - GAUGE_TOLERANCE));
  return { min, max: ref * (1 + GAUGE_TOLERANCE) };
}

const ESSENTIAL_MEASUREMENT_KEYS: GradingKey[] = [
  'bust', 'waist', 'hip', 'upperArm', 'backLength', 'sleeveLength',
];

export interface ReadinessResult {
  checks: ReadinessCheck[];
  /** Overall verdict: 'ready' means zero errors (warnings allowed), since
   *  a designer can knowingly publish with a warning; errors mean "fix
   *  first" — an unfixable pattern is a refund-and-review disaster. */
  ready: boolean;
  errorCount: number;
  warningCount: number;
}

/** Deterministic, data-driven pre-publish readiness report for a project.
 *  `customStandard` is the app-global custom chart — the same live fallback
 *  the grading engine uses when a Custom-standard project lacks its frozen
 *  snapshot. */
export function checkReadiness(
  project: PatternProject,
  customStandard: StandardsTable | null = null,
): ReadinessResult {
  const checks: ReadinessCheck[] = [];

  // ---------- Sizing standards (S003 family: the "standards built on
  // nothing" case must be loud, never silently zeroed) ----------
  checks.push({
    id: 'sizing-standards',
    label: 'Sizing standard chart is available',
    severity: isCustomStandardMissing(project) ? 'error' : 'pass',
    detail: isCustomStandardMissing(project)
      ? 'This project was created under a Custom standard but its chart snapshot is missing, so every sizing number below is graded against a CYC fallback the designer never asked for. Add the custom chart in Settings (or recreate the project under a standard) before publishing.'
      : '',
    category: 'engineering',
  });

  // ---------- Metadata (the listing can't exist without these) ----------
  checks.push({
    id: 'name',
    label: 'Pattern has a name',
    severity: project.name.trim() ? 'pass' : 'error',
    detail: project.name.trim() ? '' : 'Give the pattern a name — Ravelry rejects unnamed listings and buyers can\u2019t search for it.',
    category: 'metadata',
  });
  checks.push({
    id: 'author',
    label: 'Designer name is set',
    severity: project.author.trim() ? 'pass' : 'warning',
    detail: project.author.trim() ? '' : 'The pattern will publish without a designer name. Add yours (e.g. your Ravelry handle).',
    category: 'metadata',
  });
  checks.push({
    id: 'notes',
    label: 'Designer notes written',
    severity: (project.description ?? '').trim().length >= 10 ? 'pass' : 'warning',
    detail: (project.description ?? '').trim().length >= 10
      ? ''
      : 'Notes under ~10 characters make the listing description thin. A couple of sentences about construction and fit lift conversion rates.',
    category: 'metadata',
  });

  // ---------- Engineering (the tech-editor material) ----------
  const range = stitchGaugeRange(project);
  const stitchInBand = project.gauge.stitchesPer4In >= range.min &&
    project.gauge.stitchesPer4In <= range.max;
  const rowReasonable = !!project.gauge &&
    project.gauge.rowsPer4In > 0 &&
    project.gauge.rowsPer4In <= project.gauge.stitchesPer4In * ROW_GAUGE_MULTIPLIER;
  const gaugeUsable = !!project.gauge &&
    project.gauge.stitchesPer4In > 0 &&
    project.gauge.stitchesPer4In <= range.max * 3 &&
    project.gauge.rowsPer4In > 0 &&
    project.gauge.rowsPer4In <= project.gauge.stitchesPer4In * ROW_GAUGE_MULTIPLIER * 1.5;
  checks.push({
    id: 'gauge',
    label: 'Gauge is set and plausible',
    severity: !gaugeUsable
      ? 'error'
      : stitchInBand && rowReasonable
        ? 'pass'
        : 'warning',
    detail: !gaugeUsable
      ? 'No gauge — nothing can grade, the yarn estimate is unusable, and knitters can\u2019t check fit.'
      : `Gauge ${project.gauge.stitchesPer4In} sts / ${project.gauge.rowsPer4In} rows over 4in sits outside the expected range for ${project.yarnWeight ? YARN_WEIGHT_LABELS[project.yarnWeight] : 'worsted'} (~${Math.round(range.min * 10) / 10}–${Math.round(range.max * 10) / 10} sts). Almost always a units slip (cm entered as stitches) — worth a second look.`,
    category: 'engineering',
  });

  checks.push({
    id: 'sections',
    label: 'At least one section with measurements',
    severity: project.sections.length > 0 && project.sections.some(s => s.measurements.length > 0)
      ? 'pass'
      : 'error',
    detail: project.sections.length === 0
      ? 'No sections — there is nothing to publish yet.'
      : 'Every section is empty. Add at least one measurement (bust, sleeve, length…).',
    category: 'engineering',
  });

  checks.push({
    id: 'empty-sections',
    label: 'No empty sections',
    severity: project.sections.every(s => s.measurements.length > 0) ? 'pass' : 'warning',
    detail: project.sections.every(s => s.measurements.length > 0)
      ? ''
      : 'Empty sections print as blank headings in the PDF and confuse test knitters — delete them or fill them in.',
    category: 'engineering',
  });

  checks.push({
    id: 'positive-values',
    label: 'All base measurements are positive',
    severity: project.sections.every(s =>
      s.measurements.every(m => m.baseValue > 0),
    ) ? 'pass' : 'error',
    detail: project.sections.every(s => s.measurements.every(m => m.baseValue > 0))
      ? ''
      : 'One or more measurements are zero or negative — the graded table will produce impossible sizes.',
    category: 'engineering',
  });

  // Base-size sanity vs the project's standard chart.
  const standards = resolveProjectStandards(project, customStandard ?? undefined);
  const baseChart = standards[project.baseSize];
  const outOfRangeLabels: string[] = [];
  for (const s of project.sections) {
    for (const m of s.measurements) {
      const std = baseChart?.[m.gradingKey];
      if (!std || std <= 0) continue;
      const lower = std * (1 - BASE_TOLERANCE);
      const upper = std * (1 + BASE_TOLERANCE);
      if (m.baseValue < lower || m.baseValue > upper) {
        outOfRangeLabels.push(
          `${s.name} \u2192 ${m.label || m.gradingKey} (${m.baseValue}in vs ~${std}in for ${project.baseSize})`,
        );
      }
    }
  }
  checks.push({
    id: 'base-sanity',
    label: 'Base-size values match the sizing standard',
    severity: outOfRangeLabels.length === 0 ? 'pass' : 'warning',
    detail: outOfRangeLabels.length === 0
      ? ''
      : `Possibly mistyped or a unit mixup (cm as inches): ${outOfRangeLabels.join('; ')}. Standard values are midpoints of the published chart ranges — oversized fits deliberately pass the wider band.`,
    category: 'engineering',
  });

  // Grading monotonicity: each size should produce strictly larger values.
  const graded = gradePattern(project, standards);
  const nonMonotonic: string[] = [];
  for (const section of graded) {
    for (const m of section.measurements) {
      for (let i = 1; i < m.gradedValues.length; i++) {
        const prev = m.gradedValues[i - 1];
        const next = m.gradedValues[i];
        if (next.physicalValue < prev.physicalValue) {
          nonMonotonic.push(`${section.sectionName} \u2192 ${m.label}: ${prev.size} (${prev.physicalValue}) > ${next.size} (${next.physicalValue})`);
          break;
        }
      }
    }
  }
  checks.push({
    id: 'grade-monotonic',
    label: 'Sizes grow consistently',
    severity: nonMonotonic.length === 0 ? 'pass' : 'warning',
    detail: nonMonotonic.length === 0
      ? ''
      : `A larger size grades smaller than the one before it — usually a repeat-rounding conflict: ${nonMonotonic.join('; ')}.`,
    category: 'engineering',
  });

  // Measurement coverage: enough keys for a usable garment description.
  const presentKeys = new Set(
    project.sections.flatMap(s => s.measurements.map(m => m.gradingKey)),
  );
  const missingKeys = ESSENTIAL_MEASUREMENT_KEYS.filter(k => !presentKeys.has(k));
  checks.push({
    id: 'coverage',
    label: 'Essential measurements covered',
    severity: missingKeys.length === 0 ? 'pass' : 'warning',
    detail: missingKeys.length === 0
      ? ''
      : `Listing and sizing chart will be missing ${missingKeys.join(', ')}. Add them so buyers can self-select sizes.`,
    category: 'engineering',
  });

  // ---------- Presentation (the style-sheet layer) ----------
  checks.push({
    id: 'section-labels',
    label: 'All measurements have labels',
    severity: project.sections.every(s =>
      s.measurements.every(m => (m.label ?? '').trim().length > 0),
    ) ? 'pass' : 'warning',
    detail: project.sections.every(s => s.measurements.every(m => (m.label ?? '').trim().length > 0))
      ? ''
      : 'Unlabelled measurements render as raw chart keys in the PDF — spell out what each one is.',
    category: 'presentation',
  });

  checks.push({
    id: 'yarn-weight',
    label: 'Yarn weight selected',
    severity: project.yarnWeight ? 'pass' : 'warning',
    detail: project.yarnWeight
      ? ''
      : 'The yarn estimate needs a weight. Without it the materials block of the listing stays blank.',
    category: 'presentation',
  });

  const errorCount = checks.filter(c => c.severity === 'error').length;
  const warningCount = checks.filter(c => c.severity === 'warning').length;
  return { checks, ready: errorCount === 0, errorCount, warningCount };
}

// =====================================================================
// Listing generator — paste-ready marketplace description
// =====================================================================

export interface ListingOptions {
  /** Marketplace to tailor the copy for (length/convention differs). */
  platform: 'ravelry' | 'etsy' | 'ribblr' | 'payhip';
  /** Which yarn weight to quote the estimate for. */
  yarnWeight: YarnWeight;
  /** Optional designer tagline prepended to the description. */
  tagline?: string;
}

export interface ListingOutput {
  title: string;
  description: string;
  /** Attribute rows for the marketplace fields panel. */
  attributes: { label: string; value: string }[];
  techniques: string[];
}

function sizeRange(project: PatternProject): string {
  const graded = gradePattern(project, resolveProjectStandards(project));
  const bustCirc = graded
    .flatMap(s => s.measurements)
    .find(m => m.gradingKey === 'bust');
  if (!bustCirc) return '';
  const first = bustCirc.gradedValues[0]?.physicalValue;
  const last = bustCirc.gradedValues[bustCirc.gradedValues.length - 1]?.physicalValue;
  if (first == null || last == null) return '';
  const unit = project.gauge?.unit === 'cm' ? 'cm' : 'in';
  return `${first}${unit}–${last}${unit} (${bustCirc.gradedValues.length} sizes)`;
}

function gaugeLine(project: PatternProject): string {
  if (!project.gauge) return '';
  const unit = project.gauge.unit === 'cm' ? 'cm' : 'in';
  return `${project.gauge.stitchesPer4In} sts and ${project.gauge.rowsPer4In} rows over 4${unit}`;
}

/** Assembles a paste-ready marketplace listing from the project's real data.
 *  All numbers come from the grading engine, yarn estimator, or the
 *  project itself — nothing is invented. */
export function generateListing(
  project: PatternProject,
  options: ListingOptions,
): ListingOutput {
  // Guard against uncomputable estimates (missing or zero gauge makes the
  // yards-per-square-inch math collapse to zero — a blank line beats a
  // fabricated "0 yd" claim).
  const yarn = project.yarnWeight && project.gauge &&
    project.gauge.stitchesPer4In > 0 && project.gauge.rowsPer4In > 0
    ? estimateYarn(project, project.yarnWeight)
    : null;
  const range = sizeRange(project);
  const gauge = gaugeLine(project);
  const sectionNames = project.sections.map(s => s.name);
  const notes = (project.description ?? '').trim();

  const yarnLabel = options.yarnWeight ? YARN_WEIGHT_LABELS[options.yarnWeight] : null;
  const yarnBlock = yarn
    ? `Yarn: ${yarnLabel ? yarnLabel + ' — ' : ''}approximately ${Math.round(yarn.totalYards)} yd (${Math.round(yarn.totalMeters)} m), about ${yarn.skeins100g} × 100g skeins at the base size (${project.baseSize}).`
    : !project.yarnWeight
      ? `Yarn: ${yarnLabel ? yarnLabel + ' — ' : ''}yardage estimate needs a weight set in the Yarn tab.`
      : `Yarn: ${yarnLabel ? yarnLabel + ' — ' : ''}the yardage estimate needs a gauge set first; add gauge in the Sections tab to get an estimate for this weight.`;

  const attributeRows = [
    { label: 'Sizes', value: range || `Base size ${project.baseSize}` },
    ...(gauge ? [{ label: 'Gauge', value: gauge }] : []),
    ...(yarn ? [
      { label: 'Yarn yardage', value: `${Math.round(yarn.totalYards)} yd (${Math.round(yarn.totalMeters)} m)` },
      { label: 'Skeins (100g)', value: String(yarn.skeins100g) },
    ] : []),
    ...(project.author.trim() ? [{ label: 'Designed by', value: project.author.trim() }] : []),
  ];

  const techniques = [
    ...(sectionNames.length ? [`Knitted in sections: ${sectionNames.join(', ')}`] : []),
    ...(notes ? [`Notes: ${notes.split(/[.!?]/)[0]?.trim()}.`] : []),
  ];

  const header = options.tagline?.trim()
    ? `${options.tagline.trim()}\n\n`
    : '';

  const closing = {
    ravelry: `Knit this pattern and add it to your Ravelry queue — and tag your finished object, it genuinely helps other makers decide.\n\n© ${new Date().getFullYear()} ${project.author.trim() || 'the designer'}. For personal use; finished items made from this pattern may be sold.`,
    etsy: `Listing delivered as a PDF pattern, available immediately after purchase.\n\n© ${new Date().getFullYear()} ${project.author.trim() || 'the designer'}. Personal use; finished items may be sold with credit.`,
    ribblr: `Delivered as an interactive + printable pattern.\n\n© ${new Date().getFullYear()} ${project.author.trim() || 'the designer'}. Personal use; finished items may be sold with credit.`,
    payhip: `Instant digital download after checkout.\n\n© ${new Date().getFullYear()} ${project.author.trim() || 'the designer'}. Personal use; finished items may be sold with credit.`,
  } as const;

  const body = [
    `${project.name || 'Untitled pattern'}.`,
    ...(project.author.trim() ? [`A ${options.platform === 'etsy' ? 'hand-designed knit pattern by ' + project.author.trim() : 'pattern by ' + project.author.trim()}.`] : []),
    ...(range ? [`Sizes: ${range}.`] : []),
    ...(gauge ? [`Gauge: ${gauge}.`] : []),
    yarnBlock,
    ...(notes ? [`About this pattern: ${notes}`] : []),
    ...(techniques.length ? [`Construction: ${techniques.join(' ')}`] : []),
    '',
    closing[options.platform],
  ];

  return {
    title: project.name || `Knitting pattern${range ? ` — ${range}` : ''}`,
    description: header + body.join('\n'),
    attributes: attributeRows,
    techniques,
  };
}

export const PLATFORM_LIST: ListingOptions['platform'][] = ['ravelry', 'etsy', 'ribblr', 'payhip'];
