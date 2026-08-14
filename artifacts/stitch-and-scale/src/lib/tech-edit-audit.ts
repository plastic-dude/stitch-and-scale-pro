/**
 * CHK-010 — Self Tech-Edit Audit
 *
 * Automated arithmetic audit of a graded pattern, mirroring the "numbers
 * sweep" a human tech editor performs (every number, every calculation,
 * every measurement — Marina Skua's two-sweep method).
 *
 * Why this exists (session-11 research):
 * - Tech editors charge $20–40/hr and a sweater takes ~4 hours of editing
 *   (StitchReader, Heather Storta, r/AdvancedKnitting).
 * - Top reasons designers skip tech editing: cost, "testers are enough" —
 *   but testers usually knit ONE size, so grading math across all sizes
 *   goes undetected until buyer complaints.
 * - No tool on the market takes a designer's graded table and runs the
 *   arithmetic a tech editor would run. KnitBird is dead (Adobe AIR),
 *   Stitch Foundry $185 and broken on new OSes, chart makers audit
 *   nothing. Fit Analytics/Size.ly are retail widgets, not pattern math.
 * - Stitch & Scale already has every stitch count, row count, size table
 *   and gauge in machine form — the only pattern app positioned to do
 *   this. Their flaw: every alternative is human labour at $30-40/hr.
 *   Our strength: the arithmetic pass is instant, free, and repeatable.
 *
 * This library audits NUMBERS only. Style/grammar/abbreviations remain
 * human-editor territory — the audit produces a paste-ready "pre-edit
 * summary" so a paid editor's bill shrinks to the prose pass.
 */
import {
  ALL_SIZES,
  gradePattern,
  PatternProject,
  SectionMeasurement,
  SizeKey,
  StandardsTable,
  resolveProjectStandards,
} from './grading-engine';
import { SIZE_STANDARDS } from './grading-engine';

export type AuditSeverity = 'error' | 'warning' | 'info' | 'pass';

export interface AuditFinding {
  /** Section + measurement the finding relates to, e.g. "Body › Bust" */
  location: string;
  severity: AuditSeverity;
  /** Stable machine-readable code, e.g. GA-01 */
  code: string;
  title: string;
  /** Plain-language explanation of what's wrong and how to fix it. */
  detail: string;
}

export interface AuditSectionResult {
  sectionName: string;
  measurementLabel: string;
  measurements: number;
  sizes: SizeKey[];
}

export interface AuditSummary {
  findingCounts: Record<AuditSeverity, number>;
  /** 0–100; 100 = the numbers sweep passed clean. */
  score: number;
  /** Stable verdict shown to the designer. */
  verdict: 'clean' | 'check' | 'fix';
  findings: AuditFinding[];
  /** Session-42 market framing: what a human editor would quote for this
   *  sweep, with real rate bands and the ~10-day turnaround wait. */
  marketBill: {
    low: number;
    high: number;
    hours: number;
    pending: number;
    waitDays: number;
    note: string;
  };
}

export interface AuditConfig {
  /** Hourly rate used in the cost-saved framing ($20–40 typical). */
  editorRatePerHour?: number;
}

const DEFAULT_RATE = 35;

/* -------------------------- session-42 market facts -----------------------
 * Sources:
 * - ribblr tech-editing thread: US editors $20–30/hr, 15-min billing
 *   https://meet.ribblr.com/t/tech-editing/210921
 * - r/AdvancedKnitting 'Tech Editing' thread: going rate $30–40/hr, sweaters
 *   'up to 4 hours', and a documented shortage of good editors
 *   https://www.reddit.com/r/AdvancedKnitting/comments/1840wp1/tech_editing/
 * - Kim, knitting technical editor (knitjulep.com, 250+ patterns edited):
 *   $35/hr; simple accessories 1–2h, complex accessories/simple garments
 *   1–3h, complex garments 2–7h; turnaround ≈ 10 days
 *   https://knitjulep.com/knitting-technical-editing-services/
 * - bramblesandbindweed.com: £24 (~$32) per 15-min increment
 *   https://bramblesandbindweed.com/technical-editing/
 * - Woolly Wormhead 'The True Cost of a Pattern': avg tech edit ≈ £50/
 *   pattern inside a pattern book (whole book £800–900)
 *   https://woollywormhead.com/blog/2018/05/10/the-true-cost-of-a-pattern-revisited
 * - worksofourhands.com fixed pricing: per-pattern rate + $5 per extra size
 *   https://worksofourhands.com/2023/05/30/pros-cons-and-fixed-pricing-newbie-tech-editor-part-1/
 */
