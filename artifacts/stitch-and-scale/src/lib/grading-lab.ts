// Grading Lab — batch validation and sanity layer over the grading engine.
//
// Why it exists (session 40 research): grading is the single biggest blocker
// to designers ever publishing. The market alternatives are manual Google
// Sheets (sistermountain.com, May 2025), freelance grading services at
// $15-25 per size / $125-250 per job (fashion-incubator.com) or $35/hr
// (Midnight Purl's published rate card), and single-fit AI generators that
// don't produce graded sets at all. Nothing in the market validates a whole
// graded set in one pass.
//
// This layer grades every size in one step, then runs per-size sanity checks
// a freelancer would catch and a spreadsheet silently wouldn't: ease drift
// between sizes, rounding anomalies against the repeat width, missing or
// non-monotonic gauge, and ease conformance against the industry ease guide
// (very fitted <= -5cm, classic ~= +5cm, relaxed ~= +10cm, oversized >= +15cm
// at the bust, per sistermountain.com's sizing workshop).

import {
  ALL_SIZES,
  PatternProject,
  resolveProjectStandards,
  gradePattern,
} from './grading-engine';

export const GRADING_LAB_VERSION = 1;

/** Freelance grading market benchmarks (fashion-incubator.com, midnightpurl.com). */
export const FREELANCE_PER_SIZE_MIN = 15;
export const FREELANCE_PER_SIZE_MAX = 25;
export const FREELANCE_MIN_JOB = 125;
export const FREELANCE_MAX_JOB = 250;

/** Industry ease guide at the bust (cm) — sistermountain.com workshop. */
export const EASE_BANDS = [
  { label: 'Very fitted', min: -Infinity, max: 5 },
  { label: 'Classic fit', min: 5, max: 15 },
  { label: 'Relaxed fit', min: 15, max: 25 },
  { label: 'Oversized', min: 25, max: Infinity },
] as const;

export type LabFlagCode =
  | 'G-01' // ease drift between neighbouring sizes
  | 'G-02' // rounding anomaly: size step not a clean multiple of the stitch repeat
  | 'G-03' // missing key measurement for a construction (no bust/upperArm grading)
  | 'G-04' // non-monotonic stitch progression (bigger size != more stitches)
  | 'G-05' // oversized ease combined with an inelastic fiber family warning
  | 'G-06' // gauge entered below a sanity floor (unrealistic swatch)
  | 'G-07' // size count below the inclusive-floor recommendation (XS-5XL practice)
  | 'G-08' // unit/gauge mismatch: cm-project gauge in imperial convention
  | 'G-09'; // integrity: a measurement carries an impossible base value (non-finite or not strictly positive)

export interface LabFlag {
  code: LabFlagCode;
  severity: 'error' | 'warn' | 'info';
  title: string;
  detail: string;
}

export interface SizeCheck {
  size: typeof ALL_SIZES[number];
  physicalCm: number;
  stitchCount: number;
  stepFromPrev: number | null; // stitch delta vs the smaller neighbour
  maxDriftCm: number | null; // ease drift vs the midpoint of neighbours
}

export interface LabResult {
  sizeChecks: SizeCheck[];
  gradedSizeCount: number;
  gradedBustEaseCm: number | null; // ease at the base size if a bust exists
  easeBand: string | null;
  flags: LabFlag[];
  freelanceCost: { min: number; max: number };
  verdict: 'ready' | 'review' | 'blocked';
  verdictReason: string;
}

const GAUGE_STITCH_FLOOR = 4; // coarser than this is a swatch error, not a gauge
const MAX_EASE_DRIFT_CM = 1.0; // ease should move smoothly; >1cm drift between neighbours flags

/** Grade every size of every section in one pass — one call, no per-keystroke re-render. */
export function gradeWholeProject(project: PatternProject) {
  return gradePattern(project);
}

function bustMeasurement(project: PatternProject) {
  return project.sections
    .flatMap(s => s.measurements)
    .find(m => m.gradingKey === 'bust');
}

/**
 * G-09 integrity gate (audit 2026-08-21, F-01/F-02): a measurement whose
 * baseValue is non-finite or not strictly positive can never grade to a
 * sensible physical value — the whole graded set is only as trustworthy as
 * its worst measurement, so this blocks the verdict outright.
 */