export const EDITOR_MARKET = {
  /** Market hourly range, USD. */
  rateLow: 20,
  rateHigh: 40,
  /** Typical human-editor turnaround in days. */
  turnaroundDays: 10,
  /** Hours the market quotes per garment complexity band. */
  hoursBySizes: [
    { maxSizes: 1, hours: 1 },   // accessories / one-size
    { maxSizes: 3, hours: 2 },
    { maxSizes: 6, hours: 3 },
    { maxSizes: 9, hours: 4 },
    { maxSizes: Infinity, hours: 7 }, // complex multi-size garments
  ],
} as const;

/** Rough billable-hours estimate for the numbers sweep a human editor would
 *  perform on this project, based on its graded size count (more sizes =
 *  more arithmetic to verify; fixed-price editors add ~$5 per extra size). */
export function editorHoursFor(project: PatternProject): number {
  const sizes = new Set<SizeKey>();
  for (const section of project.sections) {
    for (const measurement of section.measurements) {
      for (const size of gradedSizesFor(measurement)) sizes.add(size);
    }
  }
  const count = sizes.size;
  const band = EDITOR_MARKET.hoursBySizes.find(b => count <= b.maxSizes);
  return band ? band.hours : EDITOR_MARKET.hoursBySizes[EDITOR_MARKET.hoursBySizes.length - 1].hours;
}

/** Every size the project actually grades (those whose base physical value
 *  is greater than zero — a zero means "not part of this pattern"). */
function gradedSizesFor(m: SectionMeasurement): SizeKey[] {
  return ALL_SIZES.filter(size => Math.abs(m.baseValue) > 0);
}

/** Every distinct size the project actually grades — exported for the
 *  market-bill note (issue #31): the note must name the graded-size count,
 *  never the findings count. */
export function gradedSizeCount(project: PatternProject): number {
  const sizes = new Set<SizeKey>();
  for (const section of project.sections) {
    for (const measurement of section.measurements) {
      for (const size of gradedSizesFor(measurement)) sizes.add(size);
    }
  }
  return sizes.size;
}

function location(sectionName: string, label: string): string {
  return `${sectionName} › ${label}`;
}

/**
 * Re-derives the full grading and compares every stored-style expectation
 * against freshly computed values. The project's own measurement config is
 * the source of truth; this re-computes what gradePattern would produce
 * and flags where the numbers fail tech-edit sanity checks.
 */
function regrade(project: PatternProject) {
  // Mirror the workspace exactly: grade from the project's own recorded
  // standard (CYC or its frozen Custom snapshot), never the live setting.
  return gradePattern(project, resolveAuditStandards(project));
}

/* --------------------------- individual checks --------------------------- */

/** GA-01: gauge usable at all — no gauge, no trustworthy numbers. */
function gaugeIsUsable(project: PatternProject): boolean {
  return !!(
    project.gauge &&
    project.gauge.stitchesPer4In > 0 &&
    project.gauge.rowsPer4In > 0
  );
}

function checkGauge(project: PatternProject): AuditFinding[] {
  const usable = gaugeIsUsable(project);
  return usable
    ? []
    : [{
        location: 'Project',
        severity: 'error',
        code: 'GA-01',
        title: 'Gauge not set — every number below is unreliable',
        detail: 'Set stitches/rows per 4in in the project gauge. A tech editor cannot verify math without it, and neither can a tester. This is the first thing on any tech-edit pre-edit checklist.',
      }];
}