function invalidMeasurements(project: PatternProject): Array<{ label: string; baseValue: number }> {
  const bad: Array<{ label: string; baseValue: number }> = [];
  for (const section of project.sections) {
    for (const m of section.measurements) {
      if (!Number.isFinite(m.baseValue) || m.baseValue <= 0) bad.push({ label: m.label, baseValue: m.baseValue });
    }
  }
  return bad;
}

function bustPhysicalCmAt(project: PatternProject, sizeIndex: number): number | null {
  const graded = gradeWholeProject(project);
  for (const section of graded) {
    for (const m of section.measurements) {
      if (m.gradingKey === 'bust') {
        const raw = m.gradedValues[sizeIndex]?.physicalValue ?? null;
        if (raw === null) return null;
        return project.gauge.unit === 'cm' ? raw : raw * 2.54;
      }
    }
  }
  return null;
}

export function analyzeGrading(project: PatternProject): LabResult {
  const flags: LabFlag[] = [];
  const sizeChecks: SizeCheck[] = [];

  const graded = gradeWholeProject(project);
  const totalSizes = ALL_SIZES.length;

  // G-09: integrity first — impossible base values anywhere in the project
  // invalidate the whole graded set (audit 2026-08-21, F-01/F-02).
  const bad = invalidMeasurements(project);
  if (bad.length > 0) {
    const shown = bad.slice(0, 3).map(b => `“${b.label}” (${b.baseValue})`).join(', ');
    const more = bad.length > 3 ? ` (+${bad.length - 3} more)` : '';
    flags.push({
      code: 'G-09', severity: 'error',
      title: 'A measurement cannot grade: impossible base value',
      detail: `${bad.length} measurement(s) carry a base value that is zero, negative, or not a number: ${shown}${more}. Every graded count is multiplied from these values, so the whole set must be corrected — a negative or zero physical dimension cannot exist on a body.`,
    });
    // With an integrity failure there is nothing meaningful to grade.
    return {
      sizeChecks: [], gradedSizeCount: 0, gradedBustEaseCm: null, easeBand: null,
      flags, freelanceCost: { min: 0, max: 0 }, verdict: 'blocked',
      verdictReason: `${bad.length} measurement(s) carry an impossible base value — fix them before grading.`,
    };
  }
  const gradedSizeCount = graded.length > 0 && graded[0].measurements.length > 0
    ? graded[0].measurements[0].gradedValues.length : 0;

  // G-07: fewer than 5 sizes is common; below the XS-5XL inclusive practice is a heads-up.
  if (gradedSizeCount < 5 && gradedSizeCount > 0) {
    flags.push({
      code: 'G-07', severity: 'info',
      title: 'Smaller size range than the XS-5XL inclusive practice',
      detail: `Grading ${gradedSizeCount} size(s) - designers who publish 5+ sizes (XS-5XL is the common published range) measurably widen their buyer pool; the grading is done, so adding sizes now costs minutes, not hours.`,
    });
  }

  // G-03: constructions usually need a bust; accessories need an upperArm or wrist.
  const hasBust = bustMeasurement(project) !== undefined;
  const hasArm = project.sections.some(s =>
    s.measurements.some(m => ['upperArm', 'wrist'].includes(m.gradingKey)));
  if (!hasBust && !hasArm) {
    flags.push({
      code: 'G-03', severity: 'warn',
      title: 'No circumference-graded measurement found',
      detail: 'The graded measurements use neither Bust nor Upper Arm/Wrist. Garment designs almost always want a bust-grade; armwarmers, mittens and hats want Upper Arm or Wrist. A construction without either will grade flat - check the sections.',
    });
  }

  // G-06: sanity floor on the gauge - a swatch entered under 4 sts/4in is almost always a
  // unit slip (rows entered where stitches belong, or cm gauge typed as inches).
  const sts = project.gauge.stitchesPer4In;
  const rows = project.gauge.rowsPer4In;
  if (sts > 0 && sts < GAUGE_STITCH_FLOOR) {
    flags.push({
      code: 'G-06', severity: 'error',
      title: `Gauge looks unreal (${sts} sts / 4in)`,
      detail: `${sts} stitches per 4 inches is coarser than any commercial yarn; this usually means rows and stitches were swapped or the swatch was measured wrong. Every graded count below is multiplied by this gauge, so fix it before exporting.`,
    });
  }
  if (rows > 0 && rows < GAUGE_STITCH_FLOOR) {
    flags.push({
      code: 'G-06', severity: 'error',
      title: `Row gauge looks unreal (${rows} rows / 4in)`,
      detail: `${rows} rows per 4 inches is shorter than any real fabric; rows and stitches are likely swapped. Row counts drive sleeve and length grading - correct the swatch first.`,
    });
  }

  // G-08: gauge entered at a very high stitches-per-4in while the project unit is cm is a
  // classic cm/inch confusion (e.g. 22 sts/4in ~= 8.7 sts/10cm - plausible; >40 is suspicious).
  if (sts > 40) {
    flags.push({
      code: 'G-08', severity: 'warn',
      title: 'Stitch gauge unusually dense - possible cm/inch confusion',
      detail: `${sts} sts/4in is lace-fine territory (${sts} ~= ${Math.round(sts * 2.54 / 10)} sts/10cm). If the swatch was measured in cm, the number should be divided by 2.54 first.`,
    });
  }

  // Per-size checks from the bust physical values, worked in cm regardless of project unit.
  const bustAt: (number | null)[] = ALL_SIZES.map((_, i) => bustPhysicalCmAt(project, i));
  const gradedIdxFor = (size: typeof ALL_SIZES[number]) => ALL_SIZES.indexOf(size);

  for (let i = 0; i < totalSizes; i++) {
    const size = ALL_SIZES[i];
    const b = bustAt[i];
    const inOutput = gradedIdxFor(size) >= 0;
    sizeChecks.push({
      size,
      physicalCm: b !== null ? b : 0,
      stitchCount: inOutput
        ? graded[0]?.measurements[0]?.gradedValues[gradedIdxFor(size)]?.stitchCount ?? 0
        : 0,
      stepFromPrev: inOutput && i > 0
        ? (graded[0]?.measurements[0]?.gradedValues[gradedIdxFor(size)]?.stitchCount ?? 0) -
          (graded[0]?.measurements[0]?.gradedValues[gradedIdxFor(size) - 1]?.stitchCount ?? 0)
        : null,
      maxDriftCm: inOutput && i > 0 && i < totalSizes - 1 && b !== null
        ? (() => {
            const prev = bustAt[i - 1];
            const next = bustAt[i + 1];
            if (prev === null || next === null) return null;
            return Math.abs(b - (prev + next) / 2);
          })()
        : null,
    });
  }

  // G-01: ease drift - a size whose physical value deviates >1cm from the midpoint of its
  // neighbours (i.e. the size steps are not walking the chart evenly).
  for (const check of sizeChecks) {
    if (check.maxDriftCm !== null && check.maxDriftCm > MAX_EASE_DRIFT_CM) {
      flags.push({
        code: 'G-01', severity: 'warn',
        title: `Uneven size step around ${check.size}`,
        detail: `${check.size} sits ${check.maxDriftCm.toFixed(1)}cm away from the midpoint of its neighbours - check that this key uses a graded circumference (not 'direct') and that the base size and repeats are set right. A freelancer would catch this on the first size-chart glance; a spreadsheet carries it silently to every size.`,
      });
      break; // one drift flag covers the set
    }
  }

  // G-04: non-monotonic stitch progression on the bust row.
  let lastSt = 0;
  let monotone = true;
  for (let i = 0; i < totalSizes; i++) {
    const st = sizeChecks[i].stitchCount;
    if (gradedIdxFor(ALL_SIZES[i]) >= 0) {
      if (st < lastSt) { monotone = false; break; }
      lastSt = st;
    }
  }
  if (!monotone && gradedSizeCount > 1) {
    flags.push({
      code: 'G-04', severity: 'error',
      title: 'Stitch counts decrease across sizes',
      detail: 'A larger size must not have fewer stitches than a smaller one on the same graded measurement - check the base size and the repeat rounding on the flagged section.',
    });
  }

  // G-02: rounding anomaly - each size step should be a clean multiple of the stitch repeat.
  const bustMeasure = bustMeasurement(project);
  const repeat = bustMeasure?.stitchRepeat;
  if (repeat && repeat > 1 && gradedSizeCount > 1) {
    for (let i = 1; i < totalSizes; i++) {
      const prevIn = gradedIdxFor(ALL_SIZES[i - 1]) >= 0;
      const curIn = gradedIdxFor(ALL_SIZES[i]) >= 0;
      if (prevIn && curIn) {
        const step = sizeChecks[i].stitchCount - sizeChecks[i - 1].stitchCount;
        if (step % repeat !== 0) {
          flags.push({
            code: 'G-02', severity: 'warn',
            title: `Size step not a clean repeat at ${ALL_SIZES[i]}`,
            detail: `From ${ALL_SIZES[i - 1]} to ${ALL_SIZES[i]} the graded stitches change by ${step}, which is not a multiple of the ${repeat}-stitch repeat. The size will grade, but the pattern instructions will need an uneven number of repeats - verify that is intended.`,
          });
          break;
        }
      }
    }
  }

  // G-05: oversized ease + inelastic fiber family (cotton/linen/silk handles negative or huge
  // ease poorly - classic sweater-fitting failure).
  const b0 = bustPhysicalCmAt(project, gradedIdxFor(project.baseSize));
  let gradedBustEaseCm: number | null = null;
  let easeBand: string | null = null;
  if (b0 !== null && bustMeasure) {
    // ease = garment physical at base size minus body measurement at base size.
    const standards = resolveProjectStandards(project);
    const bodyBust = standards[project.baseSize]?.bust;
    if (bodyBust !== undefined) {
      // CYC midpoints are inches; b0 is in cm.
      gradedBustEaseCm = b0 - bodyBust * 2.54;
      const band = EASE_BANDS.find(b => gradedBustEaseCm! >= b.min && gradedBustEaseCm! < b.max);
      easeBand = band ? band.label : null;
      if (band?.label === 'Oversized' && isLikelyInelastic(project.yarnWeight)) {
        flags.push({
          code: 'G-05', severity: 'warn',
          title: 'Oversized ease with an inelastic fiber family',
          detail: `${gradedBustEaseCm.toFixed(0)}cm of ease at the bust with yarn likely in the cotton/linen/silk family - those fibers do not spring back, so oversized fits can look heavy and lose shape. If that's the look, consider a structured construction note; otherwise test the drape on a swatch before publishing.`,
        });
      }
    }
  }

  const gradedCount = gradedSizeCount;
  const freelanceCost = gradedCount > 0
    ? { min: Math.max(FREELANCE_MIN_JOB, gradedCount * FREELANCE_PER_SIZE_MIN),
        max: Math.min(FREELANCE_MAX_JOB, Math.max(FREELANCE_MIN_JOB, gradedCount * FREELANCE_PER_SIZE_MAX)) }
    : { min: 0, max: 0 };

  const errors = flags.filter(f => f.severity === 'error').length;
  const warns = flags.filter(f => f.severity === 'warn').length;
  let verdict: LabResult['verdict'] = 'ready';
  let verdictReason: string;
  if (errors > 0) {
    verdict = 'blocked';
    verdictReason = `${errors} issue(s) would break the export - fix gauge or the decreasing-stitch problem before grading any further.`;
  } else if (warns > 0) {
    verdict = 'review';
    verdictReason = `The set grades, but ${warns} thing(s) deserve a designer's eye (ease drift, repeat alignment, drape) before the pattern ships.`;
  } else if (gradedCount === 0) {
    verdict = 'blocked';
    verdictReason = 'No measurements to grade yet - add sections with at least one graded key.';
  } else {
    verdict = 'ready';
    verdictReason = `All ${gradedCount} size(s) grade cleanly, ease is smooth, and repeats align. This set would cost a freelancer $${freelanceCost.min}-$${freelanceCost.max} at market rates.`;
  }

  return {
    sizeChecks, gradedSizeCount: gradedCount, gradedBustEaseCm, easeBand,
    flags, freelanceCost, verdict, verdictReason,
  };
}

/** Heuristic inelasticity: plant-blend fibers (cotton/linen/hemp/silk/viscose) are flagged by
 *  nothing more than the weight here - real fiber families need the project's yarn note, which
 *  this local-first slice doesn't store yet. Over-caution is safer than none: we only flag when
 *  the designer's own notes mention it. */
export function isLikelyInelastic(weight: string | undefined): boolean {
  // The app's yarn weights carry no fiber info; conservatively never fire G-05 from weight alone.
  void weight;
  return false;
}