/** GA-02: base values sanity — negatives and zeros where they shouldn't be. */
function checkBaseValues(project: PatternProject): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (const section of project.sections) {
    for (const m of section.measurements) {
      if (m.baseValue < 0) {
        findings.push({
          location: location(section.name, m.label),
          severity: 'error',
          code: 'GA-02',
          title: 'Base measurement is negative',
          detail: `Base value ${m.baseValue} is negative. Measurements must be positive — a negative width or length cannot be knit.`,
        });
      } else if (m.baseValue === 0) {
        findings.push({
          location: location(section.name, m.label),
          severity: 'info',
          code: 'GA-02b',
          title: 'Base measurement is zero — excluded from grading',
          detail: 'A zero base value excludes this measurement from all graded sizes. If this is intentional (e.g. a decorative panel), fine; if not, enter the base size value.',
        });
      }
    }
  }
  return findings;
}

/** GA-03: size progression — physical values must be monotonic in size. */
function checkSizeProgression(project: PatternProject): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const graded = regrade(project);
  for (const section of graded) {
    for (const m of section.measurements) {
      const sizes = gradedSizesFor(project.sections
        .find(s => s.id === section.sectionId)
        ?.measurements.find(mm => mm.id === m.measurementId) ?? { baseValue: 0 } as SectionMeasurement);
      if (sizes.length < 2) continue;
      const values = sizes.map(s => {
        const g = m.gradedValues.find(v => v.size === s);
        return g ? g.physicalValue : 0;
      });
      const mono = values.every((v, i) => i === 0 || v >= values[i - 1]);
      if (!mono) {
        findings.push({
          location: location(section.sectionName, m.label),
          severity: 'warning',
          code: 'GA-03',
          title: 'Size progression is not monotonic',
          detail: `Physical values across ${sizes.join(' → ')} are: ${values.join(', ')} in. Garment dimensions should grow (or stay level) with size — check whether this measurement's grading key or type is correct.`,
        });
      }
    }
  }
  return findings;
}

/** GA-04: stitch/row rounding consistency — the rounded number must still be
 *  within tolerance of the raw target (a repeat-constraint can pull a
 *  number far from the raw target; beyond ~10% the fit risk rises). */
function checkRoundingTolerance(project: PatternProject): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const graded = regrade(project);
  const TOL = 0.10;
  for (const section of graded) {
    for (const m of section.measurements) {
      for (const g of m.gradedValues) {
        if (g.stitchCount <= 0) continue;
        const stitchDev = Math.abs(g.stitchCount - g.exactStitchCount) / g.exactStitchCount;
        if (stitchDev > TOL) {
          findings.push({
            location: location(section.sectionName, m.label),
            severity: 'warning',
            code: 'GA-04',
            title: `Stitch count pulled ${Math.round(stitchDev * 100)}% from raw target (${g.size})`,
            detail: `Rounded to ${g.stitchCount} stitches vs raw ${g.exactStitchCount.toFixed(1)}. The stitch pattern's repeat/parity constraint is forcing the count away from the target measurement — check the finished fit at this size.`,
          });
        }
        if (g.rowCount !== undefined && g.exactRowCount !== undefined && g.rowCount > 0) {
          const rowDev = Math.abs(g.rowCount - g.exactRowCount) / g.exactRowCount;
          if (rowDev > TOL) {
            findings.push({
              location: location(section.sectionName, m.label),
              severity: 'info',
              code: 'GA-04b',
              title: `Row count pulled ${Math.round(rowDev * 100)}% from raw target (${g.size})`,
              detail: `Rounded to ${g.rowCount} rows vs raw ${g.exactRowCount.toFixed(1)}. Length tolerance is usually forgiving, but flag if the measurement is critical (e.g. armhole depth).`,
            });
          }
        }
      }
    }
  }
  return findings;
}

/** GA-05: repeat/parity rule validity — remainder must be inside the repeat
 *  and parity must be positive where used. */
function checkRoundingRules(project: PatternProject): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (const section of project.sections) {
    for (const m of section.measurements) {
      if (m.stitchRepeat !== undefined) {
        const rep = m.stitchRepeat;
        const rem = m.stitchRemainder ?? 0;
        if (rep <= 1) {
          findings.push({
            location: location(section.name, m.label),
            severity: 'warning',
            code: 'GA-05',
            title: 'Stitch repeat of 1 is a no-op',
            detail: `A repeat of ${rep} rounds to the nearest integer like no repeat at all. Set the actual stitch-pattern multiple (e.g. 6 for a 6-stitch cable panel) or clear it.`,
          });
        }
        if (rem < 0 || rem >= rep) {
          findings.push({
            location: location(section.name, m.label),
            severity: 'error',
            code: 'GA-05b',
            title: 'Stitch remainder is invalid for the repeat',
            detail: `Remainder ${rem} is outside the valid range 0…${rep - 1} for a repeat of ${rep}. Valid counts would be …${rep + rem}, ${2 * rep + rem}, …`,
          });
        }
      }
      if (m.stitchParity && m.stitchRepeat) {
        findings.push({
          location: location(section.name, m.label),
          severity: 'info',
          code: 'GA-05c',
          title: 'Both parity and repeat set — parity wins',
          detail: 'When both are set, parity rounding takes precedence. Keep whichever constraint actually governs this measurement.',
        });
      }
    }
  }
  return findings;
}

/** GA-06: stitch counts must be plausible for the size — never zero or
 *  negative after rounding in a graded size. */
function checkStitchCounts(project: PatternProject): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const graded = regrade(project);
  for (const section of graded) {
    for (const m of section.measurements) {
      for (const g of m.gradedValues) {
        if (g.stitchCount <= 0) {
          findings.push({
            location: location(section.sectionName, m.label),
            severity: 'error',
            code: 'GA-06',
            title: `Zero/negative stitch count at size ${g.size}`,
            detail: `Rounded stitch count is ${g.stitchCount}. A count this small usually means the base value, gauge, or grading key is wrong for this measurement.`,
          });
        }
      }
    }
  }
  return findings;
}

/** GA-07: circumference vs width discipline — a 'width' measurement graded
 *  from a circumference key must not exceed half the key's body value by a
 *  suspicious margin, catching mis-keyed measurements. */
function checkMeasurementTyping(project: PatternProject): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const graded = regrade(project);
  for (const section of graded) {
    const src = project.sections.find(s => s.id === section.sectionId);
    if (!src) continue;
    for (const m of section.measurements) {
      const mDef = src.measurements.find(mm => mm.id === m.measurementId);
      if (!mDef) continue;
      const key = m.gradingKey;
      // Circumference keys (bust/waist/hip/arm...) graded as 'width' get
      // halved — but neckCircumference and wrist as "width" pieces is a
      // common real-world mis-keying when designers want half-back widths.
      // We only flag the genuinely wrong case: a length key graded as width.
      if (mDef.measurementType === 'width' && (key === 'backLength' || key === 'sleeveLength' || key === 'armholeDepth')) {
        findings.push({
          location: location(section.sectionName, m.label),
          severity: 'warning',
          code: 'GA-07',
          title: 'Length key graded as a width',
          detail: `${m.label} uses the ${key} key (a length) with type "width", which halves the value when grading. If this measurement should be a length, set its type to "length" or "direct".`,
        });
      }
    }
  }
  return findings;
}

/** GA-08: minimum size count — one-size garments are fine, but grading
 *  across fewer than 3 sizes while billing a "multi-size" pattern is the
 *  classic buyer-complaint pattern. */
function checkSizeCount(project: PatternProject): AuditFinding[] {
  const sizesInUse = new Set<SizeKey>();
  for (const section of project.sections) {
    for (const m of section.measurements) {
      for (const s of gradedSizesFor(m)) sizesInUse.add(s);
    }
  }
  if (sizesInUse.size === 0) {
    return [{
      location: 'Project',
      severity: 'warning',
      code: 'GA-08',
      title: 'No sizes graded',
      detail: 'Every measurement has a zero base value, so nothing is graded. Enter the base size\'s measurements first.',
    }];
  }
  if (sizesInUse.size === 1) {
    return [{
      location: 'Project',
      severity: 'info',
      code: 'GA-08b',
      title: 'Single-size pattern',
      detail: 'Only one size is graded. Single-size patterns are a common buyer complaint class ("why isn\'t this in more sizes?") — multi-size patterns consistently out-sell them on Ravelry and Etsy. Consider grading 3+ sizes before publishing.',
    }];
  }
  return [];
}

/** GA-09: CYC body-standard cross-check for the base size — is the designer's
 *  stated base measurement close to the standard? Big drift usually means a
 *  body vs garment-ease mix-up. */
function checkBaseStandardDrift(project: PatternProject): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const std = resolveAuditStandards(project);
  const base = std[project.baseSize];
  if (!base) return findings;
  for (const section of project.sections) {
    for (const m of section.measurements) {
      if (m.baseValue <= 0 || m.measurementType === 'direct') continue;
      const stdValue = base[m.gradingKey];
      if (!stdValue) continue;
      const target = m.measurementType === 'width' ? stdValue * 0.5 : stdValue;
      const drift = (m.baseValue - target) / target;
      // Positive drift is ease — expected and correct for garments, so the
      // check only flags genuinely suspicious cases: measurements SMALLER
      // than the body itself (a garment can't be narrower than the body it
      // covers), or ones more than double the body value (usually a
      // unit/circumference-vs-width mix-up).
      if (drift < 0) {
        findings.push({
          location: location(section.name, m.label),
          severity: 'warning',
          code: 'GA-09',
          title: `Base value ${Math.round(Math.abs(drift) * 100)}% below the ${project.sizingStandard ?? 'CYC'} ${project.baseSize} standard`,
          detail: `You entered ${m.baseValue}${project.gauge.unit} for ${m.label}, but the ${project.sizingStandard ?? 'CYC'} standard body value for size ${project.baseSize} is ${target.toFixed(1)}${project.gauge.unit}. A garment can't be smaller than the body it covers — check whether this should be a circumference grading key, or whether the base value belongs to a different size.`,
        });
      } else if (drift > 1.0) {
        findings.push({
          location: location(section.name, m.label),
          severity: 'warning',
          code: 'GA-09b',
          title: `Base value more than double the ${project.sizingStandard ?? 'CYC'} ${project.baseSize} standard`,
          detail: `You entered ${m.baseValue}${project.gauge.unit} for ${m.label} vs a body value of ${target.toFixed(1)}${project.gauge.unit}. Ease explains drift, but not a doubling — this usually means a circumference was entered where a half-width belongs (or vice versa).`,
        });
      }
    }
  }
  return findings;
}

/** GA-10: duplicate labels within a section — ambiguous references are a
 *  real tech-edit clarity flag ("bust" meaning two different numbers). */
function checkDuplicateLabels(project: PatternProject): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (const section of project.sections) {
    const counts = new Map<string, number>();
    for (const m of section.measurements) {
      counts.set(m.label, (counts.get(m.label) ?? 0) + 1);
    }
    for (const [label, n] of counts) {
      if (n > 1) {
        findings.push({
          location: location(section.name, label),
          severity: 'warning',
          code: 'GA-10',
          title: `Duplicate measurement label "${label}"`,
          detail: `This label appears ${n} times in "${section.name}". Two measurements with the same name confuse both test knitters and tech editors — give each a distinct name (e.g. "Bust (front)" / "Bust (back)").`,
        });
      }
    }
  }
  return findings;
}

/** GA-11: row gauge missing when row rounding is used — silently wrong. */
function checkRowGauge(project: PatternProject): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const usesRows = project.sections.some(s =>
    s.measurements.some(m => m.rowRepeat !== undefined || m.rowParity !== undefined));
  if (usesRows && (!project.gauge.rowsPer4In || project.gauge.rowsPer4In <= 0)) {
    findings.push({
      location: 'Project',
      severity: 'error',
      code: 'GA-11',
      title: 'Row rounding used but row gauge is not set',
      detail: 'At least one measurement rounds its row count, but rows/4in is unset. Row counts will be computed with zero gauge — every length in the pattern is silently wrong. Enter the row gauge before publishing.',
    });
  }
  return findings;
}

/** GA-12: single-section check — patterns with only one section are rarely
 *  a full garment; flag before publishing as a completeness check. */
function checkCompleteness(project: PatternProject): AuditFinding[] {
  if (project.sections.length < 2) {
    return [{
      location: 'Project',
      severity: 'info',
      code: 'GA-12',
      title: 'Pattern has a single section',
      detail: 'Most garments have at least a body and sleeves. If this pattern is genuinely one piece (scarf, cowl), ignore this; otherwise add sections before the publish readiness check.',
    }];
  }
  return [];
}

function resolveAuditStandards(project: PatternProject): StandardsTable {
  // The workspace passes liveCustomStandard explicitly; the audit runs
  // offline (no live chart context), so pass SIZE_STANDARDS as the live
  // fallback — the same default the workspace uses for CYC projects.
  return resolveProjectStandards(project, SIZE_STANDARDS);
}

/* ------------------------------ aggregation ------------------------------ */

const SEVERITY_WEIGHT: Record<AuditSeverity, number> = { error: 25, warning: 10, info: 2, pass: 0 };

/** What the same numbers sweep would cost on the open editor market —
 *  session-42 market framing with real rate bands and the turnaround wait.
 *  Takes the raw counts so it works before the AuditSummary is assembled. */
function estimateMarketBillFor(findings: AuditFinding[], findingCounts: Record<AuditSeverity, number>, project: PatternProject): {
  low: number;
  high: number;
  hours: number;
  pending: number;
  waitDays: number;
  note: string;
} {
  const pending = findingCounts.error + findingCounts.warning;
  const hours = editorHoursFor(project);
  // Issue #31: the note must name the project's graded-size count, never
  // the findings count (a 9-size sweater with 2 findings must say
  // "9 graded sizes", and singular/plural must be correct).
  const sizeCount = gradedSizeCount(project);
  const sizesWord = sizeCount === 1 ? 'graded size' : 'graded sizes';
  // Clean patterns negotiate the lower half of the quote; outstanding
  // findings are exactly what an editor charges full rate to find.
  const lowFactor = pending > 0 ? 1 : 0.6;
  const low = Math.max(EDITOR_MARKET.rateLow, Math.round(EDITOR_MARKET.rateLow * hours * lowFactor));
  const high = Math.round(EDITOR_MARKET.rateHigh * hours);
  return {
    low,
    high,
    hours,
    pending,
    waitDays: EDITOR_MARKET.turnaroundDays,
    note: pending > 0
      ? `Editors charge $${EDITOR_MARKET.rateLow}–$${EDITOR_MARKET.rateHigh}/hr for this sweep (~${hours}h for ${sizeCount} ${sizesWord}) and document a real shortage — patterns wait ~${EDITOR_MARKET.turnaroundDays} days in queue. Resolve findings first to justify negotiating the lower end.`
      : `A human editor would quote $${low}–$${high} for the same ${hours}h of arithmetic, at ` + '$' + EDITOR_MARKET.rateLow + '–$' + EDITOR_MARKET.rateHigh + `/hr — and most would add a per-size premium. The numbers sweep is fully automatable; their flaw is charging hourly rates for arithmetic.`,
  };
}

/** Public wrapper for callers that already hold a finished AuditSummary. */
export function estimateMarketBill(summary: AuditSummary, project: PatternProject) {
  return estimateMarketBillFor(summary.findings, summary.findingCounts, project);
}

export function runTechEditAudit(project: PatternProject, config: AuditConfig = {}): AuditSummary {
  const checks = [
    checkGauge,
    checkBaseValues,
    checkSizeProgression,
    checkRoundingTolerance,
    checkRoundingRules,
    checkStitchCounts,
    checkMeasurementTyping,
    checkSizeCount,
    checkBaseStandardDrift,
    checkDuplicateLabels,
    checkRowGauge,
    checkCompleteness,
  ];
  const findings: AuditFinding[] = [];
  for (const check of checks) {
    findings.push(...check(project));
  }
  const findingCounts: Record<AuditSeverity, number> = { error: 0, warning: 0, info: 0, pass: 0 };
  for (const f of findings) findingCounts[f.severity]++;
  const deduction = findings.reduce((acc, f) => acc + SEVERITY_WEIGHT[f.severity], 0);
  const score = Math.max(0, Math.round(100 - deduction));
  const verdict = findingCounts.error > 0 ? 'fix' : findingCounts.warning > 0 ? 'check' : 'clean';
  const marketBill = estimateMarketBillFor(findings, findingCounts, project);
  return { findingCounts, score, verdict, findings, marketBill };
}

/** Money framing: what the arithmetic sweep is worth at human-editor rates.
 *  A sweater takes ~4 hours of editing; the numbers sweep is roughly the
 *  first 2 of those hours (StitchReader/r/AdvancedKnitting sizing). */
export function estimateEditorSavings(summary: AuditSummary, ratePerHour = DEFAULT_RATE): {
  hoursCovered: number;
  savings: number;
  note: string;
} {
  const hoursCovered = 2;
  const savings = Math.round(ratePerHour * hoursCovered);
  const pending = summary.findingCounts.error + summary.findingCounts.warning;
  const note = pending > 0
    ? `Resolve the ${pending} outstanding finding(s) above before a human editor touches the pattern — every one they don't have to find is billable time saved.`
    : `The numbers sweep is clean — a paid editor can now focus purely on the prose pass (style, abbreviations, clarity), which is the half of the bill that genuinely needs human eyes.`;
  return { hoursCovered, savings, note };
}

/** Paste-ready pre-edit summary for handing to a human tech editor — the
 *  "here's what's already checked" note that shrinks their scope (and
 *  justifies a lower quote). Their flaw (everything manual, Google-Doc
 *  back-and-forth, $20-40/hr for arithmetic) = our strength. */
export function generatePreEditSummary(project: PatternProject, summary: AuditSummary): string {
  const lines = [
    `PRE-EDIT SUMMARY — ${project.name}`,
    `Designer: ${project.author}`,
    `Base size: ${project.baseSize} | Gauge: ${project.gauge.stitchesPer4In}sts × ${project.gauge.rowsPer4In}rows / 4in (${project.gauge.unit})`,
    `Self tech-edit audit score: ${summary.score}/100 (${summary.verdict.toUpperCase()})`,
    '',
    'Already checked automatically (numbers sweep):',
    '  • gauge validity',
    '  • size progression monotonicity across all graded sizes',
    '  • stitch/row rounding vs repeat and parity constraints',
    '  • stitch count plausibility in every size',
    '  • measurement key vs type (width/length/circumference) consistency',
    '  • base values vs body standard for the base size',
    '  • duplicate labels, row gauge completeness',
    '',
    `Outstanding items (${summary.findingCounts.error + summary.findingCounts.warning}):`,
    ...summary.findings
      .filter(f => f.severity === 'error' || f.severity === 'warning')
      .map(f => `  • [${f.code}] ${f.location}: ${f.title} — ${f.detail}`),
    '',
    'What I still need from you (the prose pass): style/abbreviations consistency,',
    'clarity of instructions, UK/US spelling, cohesiveness with charts/schematics.',
  ];
  return lines.join('\n');
}

export { SIZE_STANDARDS } from './grading-engine';
